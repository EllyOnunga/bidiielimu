from django.db import models
from django.conf import settings

class StaffProfile(models.Model):
    STATUS_CHOICES = (
        ('ACTIVE', 'Active'),
        ('ON_LEAVE', 'On Leave'),
        ('TERMINATED', 'Terminated'),
    )
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='staff_profile')
    employee_id = models.CharField(max_length=50, unique=True)
    department = models.CharField(max_length=100)
    job_title = models.CharField(max_length=100)
    joining_date = models.DateField()
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    
    def __str__(self):
        return f"{self.user.get_full_name()} ({self.employee_id})"

class PayrollRecord(models.Model):
    staff = models.ForeignKey(StaffProfile, on_delete=models.CASCADE, related_name='payroll_records')
    month = models.IntegerField()
    year = models.IntegerField()
    gross_salary = models.DecimalField(max_digits=12, decimal_places=2)
    deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_salary = models.DecimalField(max_digits=12, decimal_places=2)
    is_paid = models.BooleanField(default=False)
    paid_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ('staff', 'month', 'year')

class LeaveRequest(models.Model):
    staff = models.ForeignKey(StaffProfile, on_delete=models.CASCADE, related_name='leave_requests')
    start_date = models.DateField()
    end_date = models.DateField()
    leave_type = models.CharField(max_length=50) # e.g. Sick, Annual
    status = models.CharField(max_length=20, default='PENDING') # PENDING, APPROVED, REJECTED
    reason = models.TextField()
