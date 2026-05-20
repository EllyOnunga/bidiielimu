import json

from asgiref.sync import sync_to_async
from channels.generic.websocket import (
    AsyncJsonWebsocketConsumer,
    AsyncWebsocketConsumer,
)
from django.utils import timezone


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_anonymous:
            await self.close()
        else:
            self.group_name = f"user_{self.user.id}"
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def send_notification(self, event):
        await self.send(text_data=json.dumps(event["content"]))


class EmergencyConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = "emergency_broadcast"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def broadcast_emergency(self, event):
        await self.send(text_data=json.dumps(event["content"]))


class AttendanceConsumer(AsyncJsonWebsocketConsumer):
    """
    Real-time attendance updates for teachers and students
    """

    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_anonymous:
            await self.close()
            return

        # Join user-specific group
        self.user_group = f"user_{self.user.id}"
        await self.channel_layer.group_add(self.user_group, self.channel_name)

        # Join class-specific group if user is in a class
        if hasattr(self.user, "student_profile") and self.user.student_profile:
            self.class_group = f"class_{self.user.student_profile.stream_id}"
            await self.channel_layer.group_add(self.class_group, self.channel_name)
        elif hasattr(self.user, "teacher_profile") and self.user.teacher_profile:
            # Teachers join groups for classes they teach
            teacher = self.user.teacher_profile
            class_groups = await self._get_teacher_class_groups(teacher.id)
            for group in class_groups:
                await self.channel_layer.group_add(group, self.channel_name)

        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "user_group"):
            await self.channel_layer.group_discard(self.user_group, self.channel_name)
        if hasattr(self, "class_group"):
            await self.channel_layer.group_discard(self.class_group, self.channel_name)

    async def attendance_update(self, event):
        """Send attendance updates to connected clients"""
        await self.send_json(
            {
                "type": "attendance_update",
                "data": event["data"],
                "timestamp": timezone.now().isoformat(),
            }
        )

    @sync_to_async
    def _get_teacher_class_groups(self, teacher_id):
        """Get class groups for a teacher"""
        from classes.models import ScheduleSlot

        slots = (
            ScheduleSlot.objects.filter(teacher_id=teacher_id)
            .values_list("stream_id", flat=True)
            .distinct()
        )
        return [f"class_{stream_id}" for stream_id in slots]


class ClassUpdateConsumer(AsyncJsonWebsocketConsumer):
    """
    Real-time class updates (timetable changes, announcements, etc.)
    """

    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_anonymous:
            await self.close()
            return

        # Join school-wide updates
        self.school_group = f"school_{self.user.school_id}"
        await self.channel_layer.group_add(self.school_group, self.channel_name)

        # Join class-specific updates
        if hasattr(self.user, "student_profile") and self.user.student_profile:
            self.class_group = f"class_{self.user.student_profile.stream_id}"
            await self.channel_layer.group_add(self.class_group, self.channel_name)

        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "school_group"):
            await self.channel_layer.group_discard(self.school_group, self.channel_name)
        if hasattr(self, "class_group"):
            await self.channel_layer.group_discard(self.class_group, self.channel_name)

    async def timetable_update(self, event):
        """Send timetable changes"""
        await self.send_json({"type": "timetable_update", "data": event["data"]})

    async def announcement(self, event):
        """Send class announcements"""
        await self.send_json({"type": "announcement", "data": event["data"]})

    async def grade_update(self, event):
        """Send grade/mark updates"""
        await self.send_json({"type": "grade_update", "data": event["data"]})


class ChatConsumer(AsyncJsonWebsocketConsumer):
    """
    Real-time chat functionality
    """

    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_anonymous:
            await self.close()
            return

        # Get chat room from URL parameters
        self.room_id = self.scope["url_route"]["kwargs"].get("room_id")
        self.room_group_name = f"chat_{self.room_id}"

        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        await self.accept()

        # Send join message
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": f"{self.user.get_full_name()} joined the chat",
                "user": self.user.get_full_name(),
                "user_id": self.user.id,
                "timestamp": timezone.now().isoformat(),
                "message_type": "system",
            },
        )

    async def disconnect(self, close_code):
        # Leave room group
        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(
                self.room_group_name, self.channel_name
            )

            # Send leave message
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "message": f"{self.user.get_full_name()} left the chat",
                    "user": self.user.get_full_name(),
                    "user_id": self.user.id,
                    "timestamp": timezone.now().isoformat(),
                    "message_type": "system",
                },
            )

    async def receive_json(self, content):
        """Receive message from WebSocket"""
        message_type = content.get("type", "message")

        if message_type == "chat_message":
            message = content.get("message", "").strip()
            if message:
                # Save message to database (optional)
                await self._save_message(message)

                # Send message to room group
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "chat_message",
                        "message": message,
                        "user": self.user.get_full_name(),
                        "user_id": self.user.id,
                        "timestamp": timezone.now().isoformat(),
                        "message_type": "user",
                    },
                )

    async def chat_message(self, event):
        """Receive message from room group"""
        # Send message to WebSocket
        await self.send_json(event)

    @sync_to_async
    def _save_message(self, message):
        """Save chat message to database (optional)"""
        # Could implement chat message storage here
