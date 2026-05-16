from config.rls_migrations import CreateSchemaRLSPolicy, EnableRLS
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("exams", "0003_exam_exams_exam_start_d_281c9a_idx_and_more"),
    ]

    operations = [
        EnableRLS("exams_exam"),
        CreateSchemaRLSPolicy("exams_exam"),
        EnableRLS("exams_mark"),
        CreateSchemaRLSPolicy("exams_mark"),
        EnableRLS("exams_gradingsystem"),
        CreateSchemaRLSPolicy("exams_gradingsystem"),
        EnableRLS("exams_gradethreshold"),
        CreateSchemaRLSPolicy("exams_gradethreshold"),
        EnableRLS("exams_examranking"),
        CreateSchemaRLSPolicy("exams_examranking"),
        EnableRLS("exams_cbcassessment"),
        CreateSchemaRLSPolicy("exams_cbcassessment"),
    ]
