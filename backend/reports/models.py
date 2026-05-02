from django.db import models
from django.conf import settings
from students.models import Student
from exams.models import Exam

class StudentReport(models.Model):
    STATUS_CHOICES = (
        ('DRAFT', 'AI Draft'),
        ('REVIEWED', 'Teacher Reviewed'),
        ('APPROVED', 'Principal Approved'),
        ('PUBLISHED', 'Published to Parent'),
    )

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='terminal_reports')
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE)
    term = models.IntegerField(default=1)
    academic_year = models.IntegerField(default=2024)
    
    # AI Content
    ai_comment_draft = models.TextField(null=True, blank=True)
    teacher_comment = models.TextField(null=True, blank=True) # Final version
    
    # Metadata
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    is_ai_generated = models.BooleanField(default=False)
    generated_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        unique_together = ('student', 'exam')

    def __str__(self):
        return f"Report: {self.student.get_full_name()} - {self.exam.name}"
