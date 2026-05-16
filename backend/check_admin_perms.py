import os

import django
from accounts.models import Role

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()


admin_role = Role.objects.get(name="ADMIN")
print(f"Role: {admin_role.name}")
print(f"Permissions: {admin_role.permissions}")
