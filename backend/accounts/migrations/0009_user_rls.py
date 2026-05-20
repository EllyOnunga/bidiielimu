from django.db import migrations

from config.rls_migrations import CreateTenantRLSPolicy, EnableRLS


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0008_user_must_change_password"),
    ]

    operations = [
        EnableRLS("accounts_user"),
        CreateTenantRLSPolicy("accounts_user", tenant_column="school_id"),
    ]
