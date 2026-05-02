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
