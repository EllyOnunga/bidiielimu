from django.db import connection
from rest_framework import generics, permissions
from rest_framework.response import Response

from .models import School, SchoolSetting


class TenantThemeView(generics.GenericAPIView):
    """
    Unauthenticated endpoint that returns the public branding details for the current tenant.
    """

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request, *args, **kwargs):
        if connection.schema_name == "public":
            return Response(
                {
                    "school_name": "ElimuHub Platform",
                    "primary_color": "#2DD4BF",
                    "logo_url": None,
                    "schema_name": "public",
                }
            )

        try:
            school = School.objects.get(schema_name=connection.schema_name)
            settings_obj = SchoolSetting.objects.first()

            return Response(
                {
                    "school_name": school.name,
                    "primary_color": (
                        settings_obj.accent_color if settings_obj else "#6366f1"
                    ),
                    "logo_url": (
                        request.build_absolute_uri(school.logo.url)
                        if school.logo
                        else None
                    ),
                    "schema_name": school.schema_name,
                }
            )
        except Exception:
            return Response(
                {
                    "school_name": "ElimuHub",
                    "primary_color": "#6366f1",
                    "schema_name": "public",
                }
            )
