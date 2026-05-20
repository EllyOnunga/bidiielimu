from rest_framework import serializers


class TenantSerializerMixin:
    """
    A mixin for serializers to automatically restrict all PrimaryKeyRelatedField
    querysets to the user's school.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if "request" not in self.context:
            return

        user = self.context["request"].user
        if not hasattr(user, "school") or not user.school:
            return

        school = user.school

        # Loop through all fields and restrict querysets for related fields
        for field_name, field in self.fields.items():
            if isinstance(field, serializers.PrimaryKeyRelatedField):
                if field.queryset is None:
                    continue
                if hasattr(field.queryset.model, "school"):
                    field.queryset = field.queryset.filter(school=school)
                elif hasattr(field.queryset.model, "grade_level") and hasattr(
                    field.queryset.model.grade_level.field.related_model, "school"
                ):
                    # Handle cases like Stream which link to GradeLevel
                    field.queryset = field.queryset.filter(grade_level__school=school)
                elif hasattr(field.queryset.model, "exam") and hasattr(
                    field.queryset.model.exam.field.related_model, "school"
                ):
                    # Handle Marks which link to Exams
                    field.queryset = field.queryset.filter(exam__school=school)


import math

from django.db import connection


def verify_location(student_lat, student_lon, school=None):
    """
    Verifies if a student is within the school's geofenced boundaries.
    """
    if not school:
        school = getattr(connection, "tenant", None)

    if (
        not school
        or not hasattr(school, "latitude")
        or school.latitude is None
        or school.longitude is None
    ):
        # Default to True if geofencing is not configured for the tenant
        return True

    if student_lat is None or student_lon is None:
        return False

    try:
        lat1, lon1 = float(student_lat), float(student_lon)
        lat2, lon2 = float(school.latitude), float(school.longitude)
    except (ValueError, TypeError):
        return False

    # Haversine Formula
    R = 6371000  # Radius of Earth in meters
    phi_1 = math.radians(lat1)
    phi_2 = math.radians(lat2)

    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi_1) * math.cos(phi_2) * math.sin(delta_lambda / 2.0) ** 2
    )

    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    distance = R * c  # distance in meters

    return distance <= school.geofence_radius
