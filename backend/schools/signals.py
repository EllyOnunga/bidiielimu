from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.management import call_command
from django_tenants.utils import schema_context
from .models import School

@receiver(post_save, sender=School)
def on_tenant_creation(sender, instance, created, **kwargs):
    if created and instance.schema_name != 'public':
        # We use schema_context to ensure we are running in the right schema
        with schema_context(instance.schema_name):
            try:
                # Seed the onboarding data
                call_command('seed_onboarding_data')
                print(f"Successfully seeded onboarding data for {instance.name}")
            except Exception as e:
                print(f"Error seeding data for {instance.name}: {e}")
