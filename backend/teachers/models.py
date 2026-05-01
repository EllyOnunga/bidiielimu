from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import RegexValidator
from schools.models import SoftDeleteModel

class Teacher(SoftDeleteModel):
    school = models.ForeignKey('schools.School', on_delete=models.CASCADE, related_name='teachers', db_index=True)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='teacher_profile')
    employee_id = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone_regex = RegexValidator(regex=r'^\+?1?\d{9,15}$', message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.")
    phone_number = models.CharField(validators=[phone_regex], max_length=17)
    specialization = models.CharField(max_length=200, null=True, blank=True)
    joining_date = models.DateField()
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
