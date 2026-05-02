from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import School, Subscription, SchoolSetting
from .serializers import SchoolSerializer, SubscriptionSerializer, SchoolSettingSerializer
from .decorators import cache_tenant_page
from rest_framework import status
from django.db.models import Sum, Count, Avg, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import datetime, timedelta

from teachers.models import Teacher
from classes.models import Stream
from fees.models import FeePayment
from exams.models import Mark
from attendance.models import DailyAttendance
from students.models import Student
from accounts.models import User

class SchoolViewSet(viewsets.ModelViewSet):
    serializer_class = SchoolSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        from django.db import connection
        if connection.schema_name == 'public':
            return School.objects.exclude(schema_name='public').annotate(
                student_count=Count('students', distinct=True),
                total_revenue=Sum('subscription__amount') # Simplified
            )
        return School.objects.filter(schema_name=connection.schema_name)

    def perform_create(self, serializer):
        from schools.models import Domain
        tenant = serializer.save()
        domain_name = self.request.data.get('domain_url', f"{tenant.schema_name}.scholara.app")
        Domain.objects.create(
            domain=domain_name,
            tenant=tenant,
            is_primary=True
        )

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        school = request.user.school
        if not school:
            return Response({"detail": "No school assigned to user."}, status=400)
            
        if request.user.role not in ['ADMIN', 'TEACHER']:
            return Response({"detail": "Permission denied."}, status=403)

        # Count active students
        student_count = Student.objects.filter(is_active=True).count()
        
        # Count active teachers
        teacher_count = Teacher.objects.filter(is_active=True).count()
        
        # Count active streams (classes)
        class_count = Stream.objects.count()

        # REAL FINANCIAL DATA
        
        # Calculate Total Fees Collected (all time or current year - let's do all time for the card)
        total_fees = FeePayment.objects.aggregate(total=Sum('amount'))['total'] or 0
        
        # Calculate Revenue Trend for the last 6 months
        six_months_ago = datetime.now() - timedelta(days=180)
        monthly_revenue = FeePayment.objects.filter(
            payment_date__gte=six_months_ago
        ).annotate(month=TruncMonth('payment_date')) \
         .values('month') \
         .annotate(value=Sum('amount')) \
         .order_by('month')

        revenue_trend = []
        for entry in monthly_revenue:
            revenue_trend.append({
                'name': entry['month'].strftime('%b'),
                'value': float(entry['value'])
            })
            
        # Fallback if no data exists to keep the chart from being empty during first use
        if not revenue_trend:
             revenue_trend = [
                {'name': 'No Data', 'value': 0}
             ]

        # Calculate Trends (Current month vs Last Month)
        now = timezone.now()
        this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_start = (this_month_start - timedelta(days=1)).replace(day=1)

        # Student Trend
        students_this_month = Student.objects.filter(created_at__gte=this_month_start).count()
        students_last_month = Student.objects.filter(created_at__gte=last_month_start, created_at__lt=this_month_start).count()
        student_trend = "+0%"
        if students_last_month > 0:
            diff = ((students_this_month - students_last_month) / students_last_month) * 100
            student_trend = f"{'+' if diff >= 0 else ''}{int(diff)}%"
        elif students_this_month > 0:
            student_trend = "+100%"

        # Teacher Trend
        teachers_this_month = Teacher.objects.filter(joining_date__gte=this_month_start).count()
        teachers_last_month = Teacher.objects.filter(joining_date__gte=last_month_start, joining_date__lt=this_month_start).count()
        teacher_trend = "+0%"
        if teachers_last_month > 0:
            diff = ((teachers_this_month - teachers_last_month) / teachers_last_month) * 100
            teacher_trend = f"{'+' if diff >= 0 else ''}{int(diff)}%"
        elif teachers_this_month > 0:
            teacher_trend = "+100%"

        # Fees Trend
        fees_this_month = FeePayment.objects.filter(payment_date__gte=this_month_start).aggregate(total=Sum('amount'))['total'] or 0
        fees_last_month = FeePayment.objects.filter(payment_date__gte=last_month_start, payment_date__lt=this_month_start).aggregate(total=Sum('amount'))['total'] or 0
        fees_trend = "+0%"
        if fees_last_month > 0:
            diff = ((float(fees_this_month) - float(fees_last_month)) / float(fees_last_month)) * 100
            fees_trend = f"{'+' if diff >= 0 else ''}{int(diff)}%"
        elif fees_this_month > 0:
            fees_trend = "+100%"

        # Hide financial data from teachers
        is_admin = request.user.role == 'ADMIN'
        
        return Response({
            "students": student_count,
            "teachers": teacher_count,
            "classes": class_count,
            "total_fees": float(total_fees) if is_admin else 0,
            "revenue_trend": revenue_trend if is_admin else [],
            "student_trend": student_trend,
            "teacher_trend": teacher_trend,
            "fees_trend": fees_trend if is_admin else "0%",
        })

    @action(detail=False, methods=['get'])
    def analytics_detailed(self, request):
        school = request.user.school
        if not school:
            return Response({"detail": "No school assigned."}, status=400)
            
        if request.user.role not in ['ADMIN', 'TEACHER']:
            return Response({"detail": "Permission denied."}, status=403)

        # 1. Subject Performance (Aggregate scores from all exams)
        subject_performance = Mark.objects.values('subject__name') \
         .annotate(average=Avg('score')) \
         .order_by('-average')[:5]

        # 2. Attendance Trends (Last 30 days)
        thirty_days_ago = datetime.now() - timedelta(days=30)
        attendance_stats = DailyAttendance.objects.filter(
            date__gte=thirty_days_ago
        ).values('date') \
         .annotate(
             present=Count('id', filter=Q(status='PRESENT')),
             absent=Count('id', filter=Q(status='ABSENT'))
         ).order_by('date')

        # 3. Class Distribution
        class_distribution = Student.objects.values('stream__grade_level__name') \
            .annotate(count=Count('id')) \
            .order_by('stream__grade_level__name')

        return Response({
            "subject_performance": [
                {"subject": item['subject__name'], "average": float(item['average'])} 
                for item in subject_performance
            ],
            "attendance_trend": [
                {
                    "date": item['date'].strftime('%d %b'), 
                    "present": item['present'],
                    "absent": item['absent']
                } for item in attendance_stats
            ],
            "class_distribution": [
                {"name": item['stream__grade_level__name'], "value": item['count']}
                for item in class_distribution if item['stream__grade_level__name']
            ]
        })
    
    @action(detail=False, methods=['get'])
    def super_admin_stats(self, request):
        if request.user.role != 'SUPER_ADMIN':
             return Response({"detail": "Permission denied."}, status=403)
        
        total_schools = School.objects.count()
        total_students = Student.objects.count()
        total_users = User.objects.count()
        total_revenue = FeePayment.objects.aggregate(total=Sum('amount'))['total'] or 0
        
        return Response({
            "total_schools": total_schools,
            "total_students": total_students,
            "total_users": total_users,
            "total_revenue": float(total_revenue),
            "system_alerts": 0
        })


    @action(detail=False, methods=['get', 'patch'], url_path='settings')
    def school_settings(self, request):
        from django.db import connection
        if connection.schema_name == 'public':
            return Response({"detail": "Settings are tenant-specific."}, status=400)

        # Get or create settings for this tenant
        settings_obj, created = SchoolSetting.objects.get_or_create()

        if request.method == 'GET':
            serializer = SchoolSettingSerializer(settings_obj)
            return Response(serializer.data)

        elif request.method == 'PATCH':
            serializer = SchoolSettingSerializer(settings_obj, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SubscriptionViewSet(viewsets.ModelViewSet):
    serializer_class = SubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        from django.db import connection
        if self.request.user.role == 'SUPER_ADMIN':
            return Subscription.objects.all()
        return Subscription.objects.filter(school__schema_name=connection.schema_name)
