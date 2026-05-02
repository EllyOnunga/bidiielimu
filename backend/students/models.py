from django.db import models
from django.core.validators import RegexValidator
from schools.models import SoftDeleteModel

class Student(SoftDeleteModel):
    GENDER_CHOICES = (
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    )
    
    CURRICULUM_CHOICES = (
        ('CBC', 'Kenya CBC'),
        ('KCSE', 'Kenya KCSE (8-4-4)'),
        ('IGCSE', 'Pearson Edexcel IGCSE'),
    )

    STATUS_CHOICES = (
        ('ACTIVE', 'Active'),
        ('TRANSFERRED', 'Transferred'),
        ('GRADUATED', 'Graduated'),
        ('DROPPED', 'Dropped Out'),
    )

    user = models.OneToOneField('accounts.User', on_delete=models.CASCADE, related_name='student_profile', null=True, blank=True)
    admission_number = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    photo = models.ImageField(upload_to='student_photos/', null=True, blank=True)
    enrollment_date = models.DateField()
    stream = models.ForeignKey('classes.Stream', on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
    curriculum = models.CharField(max_length=10, choices=CURRICULUM_CHOICES, default='CBC')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    
    # Candidate details (KCSE/IGCSE)
    index_number = models.CharField(max_length=50, null=True, blank=True)
    upi_number = models.CharField(max_length=50, null=True, blank=True, verbose_name="Nemis UPI")
    
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.admission_number})"

class Guardian(models.Model):
    RELATIONSHIP_CHOICES = (
        ('FATHER', 'Father'),
        ('MOTHER', 'Mother'),
        ('STEP_FATHER', 'Step Father'),
        ('STEP_MOTHER', 'Step Mother'),
        ('LEGAL_GUARDIAN', 'Legal Guardian'),
        ('SPONSOR', 'Sponsor'),
    )

    user = models.OneToOneField('accounts.User', on_delete=models.CASCADE, related_name='guardian_profile', null=True, blank=True)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='guardians')
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    relationship = models.CharField(max_length=20, choices=RELATIONSHIP_CHOICES)
    phone_regex = RegexValidator(regex=r'^\+?1?\d{9,15}$', message="Phone number format: '+999999999'.")
    phone_number = models.CharField(validators=[phone_regex], max_length=17)
    email = models.EmailField(null=True, blank=True)
    occupation = models.CharField(max_length=100, null=True, blank=True)
    is_emergency_contact = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.relationship} of {self.student.first_name})"

class MedicalRecord(models.Model):
    BLOOD_GROUPS = (
        ('A+', 'A+'), ('A-', 'A-'), ('B+', 'B+'), ('B-', 'B-'),
        ('AB+', 'AB+'), ('AB-', 'AB-'), ('O+', 'O+'), ('O-', 'O-'),
    )

    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name='medical_record')
    blood_group = models.CharField(max_length=3, choices=BLOOD_GROUPS, null=True, blank=True)
    allergies = models.TextField(null=True, blank=True)
    chronic_conditions = models.TextField(null=True, blank=True)
    medications = models.TextField(null=True, blank=True)
    emergency_notes = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Medical Record for {self.student.first_name}"

class StudentTransfer(models.Model):
    TRANSFER_TYPE = (
        ('IN', 'Transfer In'),
        ('OUT', 'Transfer Out'),
    )

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='transfers')
    transfer_type = models.CharField(max_length=3, choices=TRANSFER_TYPE)
    school_name = models.CharField(max_length=200)
    reason = models.TextField()
    date = models.DateField()
    transfer_letter = models.FileField(upload_to='transfer_letters/', null=True, blank=True)

    def __str__(self):
        return f"{self.transfer_type} - {self.school_name} ({self.student})"

