from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import StaffProfile, PayrollRecord, LeaveRequest
from .serializers import StaffProfileSerializer, PayrollRecordSerializer, LeaveRequestSerializer
from datetime import timedelta

class StaffProfileViewSet(viewsets.ModelViewSet):
    serializer_class = StaffProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role_name and user.role_name in ['ADMIN', 'SUPER_ADMIN', 'PRINCIPAL']:
            return StaffProfile.objects.all()
        return StaffProfile.objects.filter(user=user)

class PayrollRecordViewSet(viewsets.ModelViewSet):
    serializer_class = PayrollRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role_name and user.role_name in ['ADMIN', 'SUPER_ADMIN', 'PRINCIPAL']:
            return PayrollRecord.objects.all()
        return PayrollRecord.objects.filter(staff__user=user)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        from django.db.models import Sum, Count
        from django.utils import timezone
        
        now = timezone.now()
        current_payroll = PayrollRecord.objects.filter(month=now.month, year=now.year)
        
        total_net = current_payroll.aggregate(total=Sum('net_salary'))['total'] or 0
        total_deductions = current_payroll.aggregate(total=Sum('deductions'))['total'] or 0
        total_tax = current_payroll.aggregate(total=Sum('gross_salary'))['total'] or 0 
        employee_count = current_payroll.count()
        
        # Monthly trend (last 5 months)
        trend_data = []
        for i in range(5):
            month_date = now - timedelta(days=30*i)
            m, y = month_date.month, month_date.year
            month_sum = PayrollRecord.objects.filter(month=m, year=y).aggregate(total=Sum('net_salary'))['total'] or 0
            from calendar import month_name
            trend_data.append({
                "month": month_name[m][:3],
                "amount": float(month_sum)
            })
        
        return Response({
            "total_monthly_net": float(total_net),
            "total_deductions": float(total_deductions),
            "total_tax": float(total_tax * 0.15),
            "employee_count": employee_count,
            "trend": list(reversed(trend_data))
        })

class LeaveRequestViewSet(viewsets.ModelViewSet):
    serializer_class = LeaveRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role_name and user.role_name in ['ADMIN', 'SUPER_ADMIN', 'PRINCIPAL']:
            return LeaveRequest.objects.all().select_related('staff__user')
        return LeaveRequest.objects.filter(staff__user=user)

    @action(detail=False, methods=['get'])
    def recent(self, request):
        qs = self.get_queryset().order_by('-start_date')[:5]
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)
