from django.db import models

class GradeLevel(models.Model):
    school = models.ForeignKey('schools.School', on_delete=models.CASCADE, related_name='grade_levels')
    name = models.CharField(max_length=50) # e.g., Grade 1, Grade 2, Class 8
    
    class Meta:
        unique_together = ('school', 'name')

    def __str__(self):
        return self.name

class Stream(models.Model):
    grade_level = models.ForeignKey(GradeLevel, on_delete=models.CASCADE, related_name='streams')
    name = models.CharField(max_length=50) # e.g., Blue, West, Alpha
    teacher = models.ForeignKey('teachers.Teacher', on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_streams')

    def __str__(self):
        return f"{self.grade_level.name} {self.name}"

class Subject(models.Model):
    school = models.ForeignKey('schools.School', on_delete=models.CASCADE, related_name='subjects')
    name = models.CharField(max_length=100) # e.g., Mathematics, English, Science
    code = models.CharField(max_length=20, null=True, blank=True)

    class Meta:
        unique_together = ('school', 'name')

    def __str__(self):
        return self.name

class SubjectAssignment(models.Model):
    school = models.ForeignKey('schools.School', on_delete=models.CASCADE, related_name='subject_assignments')
    teacher = models.ForeignKey('teachers.Teacher', on_delete=models.CASCADE, related_name='subject_assignments')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='assignments')
    stream = models.ForeignKey(Stream, on_delete=models.CASCADE, related_name='subject_assignments')

    class Meta:
        unique_together = ('stream', 'subject') # Only one teacher per subject per stream

    def __str__(self):
        return f"{self.teacher} - {self.subject} ({self.stream})"

class Classroom(models.Model):
    school = models.ForeignKey('schools.School', on_delete=models.CASCADE, related_name='classrooms')
    name = models.CharField(max_length=50)
    capacity = models.IntegerField(default=40)

    def __str__(self):
        return self.name

class ScheduleSlot(models.Model):
    DAYS = (
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    )

    stream = models.ForeignKey(Stream, on_delete=models.CASCADE, related_name='schedule')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    teacher = models.ForeignKey('teachers.Teacher', on_delete=models.CASCADE)
    classroom = models.ForeignKey(Classroom, on_delete=models.SET_NULL, null=True, blank=True)
    day_of_week = models.IntegerField(choices=DAYS)
    start_time = models.TimeField()
    end_time = models.TimeField()

    def __str__(self):
        return f"{self.stream} - {self.subject} ({self.get_day_of_week_display()})"

    def clean(self):
        from django.core.exceptions import ValidationError
        # Check for teacher overlap
        teacher_overlap = ScheduleSlot.objects.filter(
            teacher=self.teacher,
            day_of_week=self.day_of_week,
            start_time__lt=self.end_time,
            end_time__gt=self.start_time
        ).exclude(pk=self.pk)
        
        if teacher_overlap.exists():
            raise ValidationError(f"Teacher {self.teacher} is already booked at this time.")

        # Check for classroom overlap
        if self.classroom:
            room_overlap = ScheduleSlot.objects.filter(
                classroom=self.classroom,
                day_of_week=self.day_of_week,
                start_time__lt=self.end_time,
                end_time__gt=self.start_time
            ).exclude(pk=self.pk)
            if room_overlap.exists():
                raise ValidationError(f"Classroom {self.classroom} is already occupied at this time.")

        # Check for stream/class overlap
        stream_overlap = ScheduleSlot.objects.filter(
            stream=self.stream,
            day_of_week=self.day_of_week,
            start_time__lt=self.end_time,
            end_time__gt=self.start_time
        ).exclude(pk=self.pk)
        if stream_overlap.exists():
            raise ValidationError(f"Stream {self.stream} already has a lesson at this time.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
