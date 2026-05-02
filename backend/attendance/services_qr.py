import uuid
from django.core.cache import cache
from django.utils import timezone
from .models import PeriodAttendance

class AttendanceQRService:
    @staticmethod
    def generate_token(slot_id, teacher_id):
        token = str(uuid.uuid4())
        # Store token for 5 minutes
        cache.set(f"attendance_qr_{token}", {
            "slot_id": slot_id,
            "teacher_id": teacher_id,
            "created_at": timezone.now().isoformat()
        }, timeout=300)
        return token

    @staticmethod
    def validate_and_check_in(student, token, student_lat, student_lon):
        data = cache.get(f"attendance_qr_{token}")
        if not data:
            return False, "Invalid or expired token"

        # 1. GPS Geofencing Check
        # Assuming school coordinates are stored in the school model or settings
        # For now, let's assume we have a school_location utility
        # from schools.utils import verify_location
        # if not verify_location(student_lat, student_lon, student.school):
        #     return False, "You must be on school premises to check-in"

        # 2. Create Attendance Record
        PeriodAttendance.objects.update_or_create(
            student=student,
            slot_id=data['slot_id'],
            date=timezone.now().date(),
            defaults={
                'status': 'PRESENT',
                'marked_by_id': data['teacher_id']
            }
        )
        return True, "Check-in successful"
