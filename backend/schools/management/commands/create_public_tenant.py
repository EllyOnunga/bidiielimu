from django.core.management.base import BaseCommand
from schools.models import School, Domain

class Command(BaseCommand):
    help = 'Creates the public tenant and domain if they do not exist'

    def handle(self, *args, **options):
        if not School.objects.filter(schema_name='public').exists():
            self.stdout.write('Creating public tenant...')
            public_tenant = School.objects.create(
                schema_name='public',
                name='ElimuHub Public',
                curriculum='CBC'
            )
            
            # Add localhost and common domains
            domains = ['localhost', '127.0.0.1', 'elimuhub-backend.onrender.com']
            for domain_name in domains:
                Domain.objects.get_or_create(
                    domain=domain_name,
                    tenant=public_tenant,
                    is_primary=(domain_name == 'elimuhub-backend.onrender.com')
                )
            self.stdout.write(self.style.SUCCESS('Public tenant created successfully!'))
        else:
            self.stdout.write('Public tenant already exists.')
