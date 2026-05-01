from django.db import models
from django.core.validators import RegexValidator
from schools.models import SoftDeleteModel

class Student(SoftDeleteModel):
    GENDER_CHOICES = (
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    )

    school = models.ForeignKey('schools.School', on_delete=models.CASCADE, related_name='students', db_index=True)
    user = models.OneToOneField('accounts.User', on_delete=models.CASCADE, related_name='student_profile', null=True, blank=True)
    admission_number = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    photo = models.ImageField(upload_to='student_photos/', null=True, blank=True)
    enrollment_date = models.DateField(auto_now_add=True)
    stream = models.ForeignKey('classes.Stream', on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
    
    # Parent details
    parent_name = models.CharField(max_length=200)
    phone_regex = RegexValidator(regex=r'^\+?1?\d{9,15}$', message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.")
    parent_phone = models.CharField(validators=[phone_regex], max_length=17)
    parent_email = models.EmailField(null=True, blank=True)
    
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.admission_number})"
