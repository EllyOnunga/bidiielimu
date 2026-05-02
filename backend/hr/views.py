from rest_framework import viewsets, permissions
from .models import StaffProfile, PayrollRecord, LeaveRequest
from .serializers import StaffProfileSerializer, PayrollRecordSerializer, LeaveRequestSerializer

class StaffProfileViewSet(viewsets.ModelViewSet):
    serializer_class = StaffProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'SUPER_ADMIN', 'PRINCIPAL']:
            return StaffProfile.objects.all()
        return StaffProfile.objects.filter(user=user)

class PayrollRecordViewSet(viewsets.ModelViewSet):
    serializer_class = PayrollRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'SUPER_ADMIN', 'PRINCIPAL']:
            return PayrollRecord.objects.all()
        return PayrollRecord.objects.filter(staff__user=user)

class LeaveRequestViewSet(viewsets.ModelViewSet):
    serializer_class = LeaveRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'SUPER_ADMIN', 'PRINCIPAL']:
            return LeaveRequest.objects.all()
        return LeaveRequest.objects.filter(staff__user=user)
