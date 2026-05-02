from django.db.models import Avg
from students.models import Student
from exams.models import ExamRanking, Mark
from attendance.models import DailyAttendance
import numpy as np

class CorrelationService:
    @staticmethod
    def get_attendance_performance_data():
        """
        Returns a list of (attendance_rate, mean_score) for all students.
        Useful for scatter plots.
        """
        data_points = []
        students = Student.objects.filter(status='ACTIVE')
        
        for student in students:
            # Get mean score from latest rankings
            latest_ranking = ExamRanking.objects.filter(student=student).order_by('-exam__date').first()
            if not latest_ranking: continue
            
            # Get attendance rate
            total_days = DailyAttendance.objects.filter(student=student).count()
            if total_days == 0: continue
            
            present_days = DailyAttendance.objects.filter(student=student, status='PRESENT').count()
            attendance_rate = (present_days / total_days) * 100
            
            data_points.append({
                "student_name": student.get_full_name(),
                "attendance": round(attendance_rate, 2),
                "performance": round(latest_ranking.mean_score, 2)
            })
            
        return data_points

    @staticmethod
    def calculate_correlation_coefficient(data_points):
        if len(data_points) < 2: return 0
        
        x = [d['attendance'] for d in data_points]
        y = [d['performance'] for d in data_points]
        
        correlation_matrix = np.corrcoef(x, y)
        correlation = correlation_matrix[0, 1]
        
        return round(correlation, 4)

    @staticmethod
    def get_subject_specific_correlations():
        """
        Calculates correlation between attendance and performance for each subject.
        """
        from classes.models import Subject
        subjects = Subject.objects.all()
        results = []

        for subject in subjects:
            # Get (attendance, score) pairs for this subject
            marks = Mark.objects.filter(subject=subject).values('student_id', 'score')
            points = []
            for mark in marks:
                # Get attendance for that student
                total = DailyAttendance.objects.filter(student_id=mark['student_id']).count()
                if total == 0: continue
                present = DailyAttendance.objects.filter(student_id=mark['student_id'], status='PRESENT').count()
                attendance = (present / total) * 100
                points.append({"attendance": attendance, "performance": mark['score']})

            correlation = CorrelationService.calculate_correlation_coefficient(points)
            results.append({
                "subject": subject.name,
                "correlation": correlation,
                "data_points": len(points)
            })

        return sorted(results, key=lambda x: x['correlation'], reverse=True)

