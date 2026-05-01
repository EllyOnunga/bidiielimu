from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import AuditLog
from students.models import Student
from teachers.models import Teacher
from attendance.models import DailyAttendance
from exams.models import Mark
from fees.models import FeePayment

def log_change(instance, action, **kwargs):
    # This is a basic implementation. 
    # In a real app, we'd use a middleware to get the current user and IP.
    # For now, we'll log with system context if no user is provided.
    
    model_name = instance.__class__.__name__
    object_repr = str(instance)
    object_id = str(instance.pk)
    school = getattr(instance, 'school', None)
    
    # Try to find a related user if possible (e.g. for student/teacher profiles)
    user = getattr(instance, 'user', None) if hasattr(instance, 'user') else None

    AuditLog.objects.create(
        user=user,
        school=school,
        action=action,
        model_name=model_name,
        object_id=object_id,
        object_repr=object_repr,
        changes=None # For a full implementation, we'd compare old and new values
    )

@receiver(post_save, sender=Student)
@receiver(post_save, sender=Teacher)
@receiver(post_save, sender=DailyAttendance)
@receiver(post_save, sender=Mark)
@receiver(post_save, sender=FeePayment)
def post_save_audit(sender, instance, created, **kwargs):
    action = 'CREATE' if created else 'UPDATE'
    log_change(instance, action)

@receiver(post_delete, sender=Student)
@receiver(post_delete, sender=Teacher)
def post_delete_audit(sender, instance, **kwargs):
    log_change(instance, 'DELETE')
