from config.rls_migrations import CreateSchemaRLSPolicy, EnableRLS
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("hr", "0001_initial"),
    ]

    operations = [
        EnableRLS("hr_staffprofile"),
        CreateSchemaRLSPolicy("hr_staffprofile"),
        EnableRLS("hr_payrollrecord"),
        CreateSchemaRLSPolicy("hr_payrollrecord"),
        EnableRLS("hr_leaverequest"),
        CreateSchemaRLSPolicy("hr_leaverequest"),
    ]
