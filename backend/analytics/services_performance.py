from django.db.models import Avg, Max, Min, Count
from exams.models import Mark, ExamRanking
from classes.models import Subject
from students.models import Student

class PerformanceAnalyticsService:
    @staticmethod
    def get_subject_performance_distribution(subject_id, exam_id):
        # Returns distribution of marks for a subject (for D3 Histograms)
        marks = Mark.objects.filter(subject_id=subject_id, exam_id=exam_id).values_list('score', flat=True)
        return list(marks)

    @staticmethod
    def get_cohort_trends(grade_level_id):
        # Returns average performance over time for a cohort
        rankings = ExamRanking.objects.filter(
            student__stream__grade_level_id=grade_level_id
        ).values('exam__name', 'exam__date').annotate(
            avg_score=Avg('mean_score')
        ).order_by('exam__date')
        
        return list(rankings)

    @staticmethod
    def get_teacher_effectiveness(teacher_id):
        # Compare teacher's subject average vs overall school average for that subject
        teacher_avg = Mark.objects.filter(
            subject__teacher_id=teacher_id
        ).aggregate(avg=Avg('score'))['avg'] or 0
        
        overall_avg = Mark.objects.aggregate(avg=Avg('score'))['avg'] or 0
        
        return {
            "teacher_avg": round(teacher_avg, 2),
            "school_avg": round(overall_avg, 2),
            "variance": round(teacher_avg - overall_avg, 2)
        }

    @staticmethod
    def get_school_kpis():
        from django.utils import timezone
        from attendance.models import DailyAttendance

        total_students = Student.objects.filter(status='ACTIVE').count()

        # Real attendance rate: present+late over total records in last 30 days
        thirty_days_ago = timezone.now().date() - timezone.timedelta(days=30)
        total_records = DailyAttendance.objects.filter(date__gte=thirty_days_ago).count()
        present_records = DailyAttendance.objects.filter(
            date__gte=thirty_days_ago, status__in=['PRESENT', 'LATE']
        ).count()
        avg_attendance = round((present_records / total_records * 100), 1) if total_records > 0 else 0

        # Real pass rate: % of students with mean_score >= 50 in their latest ranking
        total_ranked = ExamRanking.objects.values('student').distinct().count()
        passing = ExamRanking.objects.filter(mean_score__gte=50).values('student').distinct().count()
        pass_rate = round((passing / total_ranked * 100), 1) if total_ranked > 0 else 0

        return {
            "total_students": total_students,
            "avg_attendance": avg_attendance,
            "mean_exam_score": round(ExamRanking.objects.aggregate(avg=Avg('mean_score'))['avg'] or 0, 2),
            "pass_rate": pass_rate
        }
