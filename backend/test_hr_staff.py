import sys

print("START", file=sys.stderr)
import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

print("DJANGO SETUP DONE", file=sys.stderr)

from django_tenants.utils import schema_context
from rest_framework.test import APIRequestFactory

from accounts.models import Role, User
from hr.serializers import StaffProfileSerializer
from schools.models import School

tenant = School.objects.exclude(schema_name="public").first()
if not tenant:
    print("No tenant found!")
else:
    print("TENANT:", tenant.schema_name)
    with schema_context(tenant.schema_name):
        admin = User.objects.first()
        factory = APIRequestFactory()
        request = factory.post("/api/hr/staff/")
        request.user = admin

        data = {
            "first_name": "Test",
            "last_name": "Principal",
            "email": "principal2@test.com",
            "role_name": "PRINCIPAL",
            "employee_id": "EMP_PRIN_02",
            "department": "Administration",
            "job_title": "Principal",
            "joining_date": "2023-01-01",
            "basic_salary": 50000,
            "status": "ACTIVE",
        }

        serializer = StaffProfileSerializer(data=data, context={"request": request})
        if serializer.is_valid():
            try:
                serializer.save()
                print("SUCCESS!")
            except Exception as e:
                import traceback

                print("EXCEPTION DURING SAVE:")
                traceback.print_exc()
        else:
            print("VALIDATION ERRORS:")
            print(serializer.errors)
