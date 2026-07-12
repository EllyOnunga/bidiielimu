import os
import logging

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django_tenants.utils import schema_context

from accounts.models import User

logger = logging.getLogger(__name__)

with schema_context("public"):
    user = User.objects.filter(role__name="SUPER_ADMIN").first()
    if user:
        from rest_framework.authtoken.models import Token

        token, _ = Token.objects.get_or_create(user=user)
        logger.info("TOKEN: %s", token.key)
    else:
        logger.warning("No super admin found!")
