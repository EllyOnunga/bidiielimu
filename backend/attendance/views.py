from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import DailyAttendance
from .serializers import DailyAttendanceSerializer
from schools.decorators import cache_tenant_page

class DailyAttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = DailyAttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            from accounts.permissions import IsTeacher
            return [IsTeacher()]
        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user
        qs = DailyAttendance.objects.filter(school=user.school).select_related('student', 'student__user', 'marked_by')
        if user.role == 'STUDENT':
            qs = qs.filter(student__user=user)
        return qs

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school, marked_by=self.request.user)

    @action(detail=False, methods=['get'])
    @cache_tenant_page(60 * 15) # Cache for 15 minutes
    def stats(self, request):
        from students.models import Student
        school = request.user.school
        today = timezone.now().date()
        
        total_students = Student.objects.filter(school=school, is_active=True).count()
        
        today_attendance = DailyAttendance.objects.filter(school=school, date=today)
        present = today_attendance.filter(status__in=['PRESENT', 'LATE']).count()
        absent = today_attendance.filter(status='ABSENT').count()
        excused = today_attendance.filter(status='EXCUSED').count()
        
        # If no attendance marked today, maybe we want to calculate over the last 30 days
        # But for daily stats, we just show today's.
        avg = f"{int((present / total_students) * 100)}%" if total_students > 0 and present > 0 else "0%"
        
        return Response({
            "present": present,
            "absent": absent,
            "excused": excused,
            "total_students": total_students,
            "avg": avg,
            "date": today.strftime("%B %d, %Y")
        })

    @action(detail=False, methods=['post'])
    def bulk_mark(self, request):
        date = request.data.get('date', timezone.now().date())
        records = request.data.get('records', []) # List of {student_id, status}
        
        school = request.user.school
        marked_by = request.user
        
        results = []
        for record in records:
            student_id = record.get('student_id')
            status_val = record.get('status', 'PRESENT')
            
            attendance, created = DailyAttendance.objects.update_or_create(
                student_id=student_id,
                date=date,
                defaults={
                    'school': school,
                    'status': status_val,
                    'marked_by': marked_by
                }
            )
            results.append(attendance.id)
            
        return Response({"status": "success", "marked_count": len(results)})
