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
            email = row.get('email')
            password = row.get('password', 'Student123!')
            first_name = row.get('first_name')
            last_name = row.get('last_name')
            admission_number = row.get('admission_number')
            dob = row.get('date_of_birth')
            gender = row.get('gender')
            stream_id = row.get('stream_id')
            parent_name = row.get('parent_name')
            parent_phone = row.get('parent_phone')

            if not all([email, first_name, last_name, admission_number, dob]):
                errors.append(f"Row {row_idx}: Missing required fields (email, names, admission, and DOB are required).")
                continue

            with transaction.atomic():
                # Check if user already exists
                if User.objects.filter(email=email).exists():
                    errors.append(f"Row {row_idx}: User with email {email} already exists.")
                    continue

                # Create User
                user = User.objects.create_user(
                    email=email,
                    password=password,
                    role='STUDENT',
                    first_name=first_name,
                    last_name=last_name,
                    school=school
                )

                # Create Student
                Student.objects.create(
                    school=school,
                    user=user,
                    admission_number=admission_number,
                    first_name=first_name,
                    last_name=last_name,
                    date_of_birth=dob,
                    gender=gender if gender in ['M', 'F', 'O'] else 'O',
                    stream_id=stream_id if stream_id else None,
                    parent_name=parent_name,
                    parent_phone=parent_phone
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
            message=f"Successfully imported {created_count} students. {len(errors)} errors encountered.",
            notification_type="success" if created_count > 0 else "error"
        )
    except Exception as e:
        print(f"Failed to create notification: {e}")

    return {"created": created_count, "errors": errors}
