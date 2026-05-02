from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import RegexValidator
from schools.models import SoftDeleteModel

class Teacher(SoftDeleteModel):
    CONTRACT_CHOICES = (
        ('PERMANENT', 'Permanent & Pensionable'),
        ('BOM', 'BOM Contract'),
        ('INTERN', 'Internship'),
        ('PART_TIME', 'Part-time / Relief'),
    )

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='teacher_profile')
    employee_id = models.CharField(max_length=50, unique=True)
    tsc_number = models.CharField(max_length=50, null=True, blank=True, unique=True)
    national_id = models.CharField(max_length=20, null=True, blank=True, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    designation = models.CharField(max_length=100, null=True, blank=True)
    phone_regex = RegexValidator(regex=r'^\+?1?\d{9,15}$', message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.")
    phone_number = models.CharField(validators=[phone_regex], max_length=17)
    specialization = models.CharField(max_length=200, null=True, blank=True)
    qualifications = models.JSONField(default=list, blank=True) # List of degrees/certs
    contract_type = models.CharField(max_length=20, choices=CONTRACT_CHOICES, default='PERMANENT')
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    joining_date = models.DateField()
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class StaffProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='staff_profile')
    employee_id = models.CharField(max_length=50, unique=True)
    national_id = models.CharField(max_length=20, null=True, blank=True, unique=True)
    designation = models.CharField(max_length=100) # e.g. Accountant, Driver
    department = models.CharField(max_length=100)
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    joining_date = models.DateField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.designation})"

class LeaveRequest(models.Model):
    TYPE_CHOICES = (
        ('SICK', 'Sick Leave'),
        ('ANNUAL', 'Annual Leave'),
        ('MATERNITY', 'Maternity'),
        ('PATERNITY', 'Paternity'),
        ('COMPASSIONATE', 'Compassionate'),
    )
    STATUS_CHOICES = (
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('CANCELLED', 'Cancelled'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='leave_requests')
    leave_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='PENDING')
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='approved_leaves')
    applied_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.leave_type} ({self.status})"

class HRSettings(models.Model):
    # Statutory Rates (Kenya)
    shif_rate = models.DecimalField(max_digits=5, decimal_places=4, default=0.0275) # 2.75%
    housing_levy_rate = models.DecimalField(max_digits=5, decimal_places=4, default=0.015) # 1.5%
    nssf_tier_1_max = models.DecimalField(max_digits=10, decimal_places=2, default=7000.00)
    nssf_tier_2_max = models.DecimalField(max_digits=10, decimal_places=2, default=36000.00)
    
    class Meta:
        verbose_name = "HR & Payroll Setting"
        verbose_name_plural = "HR & Payroll Settings"

class TeacherAvailability(models.Model):
    # ... (existing availability model)
    pass


