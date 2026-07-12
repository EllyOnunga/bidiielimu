from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from config.tenant_security import BaseTenantViewSet
from django.db.models import F

from .models import (
    CommunicationUsage,
    Notice,
    Notification,
    PLAN_LIMITS,
    PTMMeeting,
    SchoolEvent,
)
from .serializers import (
    NoticeSerializer,
    NotificationSerializer,
    PTMMeetingSerializer,
    SchoolEventSerializer,
)
from .services_sms import SMSService


class NotificationViewSet(BaseTenantViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    @action(detail=True, methods=["post"])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({"status": "notification marked as read"})

    @action(detail=False, methods=["post"])
    def mark_all_as_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({"status": "all notifications marked as read"})

    @action(detail=False, methods=["post"])
    def clear_all(self, request):
        self.get_queryset().delete()
        return Response({"status": "all notifications cleared"})

    @action(detail=False, methods=["post"])
    def bulk_email(self, request):
        subject = request.data.get("subject")
        message = request.data.get("message")
        recipients = request.data.get("recipients", [])

        if not all([subject, message, recipients]):
            return Response(
                {"detail": "Subject, message, and recipients are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from django.conf import settings
        from django.core.mail import send_mail

        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                recipients,
                fail_silently=False,
            )
            # Track email usage
            usage, _ = CommunicationUsage.get_or_create_for_school(request.tenant)
            CommunicationUsage.objects.filter(pk=usage.pk).update(
                email_sent=F("email_sent") + len(recipients)
            )
            return Response({"status": "Success", "sent_to": len(recipients)})
        except Exception as e:
            return Response(
                {"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=["post"])
    def bulk_sms(self, request):
        message = request.data.get("message")
        phones = request.data.get("phones", [])

        if not all([message, phones]):
            return Response(
                {"detail": "Message and phones are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Using existing SMSService
        service = SMSService()
        res = service.send_bulk_sms(phones, message)

        # Track SMS usage
        usage, _ = CommunicationUsage.get_or_create_for_school(request.tenant)
        CommunicationUsage.objects.filter(pk=usage.pk).update(
            sms_sent=F("sms_sent") + len(phones)
        )

        return Response({"status": "Success", "response": res})

    @action(detail=False, methods=["get"])
    def communication_stats(self, request):
        from schools.models import Subscription

        school = request.tenant

        # Resolve plan limits from the school's subscription
        try:
            subscription = Subscription.objects.get(school=school, status="ACTIVE")
            plan = subscription.plan
        except Subscription.DoesNotExist:
            plan = "FREE"

        limits = PLAN_LIMITS.get(plan, PLAN_LIMITS["FREE"])
        is_premium = plan in ("PROFESSIONAL", "ENTERPRISE")

        # Get current month's usage (creates a zero-count row if none exists)
        usage, _ = CommunicationUsage.get_or_create_for_school(school)

        return Response(
            {
                "sms_limit": limits["sms"],
                "sms_used": usage.sms_sent,
                "email_limit": limits["email"],
                "email_used": usage.email_sent,
                "is_premium": is_premium,
                "plan": plan,
            }
        )

    @action(detail=False, methods=["get"])
    def recipient_groups(self, request):
        from students.models import Student
        from teachers.models import Teacher
        from accounts.models import UserSchoolMembership

        parent_count = (
            Student.objects.filter(is_active=True)
            .values("guardians__email")
            .distinct()
            .count()
        )
        teacher_count = Teacher.objects.filter(is_active=True).count()

        bom_count = UserSchoolMembership.objects.filter(
            school=request.tenant,
            status="ACTIVE",
            role__name__in=["BOM", "BOARD_OF_MANAGEMENT", "BOM_MEMBER", "Board of Management"]
        ).count()

        return Response(
            [
                {
                    "id": "parents",
                    "name": "All Parents",
                    "count": parent_count,
                    "type": "BOTH",
                },
                {
                    "id": "teachers",
                    "name": "All Staff",
                    "count": teacher_count,
                    "type": "BOTH",
                },
                {
                    "id": "bom",
                    "name": "Board of Management",
                    "count": bom_count,
                    "type": "BOTH",
                },
            ]
        )

    @action(detail=True, methods=["get"], url_path="group-recipients")
    def group_recipients(self, request, pk=None):
        """
        pk is the group id (parents, teachers, bom)
        Returns list of emails or phones based on ?type=email|sms
        """
        group_type = request.query_params.get("type", "email")
        from students.models import Student
        from teachers.models import Teacher

        if pk == "parents":
            if group_type == "email":
                recipients = (
                    Student.objects.filter(is_active=True)
                    .values_list("guardians__email", flat=True)
                    .distinct()
                )
            else:
                recipients = (
                    Student.objects.filter(is_active=True)
                    .values_list("guardians__phone_number", flat=True)
                    .distinct()
                )
        elif pk == "teachers":
            if group_type == "email":
                recipients = (
                    Teacher.objects.filter(is_active=True)
                    .values_list("user__email", flat=True)
                    .distinct()
                )
            else:
                recipients = (
                    Teacher.objects.filter(is_active=True)
                    .values_list("phone_number", flat=True)
                    .distinct()
                )
        elif pk == "bom":
            from accounts.models import UserSchoolMembership
            memberships = UserSchoolMembership.objects.filter(
                school=request.tenant,
                status="ACTIVE",
                role__name__in=["BOM", "BOARD_OF_MANAGEMENT", "BOM_MEMBER", "Board of Management"]
            ).select_related("user")

            if group_type == "email":
                recipients = memberships.values_list("user__email", flat=True).distinct()
            else:
                recipients = memberships.values_list("user__phone_number", flat=True).distinct()
        else:
            recipients = []

        return Response({"recipients": list(filter(None, recipients))})


class NoticeViewSet(BaseTenantViewSet):
    queryset = Notice.objects.all().order_by("-published_at")
    serializer_class = NoticeSerializer

    @action(detail=False, methods=["post"])
    def broadcast_sms(self, request):
        message = request.data.get("message")
        if not message:
            return Response(
                {"detail": "Message is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        res = SMSService.broadcast_to_parents(message)
        return Response({"status": "Sent", "response": res})


class SchoolEventViewSet(BaseTenantViewSet):
    queryset = SchoolEvent.objects.all().order_by("start_date")
    serializer_class = SchoolEventSerializer


class PTMMeetingViewSet(BaseTenantViewSet):
    queryset = PTMMeeting.objects.all().order_by("scheduled_time")
    serializer_class = PTMMeetingSerializer
