class DatabaseRouter:
    """
    Database router for read/write splitting and multi-tenant isolation
    """

    def db_for_read(self, model, **hints):
        """
        Direct read operations to read database if available.
        Tenant-specific models MUST use the 'default' connection since schema
        switching only affects the active connection.
        """
        import sys

        if "test" in sys.argv:
            return "default"

        # If the app is not a shared public app, it must use the active schema on 'default'
        if model._meta.app_label not in ["schools", "accounts", "audit"]:
            return "default"

        from django.conf import settings

        if "read" in settings.DATABASES:
            return "read"
        return "default"

    def db_for_write(self, model, **hints):
        """
        Direct write operations to write database
        """
        return "default"

    def allow_relation(self, obj1, obj2, **hints):
        """
        Allow relations if both objects are in the same database
        """
        db_obj1 = self.db_for_write(obj1.__class__, instance=obj1)
        db_obj2 = self.db_for_write(obj2.__class__, instance=obj2)
        return db_obj1 == db_obj2

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """
        Allow migrations on all databases for tenant models
        For shared apps, only allow on default database
        """
        if app_label in ["schools", "accounts", "audit"]:
            # Shared apps across tenants - only migrate on default
            return db == "default"
        else:
            # Tenant-specific apps - migrate on all databases
            return True
