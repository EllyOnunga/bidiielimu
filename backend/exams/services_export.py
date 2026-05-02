import csv
import io
from .models import Exam, Mark, ExamRanking
from classes.models import Subject

class MarkSheetExportService:
    @staticmethod
    def generate_mark_sheet_csv(exam_id):
        exam = Exam.objects.get(id=exam_id)
        subjects = Subject.objects.all() # Or filter by what was actually sat
        
        output = io.StringIO()
        writer = csv.writer(output)

        # Header Row
        header = ['Admission No', 'Student Name', 'Stream']
        for sub in subjects:
            header.append(sub.name)
        header.extend(['Total Marks', 'Mean Score', 'Mean Grade', 'Stream Rank', 'Class Rank'])
        writer.writerow(header)

        # Data Rows
        rankings = ExamRanking.objects.filter(exam=exam).select_related('student', 'student__stream')
        for rank in rankings:
            student = rank.student
            row = [
                student.admission_number,
                f"{student.first_name} {student.last_name}",
                student.stream.name if student.stream else 'N/A'
            ]
            
            # Subject marks
            for sub in subjects:
                mark = Mark.objects.filter(exam=exam, student=student, subject=sub).first()
                if mark:
                    row.append("ABS" if mark.is_absent else mark.score)
                else:
                    row.append('-')

            # Summary fields
            row.extend([
                rank.total_marks,
                rank.mean_score,
                rank.mean_grade or '-',
                rank.stream_position or '-',
                rank.class_position or '-'
            ])
            writer.writerow(row)

        return output.getvalue()
