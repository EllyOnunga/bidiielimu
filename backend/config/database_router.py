class DatabaseRouter:
    """
    Database router for read/write splitting and multi-tenant isolation
    """

    def db_for_read(self, model, **hints):
        """
        Direct read operations to read database
        """
        # For now, use default database
        # In production with replication, this would route to read replicas
        return 'read'

    def db_for_write(self, model, **hints):
        """
        Direct write operations to write database
        """
        return 'default'

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
        if app_label in ['schools', 'accounts', 'audit']:
            # Shared apps across tenants - only migrate on default
            return db == 'default'
        else:
            # Tenant-specific apps - migrate on all databases
            return True