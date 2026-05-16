import logging

logger = logging.getLogger(__name__)


def set_rls_session_variables(connections_list, tenant_id=None, user_id=None):
    """
    Sets session-level variables in PostgreSQL to be used by RLS policies.
    """
    for conn in connections_list:
        if not hasattr(conn, "cursor"):
            continue

        try:
            with conn.cursor() as cursor:
                # Set tenant ID
                if tenant_id:
                    cursor.execute(
                        "SELECT set_config('app.current_tenant_id', %s, false)",
                        [str(tenant_id)],
                    )
                else:
                    cursor.execute(
                        "SELECT set_config('app.current_tenant_id', '', false)"
                    )

                # Set user ID
                if user_id:
                    cursor.execute(
                        "SELECT set_config('app.current_user_id', %s, false)",
                        [str(user_id)],
                    )
                else:
                    cursor.execute(
                        "SELECT set_config('app.current_user_id', '', false)"
                    )

        except Exception as e:
            logger.error(f"Error setting RLS session variables on connection {
                    conn.alias}: {
                    str(e)}")


def clear_rls_session_variables(connections_list):
    """
    Clears RLS session variables.
    """
    set_rls_session_variables(connections_list, tenant_id=None, user_id=None)
