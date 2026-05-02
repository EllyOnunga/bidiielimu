from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class GradingSystem(models.Model):
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
    EXAM_TYPES = (
        ('CAT', 'Continuous Assessment Test'),
        ('OPENER', 'Opener Exam'),
        ('MID_TERM', 'Mid-Term Exam'),
        ('END_TERM', 'End-Term Exam'),
        ('MOCK', 'National Mock Simulation'),
        ('NATIONAL', 'National Exam (Final)'),
    )

    grading_system = models.ForeignKey(GradingSystem, on_delete=models.SET_NULL, null=True, blank=True, related_name='exams')
    name = models.CharField(max_length=200) # e.g., End of Term 1
    term = models.CharField(max_length=50)
    academic_year = models.CharField(max_length=10)
    exam_type = models.CharField(max_length=20, choices=EXAM_TYPES, default='END_TERM')
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
    is_absent = models.BooleanField(default=False)
    teacher_remarks = models.TextField(null=True, blank=True)

    class Meta:
        unique_together = ('exam', 'student', 'subject')

    def __str__(self):
        if self.is_absent:
            return f"{self.student} - {self.subject}: ABSENT"
        return f"{self.student} - {self.subject}: {self.score}"

class ExamRanking(models.Model):
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='rankings')
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='rankings')
    total_marks = models.DecimalField(max_digits=7, decimal_places=2)
    mean_score = models.DecimalField(max_digits=5, decimal_places=2)
    mean_grade = models.CharField(max_length=5, null=True, blank=True)
    class_position = models.IntegerField(null=True, blank=True)
    stream_position = models.IntegerField(null=True, blank=True)
    total_students_in_stream = models.IntegerField(null=True, blank=True)
    total_students_in_class = models.IntegerField(null=True, blank=True)
    computed_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'exam')
        ordering = ['-total_marks']

    def __str__(self):
        return f"Rank {self.class_position} - {self.student} ({self.exam})"


class CBCAssessment(models.Model):
    ASSESSMENT_SCALE = (
        (4, 'Exceeding Expectation (EE)'),
        (3, 'Meeting Expectation (ME)'),
        (2, 'Approaching Expectation (AE)'),
        (1, 'Below Expectation (BE)'),
    )

    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='cbc_assessments')
    sub_strand = models.ForeignKey('classes.SubStrand', on_delete=models.CASCADE, related_name='assessments')
    rating = models.IntegerField(choices=ASSESSMENT_SCALE)
    remarks = models.TextField(null=True, blank=True)
    date = models.DateField(auto_now_add=True)
    assessed_by = models.ForeignKey('teachers.Teacher', on_delete=models.SET_NULL, null=True)

    class Meta:
        unique_together = ('student', 'sub_strand', 'date')

    def __str__(self):
        return f"{self.student} - {self.sub_strand.name}: {self.get_rating_display()}"

