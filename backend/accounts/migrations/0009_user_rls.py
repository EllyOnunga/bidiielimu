from config.rls_migrations import CreateTenantRLSPolicy, EnableRLS
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0008_user_must_change_password"),
    ]

    operations = [
        EnableRLS("accounts_user"),
        CreateTenantRLSPolicy("accounts_user", tenant_column="school_id"),
    ]
