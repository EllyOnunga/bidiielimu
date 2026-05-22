import os
import uuid

from django.conf import settings
from django.http import HttpResponse
from rest_framework import permissions, status, views
from rest_framework.response import Response

from config.cache_service import TenantCacheService

from .services import StudentImportService
from .tasks import import_students_csv_task


class StudentImportView(views.APIView):
    """
    Endpoint for bulk importing students via CSV asynchronously.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        if "file" not in request.FILES:
            return Response(
                {"detail": "No file provided."}, status=status.HTTP_400_BAD_REQUEST
            )

        csv_file = request.FILES["file"]
        if not csv_file.name.endswith(".csv"):
            return Response(
                {"detail": "File must be a CSV."}, status=status.HTTP_400_BAD_REQUEST
            )

        # Enforce maximum file size (e.g. 10MB) to prevent Denial of Service (DoS)
        if csv_file.size > 10 * 1024 * 1024:
            return Response(
                {"detail": "File size exceeds the 10MB limit."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        schema_name = request.tenant.schema_name

        # Create tenant-segregated directory
        temp_dir = os.path.abspath(
            os.path.join(settings.MEDIA_ROOT, schema_name, "temp_imports")
        )
        os.makedirs(temp_dir, exist_ok=True)

        # Generate unique filename using UUID
        file_uuid = uuid.uuid4().hex
        filename = f"{file_uuid}.csv"
        file_path = os.path.abspath(os.path.join(temp_dir, filename))

        # Path traversal protection
        if not file_path.startswith(temp_dir + os.path.sep):
            return Response(
                {
                    "detail": "Security exception: Invalid file storage path boundary checked."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Save to disk securely
        try:
            with open(file_path, "wb+") as destination:
                for chunk in csv_file.chunks():
                    destination.write(chunk)
        except Exception as e:
            return Response(
                {"detail": f"Failed to save temporary file: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Dispatch Celery background task
        task = import_students_csv_task.delay(schema_name, file_path, request.user.id)

        return Response(
            {
                "task_id": task.id,
                "detail": "Import process started in background.",
                "status": "PENDING",
            },
            status=status.HTTP_202_ACCEPTED,
        )


class StudentImportStatusView(views.APIView):
    """
    Poller endpoint to check real-time progress of bulk CSV student imports.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, task_id, *args, **kwargs):
        from celery.result import AsyncResult

        res = AsyncResult(task_id)

        meta = res.info if isinstance(res.info, dict) else {}

        # Strict Authorization Mapping & Tenant Isolation:
        # Prevent cross-tenant metadata disclosure or task polling.
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
            "success_count": meta.get("success_count", 0),
            "errors": meta.get("errors", []),
        }

        if res.state == "SUCCESS":
            task_return = res.info if isinstance(res.info, dict) else {}
            response_data["success_count"] = task_return.get(
                "success_count", response_data["success_count"]
            )
            response_data["errors"] = task_return.get("errors", response_data["errors"])
            response_data["current"] = response_data["total"]
        elif res.state == "FAILURE":
            response_data["errors"] = (
                [str(res.info)] if res.info else ["Execution failure."]
            )

        return Response(response_data, status=status.HTTP_200_OK)


class StudentImportTemplateView(views.APIView):
    """
    Returns a downloadable CSV template for student imports (Cached for 24h per tenant).
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        cache_key = "student_import_template"

        # Retrieve or generate and cache the CSV template content
        template_content = TenantCacheService.get(cache_key)
        if not template_content:
            template_content = StudentImportService.get_csv_template()
            TenantCacheService.set(
                cache_key, template_content, timeout=86400
            )  # 24 hours

        response = HttpResponse(template_content, content_type="text/csv")
        response["Content-Disposition"] = (
            'attachment; filename="student_import_template.csv"'
        )
        return response
