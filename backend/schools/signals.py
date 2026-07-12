import logging
from django.core.management import call_command
from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver
from django_tenants.utils import schema_context

from .models import School

logger = logging.getLogger(__name__)


@receiver(post_save, sender=School)
def on_tenant_creation(sender, instance, created, **kwargs):
    if created and instance.schema_name != "public":

        def seed_data():
            # We use schema_context to ensure we are running in the right schema
            with schema_context(instance.schema_name):
                try:
                    # Seed the onboarding data
                    call_command("seed_onboarding_data")
                    logger.info(
                        "Successfully seeded onboarding data for %s", instance.name
                    )
                except Exception:
                    logger.exception("Error seeding data for %s", instance.name)

        # Run seeding after transaction is committed to avoid poisoning the transaction
        # In tests using TestCase, this will not run, which is often desired for speed.
        transaction.on_commit(seed_data)
