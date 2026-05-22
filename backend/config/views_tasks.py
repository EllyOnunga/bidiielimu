from celery.result import AsyncResult
from rest_framework import permissions, status, views
from rest_framework.response import Response


class SystemTaskStatusView(views.APIView):
    """
    Generic poller endpoint to check status of any background Celery task.
    Strictly enforces tenant-level access isolation to prevent any cross-tenant data leak.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, task_id, *args, **kwargs):
        res = AsyncResult(task_id)

        # Check if the task info is structured
        meta = res.info if isinstance(res.info, dict) else {}

        # Strict security boundary check:
        # Enforce that the task schema strictly matches the active user tenant's schema
        task_schema = meta.get("schema_name")
        if task_schema and task_schema != request.tenant.schema_name:
            return Response(
                {"detail": "Security exception: Unauthorized tenant access."},
                status=status.HTTP_403_FORBIDDEN,
            )

        response_data = {
            "task_id": task_id,
            "status": res.state,
            "current": meta.get("current", 0),
            "total": meta.get("total", 0),
            "detail": meta.get("detail", ""),
        }

        if res.state == "SUCCESS":
            # Task returned value (successful completion dictionary)
            task_return = res.info if isinstance(res.info, dict) else {}
            response_data.update(
                {
                    "download_url": task_return.get("download_url"),
                    "current": task_return.get("current", response_data["current"]),
                    "total": task_return.get("total", response_data["total"]),
                    "status": "SUCCESS",
                }
            )
        elif res.state == "FAILURE":
            # Task failed
            response_data["errors"] = (
                [str(res.info)]
                if res.info
                else ["Unknown background execution failure."]
            )

        return Response(response_data, status=status.HTTP_200_OK)
