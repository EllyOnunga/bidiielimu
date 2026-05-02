from .models import Student, Guardian
from exams.models import Mark, ExamRanking
from fees.models import FeePayment, FeeStructure
from attendance.models import DailyAttendance
from django.db.models import Sum

class PortalService:
    @staticmethod
    def get_parent_dashboard_data(user):
        """
        Fetches consolidated data for all children associated with this parent user.
        """
        guardians = Guardian.objects.filter(user=user)
        children_data = []
        
        for g in guardians:
            student = g.student
            
            # 1. Performance
            latest_avg = ExamRanking.objects.filter(student=student).order_by('-exam__date').first()
            
            # 2. Financials
            total_paid = FeePayment.objects.filter(student=student).aggregate(Sum('amount'))['amount__sum'] or 0
            # Assuming a simple logic for balance for now
            total_payable = 50000 # Placeholder for actual structure lookup
            balance = total_payable - total_paid
            
            # 3. Attendance
            total_days = DailyAttendance.objects.filter(student=student).count()
            present_days = DailyAttendance.objects.filter(student=student, status='PRESENT').count()
            attendance_rate = (present_days / total_days * 100) if total_days > 0 else 100

            children_data.append({
                "student_id": student.id,
                "name": student.get_full_name(),
                "admission_number": student.admission_number,
                "stream": student.stream.name if student.stream else "N/A",
                "performance": {
                    "mean_score": latest_avg.mean_score if latest_avg else 0,
                    "rank": latest_avg.rank if latest_avg else "N/A"
                },
                "fees": {
                    "paid": total_paid,
                    "balance": balance
                },
                "attendance_rate": round(attendance_rate, 2)
            })
            
        return children_data
