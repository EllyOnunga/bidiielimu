from django.core.management.base import BaseCommand
from schools.models import School, Domain


class Command(BaseCommand):
    help = 'Creates the public tenant and maps localhost to it (required for django-tenants to work locally)'

    def handle(self, *args, **kwargs):
        # Create or retrieve the public tenant
        tenant, created = School.objects.get_or_create(
            schema_name='public',
            defaults={
                'name': 'ElimuHub Platform',
                'contact_email': 'support@elimuhub.com',
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS('✅ Public tenant "ElimuHub Platform" created.'))
        else:
            self.stdout.write(self.style.WARNING('ℹ️  Public tenant already exists, skipping creation.'))

        # Map localhost to the public tenant
        for hostname in ['localhost', '127.0.0.1']:
            domain, dom_created = Domain.objects.get_or_create(
                domain=hostname,
                defaults={
                    'tenant': tenant,
                    'is_primary': hostname == 'localhost',
                }
            )
            if dom_created:
                self.stdout.write(self.style.SUCCESS(f'✅ Domain "{hostname}" mapped to public tenant.'))
            else:
                self.stdout.write(self.style.WARNING(f'ℹ️  Domain "{hostname}" already mapped.'))

        self.stdout.write(self.style.SUCCESS('\n🚀 Public tenant setup complete! API is now accessible at localhost:8000'))
