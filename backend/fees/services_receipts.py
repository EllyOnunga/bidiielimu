from .models import FeePayment

class ReceiptService:
    @staticmethod
    def generate_receipt_text(payment_id):
        payment = FeePayment.objects.select_related('student', 'invoice').get(id=payment_id)
        
        receipt = [
            "-------------------------------------------",
            "            SCHOLARA ACADEMY               ",
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
    def generate_pdf_placeholder(payment_id):
        # In production, use reportlab or weasyprint
        return "PDF generation logic would go here."
