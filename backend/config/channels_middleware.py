import logging
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()
logger = logging.getLogger(__name__)


@database_sync_to_async
def _resolve_user_and_tenant(token_string):
    """
    Validate JWT, load the user, and resolve their active school/tenant.

    Returns:
        (user, school_id, schema_name) on success
        (AnonymousUser, None, None)    on any failure
    """
    try:
        access_token = AccessToken(token_string)
        user_id = access_token["user_id"]
        user = User.objects.get(id=user_id)
    except (TokenError, User.DoesNotExist, Exception):
        return AnonymousUser(), None, None

    # Prefer school encoded in the JWT claim (set at login time)
    try:
        school_id = access_token.get("school_id")
        if school_id:
            from schools.models import School  # noqa: PLC0415

            school = School.objects.get(id=school_id)
            return user, school.id, school.schema_name
    except Exception:
        pass  # Fall through to membership lookup

    # Fall back to the user's active membership
    try:
        membership = (
            user.school_memberships.select_related("school")
            .filter(is_active=True)
            .first()
        )
        if membership:
            return user, membership.school_id, membership.school.schema_name
    except Exception:
        logger.exception(
            "WS: error resolving tenant for user %s", getattr(user, "id", "?")
        )

    # Authenticated but no tenant – surface the user so consumers can close cleanly
    return user, None, None


def _extract_token(scope):
    """
    Extract a JWT string from (in priority order):

    1. ``Sec-WebSocket-Protocol`` subprotocol header
       Clients should send:  ``Sec-WebSocket-Protocol: jwt.<token>``
       or the two-field variant: ``Sec-WebSocket-Protocol: jwt, <token>``

    2. ``Authorization: Bearer <token>`` header

    3. ``?token=<token>`` query parameter  ← legacy; logs a deprecation warning

    Returns:
        (token_str, source_label) or (None, None)
    """
    headers = {
        k.decode("utf-8", errors="replace").lower(): v.decode("utf-8", errors="replace")
        for k, v in scope.get("headers", [])
    }

    # 1. Subprotocol: "jwt.<token>" or "jwt, <token>"
    subprotocol = headers.get("sec-websocket-protocol", "")
    if subprotocol:
        for part in [p.strip() for p in subprotocol.split(",")]:
            if part.lower().startswith("jwt."):
                return part[4:], "subprotocol"
        parts = [p.strip() for p in subprotocol.split(",")]
        if len(parts) == 2 and parts[0].lower() == "jwt":
            return parts[1], "subprotocol"

    # 2. Bearer header
    auth = headers.get("authorization", "")
    if auth.lower().startswith("bearer "):
        return auth.split(" ", 1)[1].strip(), "header"

    # 3. Query param (legacy – logs a warning)
    qs = parse_qs(scope.get("query_string", b"").decode("utf-8", errors="replace"))
    token_list = qs.get("token")
    if token_list:
        logger.warning(
            "WS auth: JWT passed via query string – this is deprecated and insecure "
            "(tokens appear in server access logs). Migrate the client to use the "
            "'Sec-WebSocket-Protocol: jwt.<token>' subprotocol or an "
            "'Authorization: Bearer <token>' header."
        )
        return token_list[0], "query"

    return None, None


class JWTAuthMiddleware:
    """
    Django Channels middleware that authenticates WebSocket connections via JWT.

    Sets the following keys on ``scope``:
      - ``scope["user"]``          – authenticated User or AnonymousUser
      - ``scope["school_id"]``     – int PK of the resolved school, or None
      - ``scope["tenant_schema"]`` – PostgreSQL schema name, or None

    Consumers should reject connections where ``user.is_anonymous`` or
    ``school_id`` is None (see ``TenantAwareMixin`` in consumers.py).
    """

    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        if scope["type"] not in ("websocket", "http"):
            return await self.inner(scope, receive, send)

        token, _source = _extract_token(scope)

        if token:
            user, school_id, schema_name = await _resolve_user_and_tenant(token)
        else:
            user, school_id, schema_name = AnonymousUser(), None, None

        scope["user"] = user
        scope["school_id"] = school_id
        scope["tenant_schema"] = schema_name

        return await self.inner(scope, receive, send)
