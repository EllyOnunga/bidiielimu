import json
import logging

from asgiref.sync import sync_to_async
from channels.generic.websocket import (
    AsyncJsonWebsocketConsumer,
    AsyncWebsocketConsumer,
)
from django.utils import timezone

logger = logging.getLogger(__name__)


class TenantAwareMixin:
    """
    Mixin for Django Channels consumers that enforces WebSocket connections
    are both authenticated and resolved to a valid tenant.

    Requires ``JWTAuthMiddleware`` to have already populated:
      - ``scope["user"]``
      - ``scope["school_id"]``
      - ``scope["tenant_schema"]``

    Subclasses should call ``await self._require_tenant()`` at the start of
    ``connect()``, which will close the socket with code 4003 (policy
    violation) if auth or tenant resolution failed.
    """

    WS_CLOSE_UNAUTHORIZED = 4001
    WS_CLOSE_TENANT_MISSING = 4003

    async def _require_tenant(self) -> bool:
        """
        Validate that the connection carries a real user and a resolved tenant.

        Returns True if the connection should proceed, False if it was closed.
        """
        self.user = self.scope.get("user")
        self.school_id = self.scope.get("school_id")
        self.tenant_schema = self.scope.get("tenant_schema")

        if not self.user or self.user.is_anonymous:
            logger.warning(
                "WS: unauthenticated connection rejected on %s",
                self.__class__.__name__,
            )
            await self.close(code=self.WS_CLOSE_UNAUTHORIZED)
            return False

        if not self.school_id or not self.tenant_schema:
            logger.warning(
                "WS: authenticated user %s has no tenant; connection rejected on %s",
                self.user.id,
                self.__class__.__name__,
            )
            await self.close(code=self.WS_CLOSE_TENANT_MISSING)
            return False

        return True


# ---------------------------------------------------------------------------
# Notification consumer
# ---------------------------------------------------------------------------


class NotificationConsumer(TenantAwareMixin, AsyncWebsocketConsumer):
    async def connect(self):
        if not await self._require_tenant():
            return

        self.group_name = f"tenant_{self.school_id}__user_{self.user.id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def send_notification(self, event):
        await self.send(text_data=json.dumps(event["content"]))


# ---------------------------------------------------------------------------
# Emergency broadcast consumer
# SECURITY FIX: was "emergency_broadcast" (global, cross-tenant).
# Now scoped to "emergency_<school_id>" so only users of the same school
# receive emergency messages.
# ---------------------------------------------------------------------------


class EmergencyConsumer(TenantAwareMixin, AsyncWebsocketConsumer):
    async def connect(self):
        if not await self._require_tenant():
            return

        # Tenant-scoped emergency room – prevents cross-tenant data leakage
        self.group_name = f"emergency_{self.school_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def broadcast_emergency(self, event):
        await self.send(text_data=json.dumps(event["content"]))


# ---------------------------------------------------------------------------
# Attendance consumer
# ---------------------------------------------------------------------------


class AttendanceConsumer(TenantAwareMixin, AsyncJsonWebsocketConsumer):
    """
    Real-time attendance updates for teachers and students.
    All channel groups are prefixed with the tenant school_id.
    """

    async def connect(self):
        if not await self._require_tenant():
            return

        # Per-user group (tenant-scoped)
        self.user_group = f"tenant_{self.school_id}__user_{self.user.id}"
        await self.channel_layer.group_add(self.user_group, self.channel_name)

        # Per-class group for students
        if hasattr(self.user, "student_profile") and self.user.student_profile:
            self.class_group = (
                f"tenant_{self.school_id}__class_{self.user.student_profile.stream_id}"
            )
            await self.channel_layer.group_add(self.class_group, self.channel_name)

        # Per-class groups for teachers (one per timetable slot)
        elif hasattr(self.user, "teacher_profile") and self.user.teacher_profile:
            teacher = self.user.teacher_profile
            class_groups = await self._get_teacher_class_groups(
                teacher.id, self.school_id
            )
            for group in class_groups:
                await self.channel_layer.group_add(group, self.channel_name)
            self._teacher_class_groups = class_groups

        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "user_group"):
            await self.channel_layer.group_discard(self.user_group, self.channel_name)
        if hasattr(self, "class_group"):
            await self.channel_layer.group_discard(self.class_group, self.channel_name)
        for group in getattr(self, "_teacher_class_groups", []):
            await self.channel_layer.group_discard(group, self.channel_name)

    async def attendance_update(self, event):
        """Send attendance updates to connected clients."""
        await self.send_json(
            {
                "type": "attendance_update",
                "data": event["data"],
                "timestamp": timezone.now().isoformat(),
            }
        )

    @sync_to_async
    def _get_teacher_class_groups(self, teacher_id, school_id):
        """Return tenant-scoped channel group names for a teacher's classes."""
        from classes.models import ScheduleSlot  # noqa: PLC0415

        stream_ids = (
            ScheduleSlot.objects.filter(teacher_id=teacher_id)
            .values_list("stream_id", flat=True)
            .distinct()
        )
        return [f"tenant_{school_id}__class_{sid}" for sid in stream_ids]


# ---------------------------------------------------------------------------
# Class update consumer
# ---------------------------------------------------------------------------


class ClassUpdateConsumer(TenantAwareMixin, AsyncJsonWebsocketConsumer):
    """
    Real-time class updates (timetable changes, announcements, grades).
    Uses tenant_schema from scope rather than self.user.school_id so that
    tenant isolation is enforced even if the user object's attribute drifts.
    """

    async def connect(self):
        if not await self._require_tenant():
            return

        # School-wide update group (tenant-scoped)
        self.school_group = f"tenant_{self.school_id}__school_updates"
        await self.channel_layer.group_add(self.school_group, self.channel_name)

        # Class-specific group for students
        if hasattr(self.user, "student_profile") and self.user.student_profile:
            self.class_group = (
                f"tenant_{self.school_id}__class_{self.user.student_profile.stream_id}"
            )
            await self.channel_layer.group_add(self.class_group, self.channel_name)

        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "school_group"):
            await self.channel_layer.group_discard(
                self.school_group, self.channel_name
            )
        if hasattr(self, "class_group"):
            await self.channel_layer.group_discard(
                self.class_group, self.channel_name
            )

    async def timetable_update(self, event):
        """Send timetable changes."""
        await self.send_json({"type": "timetable_update", "data": event["data"]})

    async def announcement(self, event):
        """Send class announcements."""
        await self.send_json({"type": "announcement", "data": event["data"]})

    async def grade_update(self, event):
        """Send grade/mark updates."""
        await self.send_json({"type": "grade_update", "data": event["data"]})


# ---------------------------------------------------------------------------
# Chat consumer
# ---------------------------------------------------------------------------


class ChatConsumer(TenantAwareMixin, AsyncJsonWebsocketConsumer):
    """
    Real-time chat.  Room membership is validated before joining.
    """

    async def connect(self):
        if not await self._require_tenant():
            return

        self.room_id = self.scope["url_route"]["kwargs"].get("room_id")
        if not self.room_id:
            await self.close()
            return

        # Tenant-scoped room group prevents cross-tenant chat access
        self.room_group_name = f"tenant_{self.school_id}__chat_{self.room_id}"

        if not await self._user_is_in_room(self.user.id, self.room_id, self.school_id):
            logger.warning(
                "WS: user %s not in room %s (school %s); rejecting",
                self.user.id,
                self.room_id,
                self.school_id,
            )
            await self.close(code=self.WS_CLOSE_UNAUTHORIZED)
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

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
        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(
                self.room_group_name, self.channel_name
            )
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
        """Receive and relay a message from the WebSocket."""
        if content.get("type") == "chat_message":
            message = content.get("message", "").strip()
            if message:
                await self._save_message(message)
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
        """Forward a room-group message to this WebSocket client."""
        await self.send_json(event)

    @sync_to_async
    def _save_message(self, message):
        """Persist the chat message (placeholder for future storage)."""
        pass

    @sync_to_async
    def _user_is_in_room(self, user_id, room_id, school_id):
        """
        Validate room membership within the tenant's scope.
        Replace this with a real ChatRoom membership model when available.
        """
        from notifications.models import Notification  # noqa: PLC0415

        return Notification.objects.filter(
            user_id=user_id,
            title__icontains=room_id,
        ).exists()
