import gzip
import json
import os
from io import BytesIO, StringIO
from pathlib import Path

import boto3
from django.conf import settings
from django.core.management import call_command
from django.utils import timezone


class BackupManager:
    """
    Comprehensive backup management system
    """

    def __init__(self):
        self.s3_client = None
        if settings.AWS_ACCESS_KEY_ID:
            self.s3_client = boto3.client(
                "s3",
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_S3_REGION_NAME,
            )
        self.backup_dir = Path(settings.BASE_DIR) / "backups"
        self.backup_dir.mkdir(exist_ok=True)

    def create_database_backup(self, tenant_schema=None):
        """
        Create database backup for specific tenant or all tenants
        """
        timestamp = timezone.now().strftime("%Y%m%d_%H%M%S")

        if tenant_schema:
            filename = f"db_backup_{tenant_schema}_{timestamp}.sql.gz"
        else:
            filename = f"db_backup_full_{timestamp}.sql.gz"

        filepath = self.backup_dir / filename

        try:
            # Use pg_dump for PostgreSQL
            import subprocess

            cmd = [
                "pg_dump",
                "--host",
                os.getenv("DB_HOST", "localhost"),
                "--port",
                os.getenv("DB_PORT", "5432"),
                "--username",
                os.getenv("DB_USER", "postgres"),
                "--dbname",
                os.getenv("DB_NAME", "elimuhubdb"),
                "--compress",
                "9",
                "--format",
                "c",  # Custom format
                "--file",
                str(filepath),
            ]

            if tenant_schema:
                cmd.extend(["--schema", tenant_schema])

            env = os.environ.copy()
            env["PGPASSWORD"] = os.getenv("DB_PASSWORD", "")

            result = subprocess.run(cmd, env=env, capture_output=True, text=True)

            if result.returncode == 0:
                self._upload_to_s3(filepath, f"database/{filename}")
                return filepath
            else:
                raise Exception(f"Database backup failed: {result.stderr}")

        except Exception as e:
            print(f"Database backup error: {e}")
            raise

    def create_media_backup(self):
        """
        Create backup of media files
        """
        timestamp = timezone.now().strftime("%Y%m%d_%H%M%S")
        filename = f"media_backup_{timestamp}.tar.gz"
        filepath = self.backup_dir / filename

        try:
            import subprocess

            # Create tar.gz archive of media directory
            cmd = [
                "tar",
                "-czf",
                str(filepath),
                "-C",
                str(settings.MEDIA_ROOT.parent),
                settings.MEDIA_ROOT.name,
            ]

            result = subprocess.run(cmd, capture_output=True, text=True)

            if result.returncode == 0:
                self._upload_to_s3(filepath, f"media/{filename}")
                return filepath
            else:
                raise Exception(f"Media backup failed: {result.stderr}")

        except Exception as e:
            print(f"Media backup error: {e}")
            raise

    def create_config_backup(self):
        """
        Backup configuration and environment files
        """
        timestamp = timezone.now().strftime("%Y%m%d_%H%M%S")
        config_data = {
            "timestamp": timestamp,
            "environment": os.getenv("DJANGO_SETTINGS_MODULE", "unknown"),
            "database_config": {
                "engine": settings.DATABASES["default"].get("ENGINE"),
                "host": settings.DATABASES["default"].get("HOST"),
                "port": settings.DATABASES["default"].get("PORT"),
                "name": settings.DATABASES["default"].get("NAME"),
            },
            "installed_apps": settings.INSTALLED_APPS,
            "middleware": settings.MIDDLEWARE,
        }

        filename = f"config_backup_{timestamp}.json.gz"
        filepath = self.backup_dir / filename

        try:
            # Compress and save config
            json_str = json.dumps(config_data, indent=2, default=str)
            with gzip.open(filepath, "wt", encoding="utf-8") as f:
                f.write(json_str)

            self._upload_to_s3(filepath, f"config/{filename}")
            return filepath

        except Exception as e:
            print(f"Config backup error: {e}")
            raise

    def restore_database_backup(self, backup_file, tenant_schema=None):
        """
        Restore database from backup
        """
        try:
            import subprocess

            cmd = [
                "pg_restore",
                "--host",
                os.getenv("DB_HOST", "localhost"),
                "--port",
                os.getenv("DB_PORT", "5432"),
                "--username",
                os.getenv("DB_USER", "postgres"),
                "--dbname",
                os.getenv("DB_NAME", "elimuhubdb"),
                "--clean",
                "--if-exists",
                str(backup_file),
            ]

            if tenant_schema:
                cmd.extend(["--schema", tenant_schema])

            env = os.environ.copy()
            env["PGPASSWORD"] = os.getenv("DB_PASSWORD", "")

            result = subprocess.run(cmd, env=env, capture_output=True, text=True)

            if result.returncode != 0:
                raise Exception(f"Database restore failed: {result.stderr}")

        except Exception as e:
            print(f"Database restore error: {e}")
            raise

    def cleanup_old_backups(self, days_to_keep=30):
        """
        Remove backups older than specified days
        """
        cutoff_date = timezone.now() - timezone.timedelta(days=days_to_keep)

        # Clean local files
        for filepath in self.backup_dir.glob("*"):
            if filepath.stat().st_mtime < cutoff_date.timestamp():
                filepath.unlink()

        # Clean S3 files if configured
        if self.s3_client and settings.AWS_STORAGE_BUCKET_NAME:
            try:
                # List and delete old objects
                paginator = self.s3_client.get_paginator("list_objects_v2")
                for page in paginator.paginate(
                    Bucket=settings.AWS_STORAGE_BUCKET_NAME, Prefix="backups/"
                ):
                    for obj in page.get("Contents", []):
                        if obj["LastModified"] < cutoff_date:
                            self.s3_client.delete_object(
                                Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=obj["Key"]
                            )
            except Exception as e:
                print(f"S3 cleanup error: {e}")

    def _upload_to_s3(self, filepath, s3_key):
        """
        Upload file to S3 if configured
        """
        if self.s3_client and settings.AWS_STORAGE_BUCKET_NAME:
            try:
                self.s3_client.upload_file(
                    str(filepath), settings.AWS_STORAGE_BUCKET_NAME, f"backups/{s3_key}"
                )
            except Exception as e:
                print(f"S3 upload error: {e}")
                raise
