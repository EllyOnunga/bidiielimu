from django.db import migrations


class EnableRLS(migrations.RunSQL):
    """
    Migration operation to enable RLS on a table.
    """

    def __init__(self, table_name):
        sql = f"ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;"
        reverse_sql = f"ALTER TABLE {table_name} DISABLE ROW LEVEL SECURITY;"
        super().__init__(sql, reverse_sql)


class CreateTenantRLSPolicy(migrations.RunSQL):
    """
    Migration operation to create a tenant-based RLS policy.
    Assumes the table has a 'school_id' column or similar.
    """

    def __init__(self, table_name, tenant_column="school_id"):
        policy_name = f"{table_name}_tenant_isolation"

        # Policy for SELECT, INSERT, UPDATE, DELETE
        # Using current_setting('app.current_tenant_id') which we set in middleware
        sql = f"""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '{policy_name}') THEN
                CREATE POLICY {policy_name} ON {table_name}
                USING (
                    {tenant_column}::text = current_setting('app.current_tenant_id', true)
                    OR current_setting('app.current_tenant_id', true) = ''
                );
            END IF;
        END $$;
        """
        reverse_sql = f"DROP POLICY IF EXISTS {policy_name} ON {table_name};"
        super().__init__(sql, reverse_sql)


class CreateSchemaRLSPolicy(migrations.RunSQL):
    """
    Migration operation to create a schema-based RLS policy.
    Useful for tenant-specific tables that don't have a tenant column.
    """

    def __init__(self, table_name):
        policy_name = f"{table_name}_schema_isolation"

        # Policy checks if the current schema matches the search_path
        sql = f"""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '{policy_name}') THEN
                CREATE POLICY {policy_name} ON {table_name}
                USING (current_schema() = current_setting('search_path', true));
            END IF;
        END $$;
        """
        reverse_sql = f"DROP POLICY IF EXISTS {policy_name} ON {table_name};"
        super().__init__(sql, reverse_sql)
