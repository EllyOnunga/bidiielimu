from datetime import timedelta

from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import LeaveRequest, PayrollRecord, StaffProfile
from .serializers import (
    LeaveRequestSerializer,
    PayrollRecordSerializer,
    StaffProfileSerializer,
)


class StaffProfileViewSet(viewsets.ModelViewSet):
    serializer_class = StaffProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role_name and user.role_name in ["ADMIN", "SUPER_ADMIN", "PRINCIPAL"]:
            return StaffProfile.objects.all()
        return StaffProfile.objects.filter(user=user)


class PayrollRecordViewSet(viewsets.ModelViewSet):
    serializer_class = PayrollRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role_name and user.role_name in ["ADMIN", "SUPER_ADMIN", "PRINCIPAL"]:
            return PayrollRecord.objects.all()
        return PayrollRecord.objects.filter(staff__user=user)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        from django.db.models import Sum
        from django.utils import timezone

        now = timezone.now()
        current_payroll = PayrollRecord.objects.filter(month=now.month, year=now.year)

        total_net = current_payroll.aggregate(total=Sum("net_salary"))["total"] or 0
        total_deductions = (
            current_payroll.aggregate(total=Sum("deductions"))["total"] or 0
        )
        total_tax = current_payroll.aggregate(total=Sum("gross_salary"))["total"] or 0
        employee_count = current_payroll.count()

        # Monthly trend (last 5 months)
        trend_data = []
        for i in range(5):
            month_date = now - timedelta(days=30 * i)
            m, y = month_date.month, month_date.year
            month_sum = (
                PayrollRecord.objects.filter(month=m, year=y).aggregate(
                    total=Sum("net_salary")
                )["total"]
                or 0
            )
            from calendar import month_name

            trend_data.append({"month": month_name[m][:3], "amount": float(month_sum)})

        return Response(
            {
                "total_monthly_net": float(total_net),
                "total_deductions": float(total_deductions),
                "total_tax": float(total_tax * 0.15),
                "employee_count": employee_count,
                "trend": list(reversed(trend_data)),
            }
        )

    @action(detail=False, methods=["post"])
    def run_payroll(self, request):
        from decimal import Decimal

        from django.utils import timezone

        from .models import PayrollRecord, StaffProfile

        now = timezone.now()
        active_staff = StaffProfile.objects.filter(status="ACTIVE")
        created_count = 0

        for staff in active_staff:
            if not PayrollRecord.objects.filter(
                staff=staff, month=now.month, year=now.year
            ).exists():
                gross = staff.basic_salary
                shif = gross * Decimal("0.0275")
                housing_levy = gross * Decimal("0.015")
                nssf = Decimal("400.00")
                deductions = shif + housing_levy + nssf
                net_salary = gross - deductions

                PayrollRecord.objects.create(
                    staff=staff,
                    month=now.month,
                    year=now.year,
                    gross_salary=gross,
                    deductions=deductions,
                    net_salary=net_salary,
                    is_paid=True,
                    paid_at=now,
                )
                created_count += 1

        return Response(
            {
                "detail": f"Successfully processed payroll for {created_count} staff members."
            }
        )


class LeaveRequestViewSet(viewsets.ModelViewSet):
    serializer_class = LeaveRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def ensure_teacher_staff_profile(self, user):
        try:
            return user.hr_staff_profile
        except StaffProfile.DoesNotExist:
            try:
                teacher = user.teacher_profile
                return StaffProfile.objects.create(
                    user=user,
                    employee_id=teacher.employee_id,
                    department="Academics",
                    job_title=teacher.designation or "Teacher",
                    joining_date=teacher.joining_date,
                    basic_salary=teacher.basic_salary,
                    status="ACTIVE",
                )
            except Exception:
                return StaffProfile.objects.create(
                    user=user,
                    employee_id=f"TCH-{user.id}",
                    department="Academics",
                    job_title="Teacher",
                    joining_date=user.date_joined.date(),
                    basic_salary=0.00,
                    status="ACTIVE",
                )

    def get_queryset(self):
        user = self.request.user
        if user.role_name == "TEACHER":
            self.ensure_teacher_staff_profile(user)

        if user.role_name and user.role_name in ["ADMIN", "SUPER_ADMIN", "PRINCIPAL"]:
            return LeaveRequest.objects.all().select_related("staff__user")
        return LeaveRequest.objects.filter(staff__user=user)

    def perform_create(self, serializer):
        user = self.request.user
        if user.role_name == "TEACHER":
            staff_profile = self.ensure_teacher_staff_profile(user)
        else:
            try:
                staff_profile = user.hr_staff_profile
            except StaffProfile.DoesNotExist:
                staff_profile = StaffProfile.objects.create(
                    user=user,
                    employee_id=f"STF-{user.id}",
                    department="Administration",
                    job_title=user.role_name or "Staff",
                    joining_date=user.date_joined.date(),
                    basic_salary=0.00,
                    status="ACTIVE",
                )
        serializer.save(staff=staff_profile)

    @action(detail=False, methods=["get"])
    def recent(self, request):
        qs = self.get_queryset().order_by("-start_date")[:5]
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        user = request.user
        if not (
            user.role_name and user.role_name in ["ADMIN", "SUPER_ADMIN", "PRINCIPAL"]
        ):
            return Response({"detail": "Permission denied."}, status=403)

        leave_request = self.get_object()
        leave_request.status = "APPROVED"
        leave_request.save()
        return Response(
            {"detail": "Leave request approved successfully.", "status": "APPROVED"}
        )

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        user = request.user
        if not (
            user.role_name and user.role_name in ["ADMIN", "SUPER_ADMIN", "PRINCIPAL"]
        ):
            return Response({"detail": "Permission denied."}, status=403)

        leave_request = self.get_object()
        leave_request.status = "REJECTED"
        leave_request.save()
        return Response(
            {"detail": "Leave request rejected successfully.", "status": "REJECTED"}
        )
