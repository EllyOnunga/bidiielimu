import os

import django
from django.db import connection

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from schools.models import Domain, School

print("--- Schools ---")
for school in School.objects.all():
    print(f"Name: {school.name}, Schema: {school.schema_name}")

print("\n--- Domains ---")
for domain in Domain.objects.all():
    print(f"Domain: {domain.domain}, Tenant: {domain.tenant.schema_name}")

print(f"\nCurrent Schema: {connection.schema_name}")
