from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # User notifications
    re_path(r'ws/notifications/$', consumers.NotificationConsumer.as_asgi()),

    # Emergency broadcasts
    re_path(r'ws/emergency/$', consumers.EmergencyConsumer.as_asgi()),

    # Real-time attendance updates
    re_path(r'ws/attendance/$', consumers.AttendanceConsumer.as_asgi()),

    # Class updates and announcements
    re_path(r'ws/class-updates/$', consumers.ClassUpdateConsumer.as_asgi()),

    # Chat functionality
    re_path(r'ws/chat/(?P<room_id>\w+)/$', consumers.ChatConsumer.as_asgi()),
]
