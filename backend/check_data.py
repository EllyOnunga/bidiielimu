import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django_tenants.utils import schema_context

from classes.models import Stream, Subject, SubjectAssignment
from exams.models import Exam, Mark
from students.models import Student
from teachers.models import Teacher

with schema_context("makini_school"):
    print(f"--- Schema: makini_school ---")
    print(f"Teachers: {Teacher.objects.count()}")
    print(f"Streams: {Stream.objects.count()}")
    print(f"Subjects: {Subject.objects.count()}")
    print(f"Subject Assignments: {SubjectAssignment.objects.count()}")
    print(f"Exams: {Exam.objects.count()}")
    print(f"Marks: {Mark.objects.count()}")
    print(f"Students: {Student.objects.count()}")

    print("\n--- Subject Assignments Details ---")
    for sa in SubjectAssignment.objects.all().select_related(
        "teacher", "subject", "stream"
    ):
        print(
            f"Teacher: {sa.teacher.first_name} {sa.teacher.last_name}, Subject: {sa.subject.name}, Stream: {sa.stream}"
        )

    print("\n--- Exams Details ---")
    for ex in Exam.objects.all():
        print(f"Exam: {ex.name}, Year: {ex.academic_year}, Term: {ex.term}")

    print("\n--- Streams Details ---")
    for s in Stream.objects.all():
        student_count = Student.objects.filter(stream=s).count()
        print(f"Stream: {s}, Students: {student_count}")
