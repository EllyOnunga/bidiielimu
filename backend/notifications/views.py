from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Notification, Notice, SchoolEvent, PTMMeeting
from .serializers import (
    NotificationSerializer, NoticeSerializer, 
    SchoolEventSerializer, PTMMeetingSerializer
)
from .services_sms import SMSService

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'notification marked as read'})

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({'status': 'all notifications marked as read'})

    @action(detail=False, methods=['post'])
    def bulk_email(self, request):
        subject = request.data.get('subject')
        message = request.data.get('message')
        recipients = request.data.get('recipients', [])

        if not all([subject, message, recipients]):
            return Response({"detail": "Subject, message, and recipients are required."}, status=status.HTTP_400_BAD_REQUEST)

        from django.core.mail import send_mail
        from django.conf import settings

        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                recipients,
                fail_silently=False,
            )
            return Response({"status": "Success", "sent_to": len(recipients)})
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def bulk_sms(self, request):
        message = request.data.get('message')
        phones = request.data.get('phones', [])

        if not all([message, phones]):
            return Response({"detail": "Message and phones are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Using existing SMSService
        service = SMSService()
        res = service.send_bulk_sms(phones, message)
        
        return Response({"status": "Success", "response": res})

    @action(detail=False, methods=['get'])
    def communication_stats(self, request):
        # Mocking usage stats for now
        return Response({
            "sms_limit": 5000,
            "sms_used": 1240,
            "email_limit": 10000,
            "email_used": 2500,
            "is_premium": False
        })

    @action(detail=False, methods=['get'])
    def recipient_groups(self, request):
        from students.models import Student
        from teachers.models import Teacher
        
        parent_count = Student.objects.filter(is_active=True).values('guardians__email').distinct().count()
        teacher_count = Teacher.objects.filter(is_active=True).count()
        
        return Response([
            {"id": "parents", "name": "All Parents", "count": parent_count, "type": "BOTH"},
            {"id": "teachers", "name": "All Staff", "count": teacher_count, "type": "BOTH"},
            {"id": "bom", "name": "Board of Management", "count": 8, "type": "BOTH"},
        ])

    @action(detail=True, methods=['get'], url_path='group-recipients')
    def group_recipients(self, request, pk=None):
        """
        pk is the group id (parents, teachers, bom)
        Returns list of emails or phones based on ?type=email|sms
        """
        group_type = request.query_params.get('type', 'email')
        from students.models import Student
        from teachers.models import Teacher

        if pk == 'parents':
            if group_type == 'email':
                recipients = Student.objects.filter(is_active=True).values_list('guardians__email', flat=True).distinct()
            else:
                recipients = Student.objects.filter(is_active=True).values_list('guardians__phone_number', flat=True).distinct()
        elif pk == 'teachers':
            if group_type == 'email':
                recipients = Teacher.objects.filter(is_active=True).values_list('user__email', flat=True).distinct()
            else:
                recipients = Teacher.objects.filter(is_active=True).values_list('phone_number', flat=True).distinct()
        else:
            recipients = []

        return Response({"recipients": list(filter(None, recipients))})

class NoticeViewSet(viewsets.ModelViewSet):
    queryset = Notice.objects.all().order_by('-published_at')
    serializer_class = NoticeSerializer

    @action(detail=False, methods=['post'])
    def broadcast_sms(self, request):
        message = request.data.get('message')
        if not message:
            return Response({"detail": "Message is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        res = SMSService.broadcast_to_parents(message)
        return Response({"status": "Sent", "response": res})

class SchoolEventViewSet(viewsets.ModelViewSet):
    queryset = SchoolEvent.objects.all().order_by('start_date')
    serializer_class = SchoolEventSerializer

class PTMMeetingViewSet(viewsets.ModelViewSet):
    queryset = PTMMeeting.objects.all().order_by('scheduled_time')
    serializer_class = PTMMeetingSerializer
