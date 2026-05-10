from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.authentication import SessionAuthentication
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.utils import timezone
from teachers.models import Teacher
from .models import Assignment, Submission, Resource, LessonNote, NoteConfirmation, Quiz, Question, QuizAttempt
from .serializers import (
    AssignmentSerializer, SubmissionSerializer, ResourceSerializer,
    LessonNoteSerializer, QuizSerializer, QuizAttemptSerializer
)

class AssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Assignment.objects.all().select_related('subject', 'teacher', 'stream')
        
        if user.role_name == 'STUDENT':
            student = getattr(user, 'student_profile', None)
            if student and student.stream:
                qs = qs.filter(stream=student.stream)
            else:
                qs = qs.none()
        elif user.role_name in ['TEACHER', 'PRINCIPAL', 'HOD']:
            teacher = getattr(user, 'teacher_profile', None)
            if teacher:
                qs = qs.filter(teacher=teacher)
            else:
                # If they have no profile, show nothing or admin view?
                # For staff roles, usually they should only see theirs.
                qs = qs.none()
        
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        teacher = None
        
        if user.role_name in ['TEACHER', 'PRINCIPAL', 'HOD']:
            teacher = getattr(user, 'teacher_profile', None)
            if not teacher:
                raise ValidationError({"teacher": "Your user account is not linked to a Teacher/Staff profile. Please contact the administrator."})
        elif user.role_name in ['ADMIN', 'SUPER_ADMIN']:
            teacher_id = self.request.data.get('teacher')
            if teacher_id:
                teacher = Teacher.objects.filter(id=teacher_id).first()
            if not teacher:
                # Fallback: Check if the admin themselves has a teacher profile
                teacher = getattr(user, 'teacher_profile', None)
                
            if not teacher:
                raise ValidationError({"teacher": "You must select a valid teacher for this assignment."})
        
        if not serializer.validated_data.get('stream'):
             # If no stream is provided, it's globally for all students in the subject?
             # But the model allows NULL stream.
             pass
            
        serializer.save(teacher=teacher)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        assignment = self.get_object()
        if request.user.role_name != 'STUDENT':
            return Response({"detail": "Only students can submit assignments."}, status=status.HTTP_403_FORBIDDEN)
        
        student = getattr(request.user, 'student_profile', None)
        if not student:
            return Response({"detail": "Student profile not found."}, status=status.HTTP_404_NOT_FOUND)
            
        if assignment.stream and student.stream != assignment.stream:
            return Response({"detail": "You cannot submit to an assignment for a different class."}, 
                            status=status.HTTP_403_FORBIDDEN)
            
        submission, created = Submission.objects.update_or_create(
            assignment=assignment,
            student=student,
            defaults={
                'file': request.FILES.get('file'),
                'text_content': request.data.get('text_content'),
                'submitted_at': timezone.now()
            }
        )
        return Response(SubmissionSerializer(submission).data)

class LessonNoteViewSet(viewsets.ModelViewSet):
    serializer_class = LessonNoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = LessonNote.objects.all()
        # Add is_read annotation (pseudo-code/simplified)
        return qs

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        note = self.get_object()
        if request.user.role_name != 'STUDENT':
            return Response({"detail": "Only students can confirm reading."}, status=status.HTTP_403_FORBIDDEN)
        
        NoteConfirmation.objects.get_or_create(
            note=note,
            student=request.user.student_profile
        )
        return Response({"status": "confirmed"})

class QuizViewSet(viewsets.ModelViewSet):
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Quiz.objects.filter(is_active=True)

    @action(detail=True, methods=['post'])
    def attempt(self, request, pk=None):
        quiz = self.get_object()
        student = request.user.student_profile
        answers = request.data.get('answers', {}) # {question_id: answer}
        
        total_score = 0
        questions = quiz.questions.all()
        max_possible = sum(q.points for q in questions)
        
        for q in questions:
            student_answer = answers.get(str(q.id))
            if student_answer is not None and str(student_answer) == str(q.correct_answer):
                total_score += q.points

        attempt = QuizAttempt.objects.create(
            quiz=quiz,
            student=student,
            score=total_score
        )
        
        return Response({
            "attempt_id": attempt.id,
            "score": total_score,
            "max_score": max_possible
        })

class ResourceViewSet(viewsets.ModelViewSet):
    serializer_class = ResourceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Resource.objects.all().select_related('subject', 'uploaded_by')

    def perform_create(self, serializer):
        user = self.request.user
        teacher = getattr(user, 'teacher_profile', None)
        # Even if teacher is None, we save (admin might not have teacher profile)
        serializer.save(uploaded_by=teacher)


class SubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = SubmissionSerializer
    authentication_classes = [JWTAuthentication, SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Submission.objects.all().select_related('student', 'assignment')
        
        if user.role_name in ['TEACHER', 'PRINCIPAL', 'HOD']:
            teacher = getattr(user, 'teacher_profile', None)
            if teacher:
                qs = qs.filter(assignment__teacher=teacher)
            else:
                qs = qs.none()
        elif user.role_name == 'STUDENT':
            student = getattr(user, 'student_profile', None)
            if student:
                qs = qs.filter(student=student, assignment__stream=student.stream)
            else:
                qs = qs.none()
        
        assignment_id = self.request.query_params.get('assignment')
        if assignment_id:
            qs = qs.filter(assignment_id=assignment_id)
            
        return qs

    @action(detail=True, methods=['post'])
    def grade(self, request, pk=None):
        submission = self.get_object()
        user = request.user
        
        # Security check: only the teacher who owns the assignment (or school admin) can grade
        is_owner = False
        if user.role_name in ['TEACHER', 'PRINCIPAL', 'HOD']:
            teacher = getattr(user, 'teacher_profile', None)
            if teacher and submission.assignment.teacher == teacher:
                is_owner = True
        elif user.role_name in ['ADMIN', 'SUPER_ADMIN']:
            is_owner = True
            
        if not is_owner:
            return Response({"detail": "You do not have permission to grade this submission."}, 
                            status=status.HTTP_403_FORBIDDEN)
        
        grade = request.data.get('score') # Frontend sends 'score'
        feedback = request.data.get('feedback', '')
        
        if grade is None:
            return Response({"detail": "Score is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            grade_val = float(grade)
            if grade_val < 0 or grade_val > submission.assignment.max_score:
                return Response({"detail": f"Score must be between 0 and {submission.assignment.max_score}"}, 
                                status=status.HTTP_400_BAD_REQUEST)
                                
            submission.grade = grade_val
            submission.feedback = feedback
            submission.graded_at = timezone.now()
            submission.save()
            
            return Response(SubmissionSerializer(submission).data)
        except ValueError:
            return Response({"detail": "Invalid score value."}, status=status.HTTP_400_BAD_REQUEST)

