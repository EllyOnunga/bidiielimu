import logging

from django.contrib.auth import get_user_model
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from notifications.services import NotificationService

logger = logging.getLogger(__name__)
User = get_user_model()


@receiver(post_save, sender="lms.Assignment")
def assignment_created_notification(sender, instance, created, **kwargs):
    if created:
        try:
            from students.models import Student

            if instance.stream:
                students = Student.objects.filter(stream=instance.stream)
                for student in students:
                    if student.user:
                        NotificationService.send_to_user(
                            user_id=student.user.id,
                            title="New Assignment Released",
                            message=f"A new assignment '{instance.title}' has been released for {instance.subject.name}. Due date: {instance.due_date.strftime('%Y-%m-%d %H:%M')}.",
                            level="INFO",
                        )
        except Exception:
            # Prevent failures from crashing the main transaction
            logger.exception("Error in assignment notification signal")


@receiver(post_save, sender="lms.LessonNote")
def lesson_note_created_notification(sender, instance, created, **kwargs):
    if created:
        try:
            from classes.models import SubjectAssignment
            from students.models import Student

            # Find streams for the subject
            streams = SubjectAssignment.objects.filter(
                subject=instance.subject
            ).values_list("stream_id", flat=True)
            students = Student.objects.filter(stream_id__in=streams)
            for student in students:
                if student.user:
                    NotificationService.send_to_user(
                        user_id=student.user.id,
                        title="New Lesson Note Available",
                        message=f"New lesson note '{instance.title}' has been uploaded for {instance.subject.name}.",
                        level="INFO",
                    )
        except Exception:
            logger.exception("Error in lesson note notification signal")


@receiver(post_save, sender="lms.Resource")
def resource_created_notification(sender, instance, created, **kwargs):
    if created:
        try:
            from classes.models import SubjectAssignment
            from students.models import Student

            # Find streams for the subject
            streams = SubjectAssignment.objects.filter(
                subject=instance.subject
            ).values_list("stream_id", flat=True)
            students = Student.objects.filter(stream_id__in=streams)
            for student in students:
                if student.user:
                    category_display = dict(sender.CATEGORY_CHOICES).get(
                        instance.category, "Resource"
                    )
                    NotificationService.send_to_user(
                        user_id=student.user.id,
                        title=f"New Study {category_display}",
                        message=f"A new {category_display.lower()} '{instance.title}' has been uploaded for {instance.subject.name}.",
                        level="INFO",
                    )
        except Exception:
            logger.exception("Error in resource notification signal")


@receiver(post_save, sender="lms.Submission")
def submission_graded_notification(sender, instance, created, **kwargs):
    # Triggers when a submission is graded (i.e. grade is not None)
    if not created and instance.grade is not None:
        try:
            if instance.student and instance.student.user:
                NotificationService.send_to_user(
                    user_id=instance.student.user.id,
                    title="Assignment Graded",
                    message=f"Your submission for '{instance.assignment.title}' has been graded. Score: {instance.grade}/{instance.assignment.max_score}.",
                    level="SUCCESS",
                )
        except Exception:
            logger.exception("Error in submission graded notification signal")


@receiver(pre_save, sender=User)
def user_password_change_check(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_user = User.objects.get(pk=instance.pk)
            instance._old_password = old_user.password
        except User.DoesNotExist:
            instance._old_password = None
    else:
        instance._old_password = None


@receiver(post_save, sender=User)
def user_password_changed_notification(sender, instance, created, **kwargs):
    if not created and hasattr(instance, "_old_password") and instance._old_password:
        if instance._old_password != instance.password:
            try:
                NotificationService.send_to_user(
                    user_id=instance.id,
                    title="Password Updated",
                    message="Your account password was successfully updated. If you did not request this, please contact your school administrator immediately.",
                    level="WARNING",
                )
            except Exception:
                logger.exception("Error in password changed notification signal")


@receiver(post_save, sender="notifications.Notice")
def notice_published_notification(sender, instance, created, **kwargs):
    if created and instance.is_published:
        try:
            users = User.objects.filter(is_active=True)
            if instance.target_audience == "TEACHERS":
                users = users.filter(role__name="TEACHER")
            elif instance.target_audience == "PARENTS":
                users = users.filter(role__name="PARENT")

            for u in users:
                NotificationService.send_to_user(
                    user_id=u.id,
                    title=f"New Announcement: {instance.title}",
                    message=instance.content[:200]
                    + ("..." if len(instance.content) > 200 else ""),
                    level="INFO",
                )
        except Exception:
            logger.exception("Error in notice notification signal")


@receiver(post_save, sender="notifications.SchoolEvent")
def school_event_created_notification(sender, instance, created, **kwargs):
    if created:
        try:
            users = User.objects.filter(is_active=True)
            for u in users:
                NotificationService.send_to_user(
                    user_id=u.id,
                    title=f"New Event: {instance.title}",
                    message=f"Event scheduled from {instance.start_date.strftime('%Y-%m-%d %H:%M')} to {instance.end_date.strftime('%Y-%m-%d %H:%M')}.",
                    level="INFO",
                )
        except Exception:
            logger.exception("Error in school event notification signal")
