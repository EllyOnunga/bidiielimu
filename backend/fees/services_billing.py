from django.utils import timezone
from .models import FeeStructure, Invoice
from students.models import Student

class BillingService:
    @staticmethod
    def generate_term_invoices(grade_level_id, term, academic_year):
        fee_structure = FeeStructure.objects.filter(
            grade_level_id=grade_level_id,
            term=term,
            academic_year=academic_year
        ).first()

        if not fee_structure:
            return 0

        students = Student.objects.filter(stream__grade_level_id=grade_level_id, status='ACTIVE')
        count = 0
        
        for student in students:
            # Check if invoice already exists
            invoice, created = Invoice.objects.get_or_create(
                student=student,
                fee_structure=fee_structure,
                defaults={
                    'total_amount': fee_structure.amount,
                    'due_date': timezone.now().date() + timezone.timedelta(days=30),
                    'status': 'UNPAID'
                }
            )
            if created:
                count += 1
        
        return count

    @staticmethod
    def auto_invoice_all_active_students():
        # This can be called at the start of a term
        # It finds all active FeeStructures for the current year/term
        current_year = str(timezone.now().year)
        # Logic to determine current term (simplified)
        term = "Term 1" # Example
        
        structures = FeeStructure.objects.filter(academic_year=current_year, term=term)
        total_created = 0
        for struct in structures:
            total_created += BillingService.generate_term_invoices(
                struct.grade_level_id, term, current_year
            )
        return total_created
