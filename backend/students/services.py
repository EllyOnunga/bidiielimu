import csv
import io
from datetime import datetime
from django.core.exceptions import ValidationError
from .models import Student, Guardian
from classes.models import Stream, GradeLevel

class StudentImportService:
    @staticmethod
    def import_students_csv(file_obj):
        """
        Processes a CSV file and creates students.
        Expected headers: admission_number, first_name, last_name, gender, date_of_birth, 
                          enrollment_date, stream_name, grade_name, curriculum, 
                          parent_name, parent_phone
        """
        decoded_file = file_obj.read().decode('utf-8')
        io_string = io.StringIO(decoded_file)
        reader = csv.DictReader(io_string)
        
        results = {
            'success_count': 0,
            'errors': []
        }

        for row_idx, row in enumerate(reader, start=2):
            try:
                # Find or create stream
                grade_name = row.get('grade_name')
                stream_name = row.get('stream_name')
                
                stream = None
                if grade_name and stream_name:
                    grade, _ = GradeLevel.objects.get_or_create(name=grade_name)
                    stream, _ = Stream.objects.get_or_create(grade_level=grade, name=stream_name)

                student = Student.objects.create(
                    admission_number=row['admission_number'],
                    first_name=row['first_name'],
                    last_name=row['last_name'],
                    gender=row['gender'][0].upper(), # M/F
                    date_of_birth=datetime.strptime(row['date_of_birth'], '%Y-%m-%d').date(),
                    enrollment_date=datetime.strptime(row['enrollment_date'], '%Y-%m-%d').date(),
                    stream=stream,
                    curriculum=row.get('curriculum', 'CBC'),
                    status='ACTIVE'
                )

                # Create basic guardian if provided
                if row.get('parent_name') and row.get('parent_phone'):
                    Guardian.objects.create(
                        student=student,
                        first_name=row['parent_name'].split(' ')[0],
                        last_name=' '.join(row['parent_name'].split(' ')[1:]) or 'Unknown',
                        relationship='LEGAL_GUARDIAN',
                        phone_number=row['parent_phone']
                    )

                results['success_count'] += 1

            except Exception as e:
                results['errors'].append(f"Row {row_idx} ({row.get('admission_number')}): {str(e)}")

        return results

    @staticmethod
    def get_csv_template():
        """
        Returns a sample CSV header string.
        """
        headers = [
            'admission_number', 'first_name', 'last_name', 'gender', 'date_of_birth',
            'enrollment_date', 'stream_name', 'grade_name', 'curriculum',
            'parent_name', 'parent_phone'
        ]
        return ','.join(headers) + '\n' + 'ADM001,John,Doe,M,2015-05-20,2024-01-10,West,Grade 4,CBC,Jane Doe,+254700000000'
