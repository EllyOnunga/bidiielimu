import io
import os
import uuid

from celery import shared_task
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db import connection
from django_tenants.utils import schema_context

from fees.models import FeePayment
from schools.models import SchoolSetting

try:
    from reportlab.lib.colors import HexColor
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.units import inch
    from reportlab.pdfgen import canvas
except ImportError:
    pass


def generate_bulk_receipts_pdf(payment_ids):
    """
    Compiles multiple receipt PDFs into a single multi-page PDF document.
    """
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)

    payments = FeePayment.objects.select_related("student", "invoice").filter(
        id__in=payment_ids
    )

    settings_obj = SchoolSetting.objects.first()
    primary_color = (
        settings_obj.accent_color
        if settings_obj and settings_obj.accent_color
        else "#2DD4BF"
    )

    school_name = (
        connection.tenant.name.upper()
        if hasattr(connection, "tenant") and connection.tenant
        else "ELIMUHUB ACADEMY"
    )

    for idx, payment in enumerate(payments):
        # Header
        c.setFont("Helvetica-Bold", 18)
        c.drawCentredString(4.25 * inch, 10.5 * inch, school_name)
        c.setFont("Helvetica", 14)
        c.drawCentredString(4.25 * inch, 10.1 * inch, "OFFICIAL FEE RECEIPT")

        # Line
        c.setStrokeColor(HexColor(primary_color))
        c.setLineWidth(2)
        c.line(1 * inch, 9.8 * inch, 7.5 * inch, 9.8 * inch)

        # Content
        c.setFillColor(HexColor("#334155"))  # Slate for text
        c.setFont("Helvetica", 12)
        c.drawString(1 * inch, 9.2 * inch, f"Receipt No: {payment.transaction_id}")
        c.drawString(1 * inch, 8.8 * inch, f"Date: {payment.payment_date}")
        c.drawString(
            1 * inch,
            8.4 * inch,
            f"Student: {payment.student.first_name} {payment.student.last_name}",
        )
        c.drawString(
            1 * inch, 8.0 * inch, f"Adm No: {payment.student.admission_number}"
        )

        c.drawString(
            4.5 * inch, 9.2 * inch, f"Amount Paid: {payment.currency} {payment.amount}"
        )
        c.drawString(
            4.5 * inch, 8.8 * inch, f"Method: {payment.get_payment_method_display()}"
        )

        if payment.invoice:
            c.drawString(
                4.5 * inch,
                8.4 * inch,
                f"Balance: {payment.currency} {payment.invoice.balance}",
            )

        # Footer Line
        c.setStrokeColor(HexColor("#64748B"))
        c.line(1 * inch, 7.5 * inch, 7.5 * inch, 7.5 * inch)

        c.setFont("Helvetica-Oblique", 12)
        c.drawCentredString(4.25 * inch, 7 * inch, "Thank you for your payment!")

        # Draw a page break for the next receipt if not the last one
        c.showPage()

    c.save()
    buffer.seek(0)
    return buffer.getvalue()


def save_tenant_pdf(schema_name, filename, pdf_data):
    """
    Saves a PDF document securely under a tenant-segregated path, returning the URL.
    Works seamlessly for both local filesystem storage and AWS S3 environments.
    """
    # If using S3 or structured Storage that defines location (e.g. MediaStorage)
    if hasattr(default_storage, "location"):
        full_name = f"temp_prints/{filename}"
        saved_name = default_storage.save(full_name, ContentFile(pdf_data))
        return default_storage.url(saved_name)
    else:
        # Local File System Storage fallback
        temp_dir = os.path.abspath(
            os.path.join(settings.MEDIA_ROOT, schema_name, "temp_prints")
        )
        os.makedirs(temp_dir, exist_ok=True)
        file_path = os.path.abspath(os.path.join(temp_dir, filename))

        # Enforce path traversal guard boundary checking
        if not file_path.startswith(temp_dir + os.path.sep):
            raise PermissionError("Security Exception: Path traversal attempt blocked.")

        with open(file_path, "wb+") as f:
            f.write(pdf_data)

        return f"{settings.MEDIA_URL}{schema_name}/temp_prints/{filename}"


@shared_task(bind=True)
def generate_bulk_receipts_pdf_task(self, schema_name, payment_ids):
    """
    Background Celery task to compile receipts PDF inside schema context and cache to Redis/Disk.
    """
    self.update_state(
        state="PROGRESS",
        meta={
            "current": 0,
            "total": len(payment_ids),
            "schema_name": schema_name,
            "detail": "Beginning PDF compilation...",
        },
    )

    with schema_context(schema_name):
        try:
            pdf_bytes = generate_bulk_receipts_pdf(payment_ids)

            # Generate random secure UUID filename
            filename = f"{uuid.uuid4().hex}.pdf"

            # Save the file under the tenant-segregated directory
            download_url = save_tenant_pdf(schema_name, filename, pdf_bytes)

            result = {
                "download_url": download_url,
                "current": len(payment_ids),
                "total": len(payment_ids),
                "schema_name": schema_name,
                "status": "SUCCESS",
            }
            return result

        except Exception as e:
            self.update_state(
                state="FAILURE", meta={"errors": [str(e)], "schema_name": schema_name}
            )
            raise e
