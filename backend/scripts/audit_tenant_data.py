import os
import sys

import django
from django_tenants.utils import schema_context

from classes.models import Stream, Subject, SubjectAssignment
from exams.models import Exam, GradingSystem
from schools.models import School
from students.models import Student
from teachers.models import Teacher

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()


def audit_tenant(schema_name):
    print(f"\n" + "=" * 50)
    print(f"AUDITING TENANT: {schema_name}")
    print("=" * 50)

    with schema_context(schema_name):
        issues = []

        # 1. Teachers Check
        teachers = Teacher.objects.all()
        teachers_no_user = teachers.filter(user__isnull=True)
        if teachers_no_user.exists():
            issues.append(f"CRITICAL: {
                    teachers_no_user.count()} teachers have no linked User account.")
            for t in teachers_no_user:
                print(f"  - Teacher ID {t.id}: {t.first_name} {t.last_name}")

        # 2. Students Check
        students = Student.objects.all()
        students_no_stream = students.filter(stream__isnull=True)
        if students_no_stream.exists():
            issues.append(
                f"WARNING: {
                    students_no_stream.count()} students are not assigned to any stream."
            )

        # 3. Streams Check
        streams = Stream.objects.all()
        streams_no_teacher = streams.filter(teacher__isnull=True)
        if streams_no_teacher.exists():
            issues.append(
                f"INFO: {
                    streams_no_teacher.count()} streams have no class teacher assigned."
            )

        # 4. Subject Assignments Check
        assignments = SubjectAssignment.objects.all()
        print(f"Found {assignments.count()} Subject Assignments.")
        if assignments.count() == 0:
            issues.append(
                "CRITICAL: No Subject Assignments found. Teachers will not be able to record marks."
            )

        # 5. Exams Check
        exams = Exam.objects.all()
        exams_no_grading = exams.filter(grading_system__isnull=True)
        if exams_no_grading.exists():
            issues.append(f"WARNING: {
                    exams_no_grading.count()} exams have no grading system linked.")
            for e in exams_no_grading:
                print(f"  - Exam: {e.name} ({e.academic_year})")

        # 6. Grading Systems Check
        if GradingSystem.objects.count() == 0:
            issues.append("WARNING: No Grading Systems defined.")

        # Summary
        print(f"\nAudit Summary for {schema_name}:")
        print(f"- Teachers: {teachers.count()}")
        print(f"- Students: {students.count()}")
        print(f"- Streams: {streams.count()}")
        print(f"- Subjects: {Subject.objects.count()}")
        print(f"- Assignments: {assignments.count()}")
        print(f"- Exams: {exams.count()}")

        if not issues:
            print("\n✅ NO ISSUES FOUND. Data integrity looks good.")
        else:
            print(f"\n❌ FOUND {len(issues)} ISSUES:")
            for issue in issues:
                print(f"  - {issue}")


def main():
    target_tenant = sys.argv[1] if len(sys.argv) > 1 else None

    if target_tenant:
        try:
            audit_tenant(target_tenant)
        except Exception as e:
            print(f"Error auditing {target_tenant}: {e}")
    else:
        # Audit all tenants
        for school in School.objects.exclude(schema_name="public"):
            audit_tenant(school.schema_name)


if __name__ == "__main__":
    main()
