from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'notification marked as read'})

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        self.get_queryset().update(is_read=True)
        return Response({'status': 'all notifications marked as read'})

    @action(detail=False, methods=['post'])
    def bulk_email(self, request):
        from .services import CommunicationService
        subject = request.data.get('subject')
        message = request.data.get('message')
        recipients = request.data.get('recipients', []) # List of emails
        
        if not subject or not message or not recipients:
            return Response({"detail": "Subject, message and recipients are required."}, status=400)
            
        success = CommunicationService.send_email(subject, message, recipients)
        if success:
            return Response({"status": f"Email sent to {len(recipients)} recipients."})
        return Response({"detail": "Failed to send email."}, status=500)

    @action(detail=False, methods=['post'])
    def bulk_sms(self, request):
        from .services import CommunicationService
        message = request.data.get('message')
        phones = request.data.get('phones', []) # List of phone numbers
        
        if not message or not phones:
            return Response({"detail": "Message and phone numbers are required."}, status=400)
            
        success_count = 0
        for phone in phones:
            if CommunicationService.send_sms(phone, message):
                success_count += 1
                
        return Response({"status": f"SMS sent to {success_count}/{len(phones)} recipients."})
