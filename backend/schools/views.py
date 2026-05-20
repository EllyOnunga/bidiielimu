import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

from django.db.models import Avg, Count, Q, Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.models import User
from attendance.models import DailyAttendance
from classes.models import Stream
from config.caching import cache_response
from config.tenant_security import StrictTenantPermission, TenantAwareViewSetMixin
from exams.models import Mark
from fees.models import FeePayment
from students.models import Student
from teachers.models import Teacher

from .models import School, SchoolSetting, Subscription
from .serializers import (
    SchoolSerializer,
    SchoolSettingSerializer,
    SubscriptionSerializer,
)


class SchoolViewSet(TenantAwareViewSetMixin, viewsets.ModelViewSet):
    serializer_class = SchoolSerializer
    permission_classes = [permissions.IsAuthenticated, StrictTenantPermission]

    def get_queryset(self):
        from django.db import connection

        if connection.schema_name == "public":
            return School.objects.exclude(schema_name="public")
        return School.objects.filter(schema_name=connection.schema_name)

    def perform_create(self, serializer):
        from schools.models import Domain

        tenant = serializer.save()
        domain_name = self.request.data.get(
            "domain_url", f"{tenant.schema_name}.elimuhub.com"
        )
        Domain.objects.create(domain=domain_name, tenant=tenant, is_primary=True)

    @action(detail=False, methods=["get"])
    @cache_response(timeout=600)  # Cache for 10 minutes
    def dashboard_stats(self, request):
        school = request.user.school
        if not school:
            return Response({"detail": "No school assigned to user."}, status=400)

        staff_roles = ["ADMIN", "PRINCIPAL", "HOD", "TEACHER", "FINANCE", "LIBRARIAN"]
        if request.user.role_name not in staff_roles:
            return Response({"detail": "Permission denied."}, status=403)

        # Count active students
        student_count = Student.objects.filter(is_active=True).count()

        # Count active teachers
        teacher_count = Teacher.objects.filter(is_active=True).count()

        # Count active streams (classes)
        class_count = Stream.objects.count()

        # REAL FINANCIAL DATA

        # Calculate Total Fees Collected
        total_fees = FeePayment.objects.aggregate(total=Sum("amount"))["total"] or 0

        # Calculate Revenue Trend for the last 6 months
        six_months_ago = datetime.now() - timedelta(days=180)
        monthly_revenue = (
            FeePayment.objects.filter(payment_date__gte=six_months_ago)
            .annotate(month=TruncMonth("payment_date"))
            .values("month")
            .annotate(value=Sum("amount"))
            .order_by("month")
        )

        revenue_trend = []
        for entry in monthly_revenue:
            if entry["month"] and entry["value"] is not None:
                revenue_trend.append(
                    {
                        "name": entry["month"].strftime("%b"),
                        "value": float(entry["value"]),
                    }
                )

        # Fallback
        if not revenue_trend:
            revenue_trend = [{"name": "No Data", "value": 0}]

        # Trends
        now = timezone.now()
        this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_start = (this_month_start - timedelta(days=1)).replace(day=1)

        def calculate_trend(current, last):
            if not last or last == 0:
                return "+100%" if current > 0 else "+0%"
            diff = ((float(current) - float(last)) / float(last)) * 100
            return f"{'+' if diff >= 0 else ''}{int(diff)}%"

        # Student Trend
        s_this = Student.objects.filter(created_at__gte=this_month_start).count()
        s_last = Student.objects.filter(
            created_at__gte=last_month_start, created_at__lt=this_month_start
        ).count()

        # Teacher Trend
        t_this = Teacher.objects.filter(joining_date__gte=this_month_start).count()
        t_last = Teacher.objects.filter(
            joining_date__gte=last_month_start, joining_date__lt=this_month_start
        ).count()

        # Fees Trend
        f_this = (
            FeePayment.objects.filter(payment_date__gte=this_month_start).aggregate(
                total=Sum("amount")
            )["total"]
            or 0
        )
        f_last = (
            FeePayment.objects.filter(
                payment_date__gte=last_month_start, payment_date__lt=this_month_start
            ).aggregate(total=Sum("amount"))["total"]
            or 0
        )

        is_admin = request.user.role_name == "ADMIN"

        # Library Stats (from InventoryItem with LIBRARY category)
        from django.db.models import F as DbF

        from inventory.models import InventoryItem

        library_qs = InventoryItem.objects.filter(category="LIBRARY")
        library_books_total = library_qs.aggregate(total=Sum("quantity"))["total"] or 0
        library_titles = library_qs.count()
        library_low_stock = library_qs.filter(
            quantity__lte=DbF("min_threshold")
        ).count()

        return Response(
            {
                "students": student_count,
                "teachers": teacher_count,
                "classes": class_count,
                "total_fees": float(total_fees) if is_admin else 0,
                "revenue_trend": revenue_trend if is_admin else [],
                "student_trend": calculate_trend(s_this, s_last),
                "teacher_trend": calculate_trend(t_this, t_last),
                "fees_trend": calculate_trend(f_this, f_last) if is_admin else "0%",
                "library": {
                    "total_books": library_books_total,
                    "total_titles": library_titles,
                    "low_stock_count": library_low_stock,
                },
            }
        )

    def _get_global_analytics(self):
        from datetime import datetime, timedelta

        from django.db.models import Avg, Count, Q
        from django_tenants.utils import tenant_context

        from attendance.models import DailyAttendance
        from exams.models import Mark
        from schools.models import School
        from students.models import Student

        schools = School.objects.exclude(schema_name="public")

        global_subject_perf = {}
        global_attendance = {}
        global_class_dist = {}

        thirty_days_ago = datetime.now() - timedelta(days=30)

        for school in schools:
            try:
                with tenant_context(school):
                    # 1. Subject Performance
                    sub_perf = Mark.objects.values("subject__name").annotate(
                        avg=Avg("score")
                    )
                    for item in sub_perf:
                        name = item["subject__name"]
                        if name not in global_subject_perf:
                            global_subject_perf[name] = []
                        global_subject_perf[name].append(item["avg"])

                    # 2. Attendance
                    att = (
                        DailyAttendance.objects.filter(date__gte=thirty_days_ago)
                        .values("date")
                        .annotate(
                            p=Count("id", filter=Q(status="PRESENT")),
                            a=Count("id", filter=Q(status="ABSENT")),
                        )
                    )
                    for item in att:
                        d = item["date"]
                        if d not in global_attendance:
                            global_attendance[d] = {"present": 0, "absent": 0}
                        global_attendance[d]["present"] += item["p"]
                        global_attendance[d]["absent"] += item["a"]

                    # 3. Class Distribution
                    dist = Student.objects.values("stream__grade_level__name").annotate(
                        c=Count("id")
                    )
                    for item in dist:
                        name = item["stream__grade_level__name"]
                        if not name:
                            continue
                        global_class_dist[name] = (
                            global_class_dist.get(name, 0) + item["c"]
                        )
            except Exception:
                continue

        # Format output
        subject_performance = [
            {"subject": name, "average": sum(scores) / len(scores)}
            for name, scores in global_subject_perf.items()
        ]
        subject_performance.sort(key=lambda x: x["average"], reverse=True)

        attendance_trend = [
            {
                "date": d.strftime("%d %b"),
                "present": v["present"],
                "absent": v["absent"],
            }
            for d, v in sorted(global_attendance.items())
        ]

        class_distribution = [
            {"name": name, "value": count} for name, count in global_class_dist.items()
        ]

        return {
            "subject_performance": subject_performance[:5],
            "attendance_trend": attendance_trend,
            "class_distribution": class_distribution,
        }

    @action(detail=False, methods=["get"])
    def analytics_detailed(self, request):
        from django.db import connection

        if connection.schema_name == "public":
            if request.user.role_name != "SUPER_ADMIN":
                return Response({"detail": "Permission denied."}, status=403)
            return Response(self._get_global_analytics())

        school = request.user.school
        if not school:
            return Response({"detail": "No school assigned."}, status=400)

        if request.user.role_name not in ["ADMIN", "TEACHER", "SUPER_ADMIN"]:
            return Response({"detail": "Permission denied."}, status=403)

        # 1. Subject Performance (Aggregate scores from all exams)
        subject_performance = (
            Mark.objects.values("subject__name")
            .annotate(average=Avg("score"))
            .order_by("-average")[:5]
        )

        # 2. Attendance Trends (Last 30 days)
        thirty_days_ago = datetime.now() - timedelta(days=30)
        attendance_stats = (
            DailyAttendance.objects.filter(date__gte=thirty_days_ago)
            .values("date")
            .annotate(
                present=Count("id", filter=Q(status="PRESENT")),
                absent=Count("id", filter=Q(status="ABSENT")),
            )
            .order_by("date")
        )

        # 3. Class Distribution
        class_distribution = (
            Student.objects.values("stream__grade_level__name")
            .annotate(count=Count("id"))
            .order_by("stream__grade_level__name")
        )

        return Response(
            {
                "subject_performance": [
                    {
                        "subject": item["subject__name"],
                        "average": float(item["average"]),
                    }
                    for item in subject_performance
                ],
                "attendance_trend": [
                    {
                        "date": item["date"].strftime("%d %b"),
                        "present": item["present"],
                        "absent": item["absent"],
                    }
                    for item in attendance_stats
                ],
                "class_distribution": [
                    {"name": item["stream__grade_level__name"], "value": item["count"]}
                    for item in class_distribution
                    if item["stream__grade_level__name"]
                ],
            }
        )

    @action(detail=False, methods=["get"])
    def super_admin_stats(self, request):
        from django.db import connection

        logger.debug(
            "super_admin_stats called by user_id=%s role=%s schema=%s",
            request.user.id,
            request.user.role_name,
            connection.schema_name,
        )
        if request.user.role_name != "SUPER_ADMIN":
            return Response({"detail": "Permission denied."}, status=403)

        from django_tenants.utils import tenant_context

        total_schools = School.objects.exclude(schema_name="public").count()
        total_students = 0
        total_users = 0
        total_revenue = 0

        for school in School.objects.exclude(schema_name="public"):
            with tenant_context(school):
                total_students += Student.objects.count()
                total_users += User.objects.count()
                from fees.models import FeePayment

                try:
                    total_revenue += (
                        FeePayment.objects.aggregate(total=Sum("amount"))["total"] or 0
                    )
                except Exception:
                    pass

        return Response(
            {
                "total_schools": total_schools,
                "total_students": total_students,
                "total_users": total_users,
                "total_revenue": float(total_revenue),
                "system_alerts": 0,
            }
        )

    @action(detail=False, methods=["get", "patch"], url_path="settings")
    def school_settings(self, request):
        from django.db import connection

        if connection.schema_name == "public":
            return Response({"detail": "Settings are tenant-specific."}, status=400)

        # Get or create settings for this tenant
        settings_obj, created = SchoolSetting.objects.get_or_create()

        if request.method == "GET":
            serializer = SchoolSettingSerializer(settings_obj)
            data = serializer.data

            # Add school details from the tenant
            school = request.user.school
            if school:
                data.update(
                    {
                        "school_name": school.name,
                        "school_address": school.address,
                        "school_email": school.contact_email,
                        "school_phone": school.contact_phone,
                        "school_logo": school.logo.url if school.logo else None,
                    }
                )
            return Response(data)

        elif request.method == "PATCH":
            school = request.user.school
            if school:
                school_name = request.data.get("school_name")
                school_address = request.data.get("school_address")
                school_email = request.data.get("school_email")
                school_phone = request.data.get("school_phone")
                school_logo = request.data.get("school_logo")

                if school_name:
                    school.name = school_name
                if school_address:
                    school.address = school_address
                if school_email:
                    school.contact_email = school_email
                if school_phone:
                    school.contact_phone = school_phone
                if school_logo:
                    if isinstance(school_logo, str) and school_logo.startswith(
                        "data:image"
                    ):
                        import base64

                        from django.core.files.base import ContentFile

                        format, imgstr = school_logo.split(";base64,")
                        ext = format.split("/")[-1]
                        school.logo = ContentFile(
                            base64.b64decode(imgstr), name=f"logo.{ext}"
                        )
                school.save()

            serializer = SchoolSettingSerializer(
                settings_obj, data=request.data, partial=True
            )
            if serializer.is_valid():
                serializer.save()
                data = serializer.data
                if school:
                    data.update(
                        {
                            "school_name": school.name,
                            "school_address": school.address,
                            "school_email": school.contact_email,
                            "school_phone": school.contact_phone,
                            "school_logo": school.logo.url if school.logo else None,
                        }
                    )
                return Response(data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SubscriptionViewSet(TenantAwareViewSetMixin, viewsets.ModelViewSet):
    serializer_class = SubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated, StrictTenantPermission]

    def get_queryset(self):
        from django.db import connection

        if self.request.user.role_name == "SUPER_ADMIN":
            return Subscription.objects.all()
        return Subscription.objects.filter(school__schema_name=connection.schema_name)
