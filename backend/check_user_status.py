import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from accounts.models import User

for user in User.objects.all():
    print(
        f"Email: {user.email}, IsActive: {user.is_active}, IsVerified: {user.is_email_verified}"
    )
