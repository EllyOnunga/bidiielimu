from django.db import migrations

from config.rls_migrations import CreateSchemaRLSPolicy, EnableRLS


class Migration(migrations.Migration):

    dependencies = [
        ("fees", "0003_alter_feepayment_payment_date_and_more"),
    ]

    operations = [
        EnableRLS("fees_feestructure"),
        CreateSchemaRLSPolicy("fees_feestructure"),
        EnableRLS("fees_invoice"),
        CreateSchemaRLSPolicy("fees_invoice"),
        EnableRLS("fees_feepayment"),
        CreateSchemaRLSPolicy("fees_feepayment"),
        EnableRLS("fees_financialaid"),
        CreateSchemaRLSPolicy("fees_financialaid"),
    ]
