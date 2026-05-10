import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from accounts.models import User

try:
    user = User.objects.get(email="onungae5@gmail.com")
    user.set_password("ElimuHub2026!")
    user.save()
    print("Password reset successful for onungae5@gmail.com")
except User.DoesNotExist:
    print("User not found")
