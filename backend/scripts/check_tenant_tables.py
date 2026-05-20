import os

import django
from django.db import connection

from schools.models import School

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()


tenant = School.objects.get(schema_name="allain_academy")
connection.set_tenant(tenant)

print(f"Current schema: {connection.schema_name}")

with connection.cursor() as cursor:
    cursor.execute(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = %s",
        [connection.schema_name],
    )
    tables = cursor.fetchall()
    for table in tables:
        print(f"Table: {table[0]}")
