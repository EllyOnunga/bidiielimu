from django.db import migrations

from config.rls_migrations import CreateTenantRLSPolicy, EnableRLS


class Migration(migrations.Migration):

    dependencies = [
        ("schools", "0002_school_curriculum_school_status"),
    ]

    operations = [
        EnableRLS("schools_school"),
        # For the School table itself, the tenant ID is the primary key (id)
        CreateTenantRLSPolicy("schools_school", tenant_column="id"),
        EnableRLS("schools_domain"),
        # For the Domain table, the tenant is linked via tenant_id
        CreateTenantRLSPolicy("schools_domain", tenant_column="tenant_id"),
        EnableRLS("schools_subscription"),
        # For the Subscription table, the tenant is linked via school_id
        CreateTenantRLSPolicy("schools_subscription", tenant_column="school_id"),
    ]
