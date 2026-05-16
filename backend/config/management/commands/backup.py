from config.backup_manager import BackupManager
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create database backup"

    def add_arguments(self, parser):
        parser.add_argument(
            "--tenant",
            type=str,
            help="Tenant schema name to backup",
        )
        parser.add_argument(
            "--type",
            type=str,
            choices=["db", "media", "config", "full"],
            default="full",
            help="Type of backup to create",
        )

    def handle(self, *args, **options):
        backup_manager = BackupManager()
        tenant = options["tenant"]
        backup_type = options["type"]

        try:
            if backup_type in ["db", "full"]:
                self.stdout.write("Creating database backup...")
                db_backup = backup_manager.create_database_backup(tenant)
                self.stdout.write(
                    self.style.SUCCESS(f"Database backup created: {db_backup}")
                )

            if backup_type in ["media", "full"]:
                self.stdout.write("Creating media backup...")
                media_backup = backup_manager.create_media_backup()
                self.stdout.write(
                    self.style.SUCCESS(f"Media backup created: {media_backup}")
                )

            if backup_type in ["config", "full"]:
                self.stdout.write("Creating config backup...")
                config_backup = backup_manager.create_config_backup()
                self.stdout.write(
                    self.style.SUCCESS(f"Config backup created: {config_backup}")
                )

            self.stdout.write(self.style.SUCCESS("All backups completed successfully!"))

        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Backup failed: {e}"))
            raise
