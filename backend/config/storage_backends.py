from django.conf import settings
from storages.backends.s3boto3 import S3Boto3Storage


class StaticStorage(S3Boto3Storage):
    location = settings.STATIC_LOCATION
    default_acl = "public-read"
    custom_domain = getattr(settings, "STATIC_CDN_DOMAIN", None)


class MediaStorage(S3Boto3Storage):
    file_overwrite = False
    default_acl = "private"
    custom_domain = getattr(settings, "MEDIA_CDN_DOMAIN", None)

    @property
    def location(self):
        from django.db import connection

        schema_name = getattr(connection, "schema_name", "public")
        return f"{settings.PUBLIC_MEDIA_LOCATION}/{schema_name}"
