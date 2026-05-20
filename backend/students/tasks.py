import csv
import io

from celery import shared_task
from django.contrib.auth import get_user_model
from django.db import transaction

from .models import Student

User = get_user_model()


@shared_task
def process_bulk_upload(csv_content, school_id, user_id):
    """
    Background task to process student bulk upload.
    """
    from schools.models import School

    school = School.objects.get(id=school_id)

    # We use io.StringIO to read the csv content
    file = io.StringIO(csv_content)
    reader = csv.DictReader(file)

    created_count = 0
    errors = []

    for row_idx, row in enumerate(reader, start=2):
        try:
            email = row.get("email")
            password = row.get("password", "Student123!")
            first_name = row.get("first_name")
            last_name = row.get("last_name")
            admission_number = row.get("admission_number")
            dob = row.get("date_of_birth")
            gender = row.get("gender")
            stream_id = row.get("stream_id")
            parent_name = row.get("parent_name")
            parent_phone = row.get("parent_phone")

            if not all([email, first_name, last_name, admission_number, dob]):
                errors.append(
                    f"Row {row_idx}: Missing required fields (email, names, admission, and DOB are required)."
                )
                continue

            with transaction.atomic():
                # Check if user already exists
                if User.objects.filter(email=email).exists():
                    errors.append(
                        f"Row {row_idx}: User with email {email} already exists."
                    )
                    continue

                from accounts.models import Role

                role_obj, _ = Role.objects.get_or_create(name="STUDENT")

                # Create User
                user = User.objects.create_user(
                    email=email,
                    password=password,
                    role=role_obj,
                    first_name=first_name,
                    last_name=last_name,
                    school=school,
                )

                # Create Student
                Student.objects.create(
                    school=school,
                    user=user,
                    admission_number=admission_number,
                    first_name=first_name,
                    last_name=last_name,
                    date_of_birth=dob,
                    gender=gender if gender in ["M", "F", "O"] else "O",
                    stream_id=stream_id if stream_id else None,
                    parent_name=parent_name,
                    parent_phone=parent_phone,
                )
                created_count += 1

        except Exception as e:
            errors.append(f"Row {row_idx}: {str(e)}")

    # Create notification for the user
    try:
        from notifications.models import Notification

        Notification.objects.create(
            user_id=user_id,
            title="Student Bulk Import Complete",
            message=f"Successfully imported {created_count} students. {
                len(errors)} errors encountered.",
            notification_type="success" if created_count > 0 else "error",
        )
    except Exception as e:
        print(f"Failed to create notification: {e}")

    return {"created": created_count, "errors": errors}


@shared_task(bind=True)
def import_students_csv_task(self, schema_name, file_path, user_id):
    """
    Background task to process student import from CSV under schema context.
    """
    import os
    import csv
    from datetime import datetime
    from django.conf import settings
    from django_tenants.utils import schema_context
    from students.models import Student, Guardian
    from classes.models import GradeLevel, Stream

    # Verify boundary of the file_path strictly to prevent traversal/security issues
    # The file should reside inside media/<schema_name>/temp_imports/
    expected_dir = os.path.abspath(os.path.join(settings.MEDIA_ROOT, schema_name, "temp_imports"))
    real_path = os.path.abspath(file_path)
    
    if not real_path.startswith(expected_dir + os.path.sep):
        error_msg = "Security exception: Invalid directory path boundary checked."
        self.update_state(
            state="FAILURE",
            meta={
                "current": 0,
                "total": 0,
                "success_count": 0,
                "errors": [error_msg],
                "schema_name": schema_name,
            }
        )
        return {"success_count": 0, "errors": [error_msg]}

    with schema_context(schema_name):
        results = {"success_count": 0, "errors": []}
        total_rows = 0

        try:
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"CSV file not found: {os.path.basename(file_path)}")

            with open(file_path, "r", encoding="utf-8-sig") as f:
                reader = csv.reader(f)
                header = next(reader, None)
                if header:
                    total_rows = sum(1 for row in reader)
        except Exception as e:
            self.update_state(
                state="FAILURE",
                meta={
                    "current": 0,
                    "total": 0,
                    "success_count": 0,
                    "errors": [f"Failed to load CSV: {str(e)}"],
                    "schema_name": schema_name,
                }
            )
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception:
                    pass
            return {"success_count": 0, "errors": [str(e)]}

        self.update_state(
            state="PROGRESS",
            meta={
                "current": 0,
                "total": total_rows,
                "success_count": 0,
                "errors": [],
                "schema_name": schema_name,
            }
        )

        with open(file_path, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row_idx, row in enumerate(reader, start=2):
                try:
                    # Enforce fields and formats
                    grade_name = row.get("grade_name")
                    stream_name = row.get("stream_name")

                    stream = None
                    if grade_name and stream_name:
                        grade, _ = GradeLevel.objects.get_or_create(name=grade_name.strip())
                        stream, _ = Stream.objects.get_or_create(
                            grade_level=grade, name=stream_name.strip()
                        )

                    # Date processing with fallbacks
                    dob_str = row.get("date_of_birth")
                    dob = None
                    if dob_str:
                        dob = datetime.strptime(dob_str.strip(), "%Y-%m-%d").date()
                    else:
                        raise ValueError("date_of_birth is required")

                    enroll_str = row.get("enrollment_date")
                    enroll = None
                    if enroll_str:
                        enroll = datetime.strptime(enroll_str.strip(), "%Y-%m-%d").date()
                    else:
                        enroll = datetime.today().date()

                    adm = row.get("admission_number")
                    if not adm:
                        raise ValueError("admission_number is required")
                    adm = adm.strip()

                    first_name = row.get("first_name")
                    if not first_name:
                        raise ValueError("first_name is required")
                    first_name = first_name.strip()

                    last_name = row.get("last_name")
                    if not last_name:
                        raise ValueError("last_name is required")
                    last_name = last_name.strip()

                    # Create Student
                    student = Student.objects.create(
                        admission_number=adm,
                        first_name=first_name,
                        last_name=last_name,
                        gender=row.get("gender", "O")[0].upper() if row.get("gender") else "O",
                        date_of_birth=dob,
                        enrollment_date=enroll,
                        stream=stream,
                        curriculum=row.get("curriculum", "CBC").strip(),
                        status="ACTIVE",
                    )

                    # Create basic guardian if provided
                    if row.get("guardian_name") or row.get("parent_name"):
                        g_name = row.get("guardian_name") or row.get("parent_name") or "Guardian"
                        g_name = g_name.strip()
                        g_phone = row.get("guardian_phone") or row.get("parent_phone") or ""
                        g_phone = g_phone.strip()
                        g_email = row.get("guardian_email") or row.get("parent_email") or ""
                        g_email = g_email.strip()
                        g_relationship = row.get("guardian_relationship") or "LEGAL_GUARDIAN"
                        g_relationship = g_relationship.strip()

                        Guardian.objects.create(
                            student=student,
                            first_name=g_name.split(" ")[0],
                            last_name=" ".join(g_name.split(" ")[1:]) or "Unknown",
                            relationship=g_relationship,
                            phone_number=g_phone,
                            email=g_email or None,
                        )

                    results["success_count"] += 1

                except Exception as e:
                    results["errors"].append(
                        f"Row {row_idx} ({row.get('admission_number') or 'Unknown ADM'}): {str(e)}"
                    )

                # Update state
                self.update_state(
                    state="PROGRESS",
                    meta={
                        "current": row_idx - 1,
                        "total": total_rows,
                        "success_count": results["success_count"],
                        "errors": results["errors"],
                        "schema_name": schema_name,
                    }
                )

        # Create a notification for completion
        try:
            from notifications.models import Notification
            Notification.objects.create(
                user_id=user_id,
                title="Student Bulk Import Complete",
                message=f"Successfully imported {results['success_count']} students. {len(results['errors'])} errors encountered.",
                notification_type="success" if results["success_count"] > 0 else "error",
            )
        except Exception as e:
            print(f"Failed to create notification: {e}")

        # Clean up temp file
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass

        return results

