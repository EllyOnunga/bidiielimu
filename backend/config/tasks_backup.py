from celery import shared_task
from config.backup_manager import BackupManager
from django.conf import settings

@shared_task
def create_automated_backup(backup_type='full', tenant_schema=None):
    """
    Celery task to create automated backups
    """
    try:
        backup_manager = BackupManager()

        if backup_type in ['db', 'full']:
            backup_manager.create_database_backup(tenant_schema)

        if backup_type in ['media', 'full']:
            backup_manager.create_media_backup()

        if backup_type in ['config', 'full']:
            backup_manager.create_config_backup()

        # Cleanup old backups
        backup_manager.cleanup_old_backups(days_to_keep=30)

        return f"Backup completed successfully: {backup_type}"

    except Exception as e:
        # Log error and re-raise for Celery error handling
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Automated backup failed: {e}")
        raise

@shared_task
def cleanup_old_backups(days_to_keep=30):
    """
    Celery task to cleanup old backups
    """
    try:
        backup_manager = BackupManager()
        backup_manager.cleanup_old_backups(days_to_keep)
        return f"Cleanup completed: removed backups older than {days_to_keep} days"

    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Backup cleanup failed: {e}")
        raise