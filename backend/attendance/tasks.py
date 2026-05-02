from celery import shared_task
from django.utils import timezone
from .models import PeriodAttendance, DailyAttendance
from notifications.models import Notification

@shared_task
def process_absence_alert(student_id, date_str):
    from students.models import Student
    student = Student.objects.get(id=student_id)
    
    # Check if we already sent an alert for this student today
    alert_exists = Notification.objects.filter(
        recipient=student.user,
        notification_type='ATTENDANCE',
        created_at__date=timezone.now().date()
    ).exists()

    if not alert_exists:
        # Check if the student has any 'ABSENT' marks today
        # Send SMS/Push to parent
        parent_phone = student.parent_phone
        message = f"Alert: {student.first_name} was marked ABSENT for their morning session. Please contact the school for details."
        
        # In a real system, we'd call an SMS gateway here
        # send_sms(parent_phone, message)
        
        # Create in-app notification for parent
        if student.parent_user:
            Notification.objects.create(
                recipient=student.parent_user,
                title="Absence Alert",
                message=message,
                notification_type='ATTENDANCE'
            )
        
        return f"Alert sent for student {student_id}"
    
    return "Alert already sent today"
