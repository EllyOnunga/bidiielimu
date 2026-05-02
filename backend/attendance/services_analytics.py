from django.db.models import Count, Avg, Q
from .models import PeriodAttendance
from exams.models import ExamRanking

class AttendanceAnalyticsService:
    @staticmethod
    def get_chronic_absentees(school_id, threshold=0.8):
        # Students with attendance < threshold
        # Simplified logic
        absentee_data = PeriodAttendance.objects.filter(
            student__school_id=school_id
        ).values('student').annotate(
            total=Count('id'),
            present=Count('id', filter=Q(status='PRESENT'))
        )
        
        chronic = []
        for item in absentee_data:
            rate = item['present'] / item['total'] if item['total'] > 0 else 1
            if rate < threshold:
                chronic.append({
                    'student_id': item['student'],
                    'rate': round(rate * 100, 1)
                })
        return chronic

    @staticmethod
    def correlate_with_performance(student_id):
        # Compare attendance rate with mean exam score
        attendance_rate = AttendanceAnalyticsService.get_student_rate(student_id)
        mean_score = ExamRanking.objects.filter(student_id=student_id).aggregate(avg=Avg('mean_score'))['avg']
        
        return {
            'attendance_rate': attendance_rate,
            'academic_performance': mean_score
        }

    @staticmethod
    def get_student_rate(student_id):
        data = PeriodAttendance.objects.filter(student_id=student_id).aggregate(
            total=Count('id'),
            present=Count('id', filter=Q(status='PRESENT'))
        )
        return (data['present'] / data['total']) if data['total'] > 0 else 1
