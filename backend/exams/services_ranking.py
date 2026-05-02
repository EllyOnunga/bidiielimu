from django.db.models import Sum, Avg
from .models import Exam, Mark, ExamRanking, GradeThreshold
from students.models import Student
from classes.models import Stream

class RankingService:
    @staticmethod
    def compute_exam_ranks(exam_id):
        exam = Exam.objects.get(id=exam_id)
        marks = Mark.objects.filter(exam=exam)
        
        # 1. Get all unique students who sat for this exam
        student_ids = marks.values_list('student_id', flat=True).distinct()
        students = Student.objects.filter(id__in=student_ids)

        results = []
        for student in students:
            student_marks = marks.filter(student=student)
            total = student_marks.aggregate(total=Sum('score'))['total'] or 0
            mean = student_marks.aggregate(mean=Avg('score'))['mean'] or 0
            
            # Find mean grade
            mean_grade = RankingService.get_grade(exam, mean)
            
            results.append({
                'student': student,
                'total': total,
                'mean': mean,
                'mean_grade': mean_grade,
                'stream_id': student.stream_id
            })

        # 2. Sort by total marks descending
        results.sort(key=lambda x: x['total'], reverse=True)

        # 3. Assign overall (class) ranks with tie handling
        current_rank = 1
        for i, res in enumerate(results):
            if i > 0 and res['total'] < results[i-1]['total']:
                current_rank = i + 1
            res['class_position'] = current_rank

        # 4. Assign stream ranks
        streams = Stream.objects.filter(id__in=[r['stream_id'] for r in results if r['stream_id']])
        for stream in streams:
            stream_results = [r for r in results if r['stream_id'] == stream.id]
            current_stream_rank = 1
            for i, res in enumerate(stream_results):
                if i > 0 and res['total'] < stream_results[i-1]['total']:
                    current_stream_rank = i + 1
                res['stream_position'] = current_stream_rank
                res['total_in_stream'] = len(stream_results)

        # 5. Save/Update ExamRanking records
        total_students = len(results)
        for res in results:
            ExamRanking.objects.update_or_create(
                student=res['student'],
                exam=exam,
                defaults={
                    'total_marks': res['total'],
                    'mean_score': res['mean'],
                    'mean_grade': res['mean_grade'],
                    'class_position': res['class_position'],
                    'stream_position': res.get('stream_position'),
                    'total_students_in_stream': res.get('total_in_stream'),
                    'total_students_in_class': total_students
                }
            )

        return len(results)

    @staticmethod
    def get_grade(exam, score):
        if not exam.grading_system:
            return None
        threshold = GradeThreshold.objects.filter(
            grading_system=exam.grading_system,
            min_score__lte=score,
            max_score__gte=score
        ).first()
        return threshold.grade if threshold else None
