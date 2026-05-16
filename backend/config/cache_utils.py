from django.db import connection


def make_tenant_aware_key(key, key_prefix, version):
    """
    Generate a tenant-aware cache key by prefixing it with the current schema name.
    """
    # Get current tenant schema name
    schema_name = (
        connection.schema_name if hasattr(connection, "schema_name") else "public"
    )

    # Create the tenant-prefixed key
    # Format: schema:version:key_prefix:key
    return f"{schema_name}:{version}:{key_prefix}:{key}"
