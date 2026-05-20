import os

import django

from accounts.models import User

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()


for user in User.objects.all():
    print(f"Email: {
            user.email}, IsActive: {
            user.is_active}, IsVerified: {
                user.is_email_verified}")
