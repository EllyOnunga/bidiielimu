import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.test import RequestFactory

from accounts.models import Role, User
from hr.serializers import StaffProfileSerializer
from schools.models import School

# Create fake request
school, _ = School.objects.get_or_create(name="Test School")
super_admin, _ = User.objects.get_or_create(
    email="admin@test.com",
    defaults={"role": Role.objects.get(name="SUPER_ADMIN"), "school": school},
)
request = RequestFactory().post("/api/hr/staff/")
request.user = super_admin

data = {
    "first_name": "John",
    "last_name": "Doe",
    "email": "johndoe123@test.com",
    "role_name": "PRINCIPAL",
    "employee_id": "EMP123",
    "department": "Admin",
    "job_title": "Principal",
    "joining_date": "2023-01-01",
    "basic_salary": 50000,
    "status": "ACTIVE",
}

serializer = StaffProfileSerializer(data=data, context={"request": request})
if serializer.is_valid():
    try:
        serializer.save()
        print("Success:", serializer.data)
    except Exception as e:
        import traceback

        print("Error during save:", e)
        traceback.print_exc()
else:
    print("Validation Error:", serializer.errors)
