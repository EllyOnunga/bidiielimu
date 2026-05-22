from django.db import models


class Resource(models.Model):
    CATEGORY_CHOICES = (
        ("NOTE", "Lesson Note"),
        ("VIDEO", "Video Lecture"),
        ("BOOK", "E-Book"),
        ("OTHER", "Other Resource"),
    )
    subject = models.ForeignKey(
        "classes.Subject", on_delete=models.CASCADE, related_name="resources"
    )
    title = models.CharField(max_length=200)
    file = models.FileField(upload_to="lms/resources/")
    category = models.CharField(max_length=10, choices=CATEGORY_CHOICES, default="NOTE")
    version = models.IntegerField(default=1)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    stream = models.ForeignKey(
        "classes.Stream",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="resources",
    )
    uploaded_by = models.ForeignKey(
        "teachers.Teacher",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploaded_resources",
    )

    def __str__(self):
        return f"{self.title} (v{self.version})"


class Assignment(models.Model):
    subject = models.ForeignKey(
        "classes.Subject", on_delete=models.CASCADE, related_name="assignments"
    )
    stream = models.ForeignKey(
        "classes.Stream",
        on_delete=models.CASCADE,
        related_name="assignments",
        null=True,
        blank=True,
    )
    teacher = models.ForeignKey(
        "teachers.Teacher", on_delete=models.CASCADE, related_name="assignments"
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    due_date = models.DateTimeField()
    max_score = models.IntegerField(default=100)
    file = models.FileField(upload_to="lms/assignments/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Submission(models.Model):
    assignment = models.ForeignKey(
        Assignment, on_delete=models.CASCADE, related_name="submissions"
    )
    student = models.ForeignKey(
        "students.Student", on_delete=models.CASCADE, related_name="submissions"
    )
    submitted_at = models.DateTimeField(auto_now_add=True)
    file = models.FileField(upload_to="lms/submissions/", null=True, blank=True)
    text_content = models.TextField(null=True, blank=True)
    grade = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    feedback = models.TextField(null=True, blank=True)
    graded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("assignment", "student")

    def __str__(self):
        return f"{self.student} - {self.assignment}"


class LessonNote(models.Model):
    subject = models.ForeignKey(
        "classes.Subject", on_delete=models.CASCADE, related_name="notes"
    )
    title = models.CharField(max_length=200)
    content = models.TextField()
    file = models.FileField(upload_to="lms/notes/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class NoteConfirmation(models.Model):
    note = models.ForeignKey(
        LessonNote, on_delete=models.CASCADE, related_name="confirmations"
    )
    student = models.ForeignKey(
        "students.Student", on_delete=models.CASCADE, related_name="note_readings"
    )
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("note", "student")


class Quiz(models.Model):
    subject = models.ForeignKey(
        "classes.Subject", on_delete=models.CASCADE, related_name="quizzes"
    )
    stream = models.ForeignKey(
        "classes.Stream",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="quizzes",
    )
    teacher = models.ForeignKey(
        "teachers.Teacher",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="quizzes",
    )

    title = models.CharField(max_length=200)
    description = models.TextField(null=True, blank=True)
    duration_minutes = models.IntegerField(default=30)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title


class Question(models.Model):
    TYPE_CHOICES = (
        ("MCQ", "Multiple Choice"),
        ("TEXT", "Short Text"),
    )
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="questions")
    text = models.TextField()
    question_type = models.CharField(max_length=5, choices=TYPE_CHOICES, default="MCQ")
    points = models.IntegerField(default=1)
    correct_answer = models.CharField(max_length=255)  # For MCQ: index of option
    options = models.JSONField(null=True, blank=True)  # e.g. ["Option A", "Option B"]

    def __str__(self):
        return self.text[:50]


class QuizAttempt(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="attempts")
    student = models.ForeignKey(
        "students.Student", on_delete=models.CASCADE, related_name="quiz_attempts"
    )
    score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    completed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student} - {self.quiz} ({self.score})"


# New scalable LMS models for robustness
class StudentProgress(models.Model):
    student = models.ForeignKey(
        "students.Student", on_delete=models.CASCADE, related_name="progress"
    )
    subject = models.ForeignKey("classes.Subject", on_delete=models.CASCADE)
    completion_percent = models.FloatField(default=0)
    last_accessed = models.DateTimeField(auto_now=True)
    streak_days = models.IntegerField(default=0)

    class Meta:
        unique_together = ("student", "subject")


class VideoWatchTime(models.Model):
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE)
    student = models.ForeignKey("students.Student", on_delete=models.CASCADE)
    watched_seconds = models.IntegerField(default=0)
    last_position = models.IntegerField(default=0)
    completed = models.BooleanField(default=False)


class Discussion(models.Model):
    resource = models.ForeignKey(
        Resource,
        on_delete=models.CASCADE,
        related_name="discussions",
        null=True,
        blank=True,
    )
    assignment = models.ForeignKey(
        Assignment,
        on_delete=models.CASCADE,
        related_name="discussions",
        null=True,
        blank=True,
    )
    author = models.ForeignKey("accounts.User", on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
