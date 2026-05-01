from django.db import models

class DailyAttendance(models.Model):
    STATUS_CHOICES = (
        ('PRESENT', 'Present'),
        ('ABSENT', 'Absent'),
        ('LATE', 'Late'),
        ('EXCUSED', 'Excused'),
    )

    school = models.ForeignKey('schools.School', on_delete=models.CASCADE, related_name='attendance_records')
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='attendance')
    date = models.DateField(db_index=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PRESENT', db_index=True)
    remarks = models.TextField(null=True, blank=True)
    marked_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'date')
        verbose_name_plural = 'Daily Attendance'

    def __str__(self):
        return f"{self.student} - {self.date} ({self.status})"
