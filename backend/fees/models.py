from django.db import models

class FeeStructure(models.Model):
    school = models.ForeignKey('schools.School', on_delete=models.CASCADE, related_name='fee_structures')
    grade_level = models.ForeignKey('classes.GradeLevel', on_delete=models.CASCADE)
    term = models.CharField(max_length=50) # e.g., Term 1, Term 2
    academic_year = models.CharField(max_length=10) # e.g., 2024
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(null=True, blank=True)

    class Meta:
        unique_together = ('school', 'grade_level', 'term', 'academic_year')

    def __str__(self):
        return f"{self.grade_level.name} - {self.term} ({self.academic_year})"

class FeePayment(models.Model):
    PAYMENT_METHODS = (
        ('MPESA', 'M-Pesa'),
        ('BANK', 'Bank Transfer'),
        ('CASH', 'Cash'),
        ('CHEQUE', 'Cheque'),
    )

    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_date = models.DateField(auto_now_add=True)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    transaction_id = models.CharField(max_length=100, unique=True)
    received_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    notes = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.student.first_name} - {self.amount}"
