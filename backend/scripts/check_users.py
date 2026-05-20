import os

import django
from django_tenants.utils import schema_context

from accounts.models import User
from teachers.models import Teacher

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()


with schema_context("makini_school"):
    print(f"--- Schema: makini_school ---")
    u = User.objects.all()
    print(f"Total Users: {u.count()}")
    for user in u:
        print(
            f"User: {user.email}, Role: {user.role_name}, School ID: {user.school_id}"
        )

    t = Teacher.objects.all()
    print(f"Total Teachers: {t.count()}")
    for teacher in t:
        print(f"Teacher: {
                teacher.first_name} {
                teacher.last_name}, User: {
                teacher.user.email if teacher.user else 'No User'}")
