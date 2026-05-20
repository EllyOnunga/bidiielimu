from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Notification


class NotificationService:
    @staticmethod
    def send_to_user(user_id, title, message, level="INFO"):
        # 1. Map level string to model choices ("info", "success", "warning", "error")
        lvl_lower = level.lower()
        if lvl_lower in ["info", "success", "warning", "error"]:
            notification_type = lvl_lower
        elif lvl_lower == "critical":
            notification_type = "error"
        else:
            notification_type = "info"

        # 2. Save to Database
        notification = Notification.objects.create(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
        )

        # 3. Trigger WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{user_id}",
            {
                "type": "send_notification",
                "content": {
                    "id": notification.id,
                    "title": title,
                    "message": message,
                    "level": level,  # Keep level format for WS compatibility
                    "timestamp": notification.created_at.isoformat(),
                },
            },
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
                "content": {"title": title, "message": message, "level": "CRITICAL"},
            },
        )
