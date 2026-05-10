import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from accounts.models import Role

admin_role = Role.objects.get(name="ADMIN")
print(f"Role: {admin_role.name}")
print(f"Permissions: {admin_role.permissions}")
