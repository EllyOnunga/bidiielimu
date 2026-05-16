from config.rls_migrations import CreateSchemaRLSPolicy, EnableRLS
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("students", "0001_initial"),
    ]

    operations = [
        EnableRLS("students_student"),
        CreateSchemaRLSPolicy("students_student"),
        EnableRLS("students_guardian"),
        CreateSchemaRLSPolicy("students_guardian"),
        EnableRLS("students_medicalrecord"),
        CreateSchemaRLSPolicy("students_medicalrecord"),
        EnableRLS("students_studenttransfer"),
        CreateSchemaRLSPolicy("students_studenttransfer"),
    ]
