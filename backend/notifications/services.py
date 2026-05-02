from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Notification

class NotificationService:
    @staticmethod
    def send_to_user(user_id, title, message, level='INFO'):
        # 1. Save to Database
        notification = Notification.objects.create(
            user_id=user_id,
            title=title,
            message=message,
            level=level
        )
        
        # 2. Trigger WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{user_id}",
            {
                "type": "send_notification",
                "content": {
                    "id": notification.id,
                    "title": title,
                    "message": message,
                    "level": level,
                    "timestamp": notification.created_at.isoformat()
                }
            }
        )
        return notification

    @staticmethod
    def broadcast_emergency(title, message):
        # 1. Trigger WebSocket to all
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "emergency_broadcast",
            {
                "type": "broadcast_emergency",
                "content": {
                    "title": title,
                    "message": message,
                    "level": 'CRITICAL'
                }
            }
        )
