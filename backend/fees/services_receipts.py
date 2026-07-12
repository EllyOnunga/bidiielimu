import io

from django.db import connection

from schools.models import SchoolSetting

from .models import FeePayment

try:
    from reportlab.lib.colors import HexColor
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.units import inch
    from reportlab.pdfgen import canvas
except ImportError:
    pass


class ReceiptService:
    @staticmethod
    def generate_receipt_text(payment_id):
        payment = FeePayment.objects.select_related("student", "invoice").get(
            id=payment_id
        )

        school_name = (
            connection.tenant.name.upper()
            if hasattr(connection, "tenant") and connection.tenant
            else "GILANIOS ACADEMY"
        )

        receipt = [
            "-------------------------------------------",
            f"{school_name:^43}",
            "          OFFICIAL FEE RECEIPT             ",
            "-------------------------------------------",
            f"Receipt No: {payment.transaction_id}",
            f"Date:       {payment.payment_date}",
            f"Student:    {payment.student.first_name} {payment.student.last_name}",
            f"Adm No:     {payment.student.admission_number}",
            "-------------------------------------------",
            f"Amount Paid: {payment.currency} {payment.amount}",
            f"Method:      {payment.get_payment_method_display()}",
            "-------------------------------------------",
        ]

        if payment.invoice:
            receipt.append(f"Current Balance: {payment.invoice.balance}")

        receipt.append("-------------------------------------------")
        receipt.append("      Thank you for your payment!         ")
        receipt.append("-------------------------------------------")

        return "\n".join(receipt)

    @staticmethod
    def generate_receipt_pdf(payment_id):
        payment = FeePayment.objects.select_related("student", "invoice").get(
            id=payment_id
        )
        school_name = (
            connection.tenant.name.upper()
            if hasattr(connection, "tenant") and connection.tenant
            else "GILANIOS ACADEMY"
        )

        settings_obj = SchoolSetting.objects.first()
        primary_color = (
            settings_obj.accent_color
            if settings_obj and settings_obj.accent_color
            else "#2DD4BF"
        )

        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)

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

        c.showPage()
        c.save()

        buffer.seek(0)
        return buffer.getvalue()
