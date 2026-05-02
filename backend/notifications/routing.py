from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/notifications/$', consumers.NotificationConsumer.as_view()),
    re_path(r'ws/emergency/$', consumers.EmergencyConsumer.as_view()),
]
