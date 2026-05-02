from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
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
        qs = Assignment.objects.all().select_related('subject', 'teacher')
        if user.role == 'STUDENT':
            # Students only see assignments for their subjects
            qs = qs.filter(subject__assignments__stream__students__user=user).distinct()
        return qs

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        assignment = self.get_object()
        if request.user.role != 'STUDENT':
            return Response({"detail": "Only students can submit assignments."}, status=status.HTTP_403_FORBIDDEN)
        
        student = request.user.student_profile
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
        if request.user.role != 'STUDENT':
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
        
        for q in questions:
            student_answer = answers.get(str(q.id))
            if str(student_answer) == str(q.correct_answer):
                total_score += q.points

        attempt = QuizAttempt.objects.create(
            quiz=quiz,
            student=student,
            score=total_score
        )
        
        return Response({
            "attempt_id": attempt.id,
            "score": total_score,
            "max_score": sum(q.points for q in questions)
        })

class ResourceViewSet(viewsets.ModelViewSet):
    serializer_class = ResourceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Resource.objects.all()
