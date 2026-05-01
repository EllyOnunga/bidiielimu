from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class GradingSystem(models.Model):
    school = models.ForeignKey('schools.School', on_delete=models.CASCADE, related_name='grading_systems')
    name = models.CharField(max_length=100) # e.g., Standard 8-4-4, CBC
    
    def __str__(self):
        return self.name

class GradeThreshold(models.Model):
    grading_system = models.ForeignKey(GradingSystem, on_delete=models.CASCADE, related_name='thresholds')
    grade = models.CharField(max_length=5) # A, B, C...
    min_score = models.IntegerField()
    max_score = models.IntegerField()
    points = models.IntegerField()
    remarks = models.CharField(max_length=100)

class Exam(models.Model):
    school = models.ForeignKey('schools.School', on_delete=models.CASCADE, related_name='exams')
    grading_system = models.ForeignKey(GradingSystem, on_delete=models.SET_NULL, null=True, blank=True, related_name='exams')
    name = models.CharField(max_length=200) # e.g., End of Term 1
    term = models.CharField(max_length=50)
    academic_year = models.CharField(max_length=10)
    start_date = models.DateField()
    end_date = models.DateField()
    is_published = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name} ({self.academic_year})"

class Mark(models.Model):
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='marks')
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='marks')
    subject = models.ForeignKey('classes.Subject', on_delete=models.CASCADE)
    score = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    teacher_remarks = models.TextField(null=True, blank=True)

    class Meta:
        unique_together = ('exam', 'student', 'subject')

    def __str__(self):
        return f"{self.student} - {self.subject}: {self.score}"
