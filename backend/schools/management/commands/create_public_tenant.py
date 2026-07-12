from django.core.management.base import BaseCommand

from accounts.models import User
from schools.models import Domain, School


class Command(BaseCommand):
    help = "Creates the public tenant and domain if they do not exist"

    def handle(self, *args, **options):
        if not School.objects.filter(schema_name="public").exists():
            self.stdout.write("Creating public tenant...")
            public_tenant = School.objects.create(
                schema_name="public", name="GilaniOS Public", curriculum="CBC"
            )

            # Add localhost and common domains
            import os

            domain_list = os.environ.get("PUBLIC_TENANT_DOMAINS", "localhost,127.0.0.1")
            domains = [d.strip() for d in domain_list.split(",") if d.strip()]
            for domain_name in domains:
                Domain.objects.get_or_create(
                    domain=domain_name,
                    tenant=public_tenant,
                    is_primary=(domain_name == domains[-1]),
                )
            self.stdout.write(self.style.SUCCESS("Public tenant created successfully!"))
        else:
            self.stdout.write("Public tenant already exists.")

        # Create superuser if it doesn't exist
        if not User.objects.filter(is_superuser=True).exists():
            self.stdout.write("Creating superuser...")
            import os
            from django.conf import settings

            superuser_email = os.environ.get("SUPERUSER_EMAIL")
            superuser_password = os.environ.get("SUPERUSER_PASSWORD")

            if not superuser_email or not superuser_password:
                if settings.DEBUG:
                    self.stdout.write(
                        "Skipping superuser creation in DEBUG mode because SUPERUSER_EMAIL and SUPERUSER_PASSWORD are not set."
                    )
                    return
                raise ValueError(
                    "SUPERUSER_EMAIL and SUPERUSER_PASSWORD environment variables are required in production."
                )

            User.objects.create_superuser(
                email=superuser_email, password=superuser_password
            )
            self.stdout.write(self.style.SUCCESS("Superuser created successfully!"))
        else:
            self.stdout.write("Superuser already exists.")
