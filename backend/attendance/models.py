from django.db import models

class DailyAttendance(models.Model):
    STATUS_CHOICES = (
        ('PRESENT', 'Present'),
        ('ABSENT', 'Absent'),
        ('LATE', 'Late'),
        ('EXCUSED', 'Excused'),
    )

    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='daily_attendance')
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


class PeriodAttendance(models.Model):
    STATUS_CHOICES = (
        ('PRESENT', 'Present'),
        ('ABSENT', 'Absent'),
        ('LATE', 'Late'),
        ('EXCUSED', 'Excused'),
    )

    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='period_attendance')
    slot = models.ForeignKey('classes.ScheduleSlot', on_delete=models.CASCADE, related_name='attendance')
    date = models.DateField(db_index=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PRESENT', db_index=True)
    remarks = models.TextField(null=True, blank=True)
    marked_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    marked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'slot', 'date')
        verbose_name_plural = 'Period Attendance'

    def __str__(self):
        return f"{self.student} - {self.slot} ({self.date}): {self.status}"

