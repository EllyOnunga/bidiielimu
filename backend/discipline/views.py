from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets

from .models import DisciplineIncident
from .serializers import DisciplineIncidentSerializer


class DisciplineIncidentViewSet(viewsets.ModelViewSet):
    queryset = DisciplineIncident.objects.all()
    serializer_class = DisciplineIncidentSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["student", "category", "status", "date"]
    search_fields = [
        "summary",
        "description",
        "student__first_name",
        "student__last_name",
    ]
    ordering_fields = ["date", "created_at"]

    def get_queryset(self):
        # Additional filtering could be added here if needed
        return super().get_queryset()
