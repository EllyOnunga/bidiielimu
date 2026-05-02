from django.db import models

class FeeStructure(models.Model):
    CURRENCY_CHOICES = (
        ('KES', 'Kenya Shillings'),
        ('USD', 'US Dollars'),
    )

    grade_level = models.ForeignKey('classes.GradeLevel', on_delete=models.CASCADE)
    term = models.CharField(max_length=50) # e.g., Term 1, Term 2
    academic_year = models.CharField(max_length=10) # e.g., 2024
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='KES')
    description = models.TextField(null=True, blank=True)

    class Meta:
        unique_together = ('grade_level', 'term', 'academic_year')

    def __str__(self):
        return f"{self.grade_level.name} - {self.term} ({self.academic_year}): {self.currency} {self.amount}"

class Invoice(models.Model):
    STATUS_CHOICES = (
        ('PAID', 'Fully Paid'),
        ('PARTIAL', 'Partially Paid'),
        ('UNPAID', 'Unpaid'),
        ('OVERDUE', 'Overdue'),
    )

    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='invoices')
    fee_structure = models.ForeignKey(FeeStructure, on_delete=models.PROTECT)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    balance = models.DecimalField(max_digits=12, decimal_places=2)
    due_date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='UNPAID')
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        self.balance = self.total_amount - self.paid_amount
        if self.paid_amount >= self.total_amount:
            self.status = 'PAID'
        elif self.paid_amount > 0:
            self.status = 'PARTIAL'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Invoice {self.id} - {self.student} ({self.balance})"

class FeePayment(models.Model):
    PAYMENT_METHODS = (
        ('MPESA', 'M-Pesa STK'),
        ('STRIPE', 'Card (Stripe)'),
        ('BANK', 'Bank Transfer'),
        ('CASH', 'Cash'),
        ('CHEQUE', 'Cheque'),
    )

    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments', null=True, blank=True)
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='KES')
    payment_date = models.DateField(auto_now_add=True)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    transaction_id = models.CharField(max_length=100, unique=True)
    is_confirmed = models.BooleanField(default=True)
    received_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    notes = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Payment {self.transaction_id} - {self.amount}"

class FinancialAid(models.Model):
    TYPE_CHOICES = (
        ('BURSARY', 'Bursary'),
        ('WAIVER', 'Fee Waiver'),
        ('SCHOLARSHIP', 'Scholarship'),
    )

    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='financial_aid')
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='aid_applications', null=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    aid_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    source = models.CharField(max_length=200) # e.g. CDF, Equity Wings to Fly
    granted_at = models.DateField(auto_now_add=True)
    approved_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f"{self.aid_type} - {self.student} ({self.amount})"

