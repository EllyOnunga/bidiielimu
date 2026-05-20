import os

import django
from django.db import connection

from accounts.models import User

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()


print("--- Users and Schools ---")
for user in User.objects.all():
    print(f"Email: {
            user.email}, School ID: {
            user.school_id}, School Schema: {
                user.school.schema_name if user.school else 'None'}")

print(f"\nCurrent Schema: {connection.schema_name}")
