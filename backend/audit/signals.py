from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import AuditLog
from students.models import Student
from teachers.models import Teacher
from attendance.models import DailyAttendance
from exams.models import Mark
from fees.models import FeePayment

from .middleware import get_current_user, get_client_ip

def log_change(instance, action, **kwargs):
    model_name = instance.__class__.__name__
    object_repr = str(instance)
    object_id = str(instance.pk)
    
    user = get_current_user()
    if user and not user.is_authenticated:
        user = None
        
    ip_address = get_client_ip()

    AuditLog.objects.create(
        user=user,
        action=action,
        model_name=model_name,
        object_id=object_id,
        object_repr=object_repr,
        ip_address=ip_address,
        changes=None
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
