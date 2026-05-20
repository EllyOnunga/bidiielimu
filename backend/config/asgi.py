import os

from config.sentry import init_sentry

# Initialize Sentry before Django starts
init_sentry()
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

import notifications.routing
from config.channels_middleware import JWTAuthMiddleware

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

application = ProtocolTypeRouter(
    {
        "http": get_asgi_application(),
        "websocket": JWTAuthMiddleware(
            URLRouter(notifications.routing.websocket_urlpatterns)
        ),
    }
)
