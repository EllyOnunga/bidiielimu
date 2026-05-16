from config.rls_migrations import CreateSchemaRLSPolicy, EnableRLS
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("audit", "0002_auditlog_audit_audit_timesta_19e18a_idx_and_more"),
    ]

    operations = [
        EnableRLS("audit_auditlog"),
        CreateSchemaRLSPolicy("audit_auditlog"),
    ]
