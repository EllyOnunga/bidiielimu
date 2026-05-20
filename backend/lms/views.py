from django.db import models
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from config.tenant_security import StrictTenantPermission, TenantAwareViewSetMixin
from teachers.models import Teacher

from .models import (
    Assignment,
    LessonNote,
    NoteConfirmation,
    Quiz,
    QuizAttempt,
    Resource,
    Submission,
)
from .serializers import (
    AssignmentSerializer,
    LessonNoteSerializer,
    QuizSerializer,
    ResourceSerializer,
    SubmissionSerializer,
)


class AssignmentViewSet(TenantAwareViewSetMixin, viewsets.ModelViewSet):
    serializer_class = AssignmentSerializer
    permission_classes = [permissions.IsAuthenticated, StrictTenantPermission]

    def get_queryset(self):
        user = self.request.user
        qs = Assignment.objects.all().select_related("subject", "teacher", "stream")

        if user.role_name == "STUDENT":
            student = getattr(user, "student_profile", None)
            if student and student.stream:
                # Only see assignments for their specific class/stream
                qs = qs.filter(stream=student.stream)
            else:
                qs = qs.none()
        elif user.role_name in ["TEACHER", "PRINCIPAL", "HOD"]:
            teacher = getattr(user, "teacher_profile", None)
            if teacher:
                # Teachers only see what they assigned or are assigned to teach
                from classes.models import SubjectAssignment

                assigned_subjects = SubjectAssignment.objects.filter(
                    teacher=teacher
                ).values_list("subject_id", flat=True)
                qs = qs.filter(
                    models.Q(teacher=teacher)
                    | models.Q(subject_id__in=assigned_subjects)
                )
            else:
                qs = qs.none()

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        teacher = None

        if user.role_name in ["TEACHER", "PRINCIPAL", "HOD"]:
            teacher = getattr(user, "teacher_profile", None)
            if not teacher:
                raise ValidationError(
                    {
                        "teacher": "Your user account is not linked to a Teacher/Staff profile. Please contact the administrator."
                    }
                )
        elif user.role_name in ["ADMIN", "SUPER_ADMIN"]:
            teacher_id = self.request.data.get("teacher")
            if teacher_id:
                teacher = Teacher.objects.filter(id=teacher_id).first()
            if not teacher:
                # Fallback: Check if the admin themselves has a teacher profile
                teacher = getattr(user, "teacher_profile", None)

            if not teacher:
                raise ValidationError(
                    {"teacher": "You must select a valid teacher for this assignment."}
                )

        if not serializer.validated_data.get("stream"):
            # If no stream is provided, it's globally for all students in the subject?
            # But the model allows NULL stream.
            pass

        serializer.save(teacher=teacher)

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        assignment = self.get_object()
        if request.user.role_name != "STUDENT":
            return Response(
                {"detail": "Only students can submit assignments."},
                status=status.HTTP_403_FORBIDDEN,
            )

        student = getattr(request.user, "student_profile", None)
        if not student:
            return Response(
                {"detail": "Student profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if assignment.stream and student.stream != assignment.stream:
            return Response(
                {"detail": "You cannot submit to an assignment for a different class."},
                status=status.HTTP_403_FORBIDDEN,
            )

        existing_sub = Submission.objects.filter(
            assignment=assignment, student=student
        ).first()
        if existing_sub and existing_sub.grade is not None:
            return Response(
                {
                    "detail": "This assignment has already been graded and cannot be resubmitted or modified."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        submission, created = Submission.objects.update_or_create(
            assignment=assignment,
            student=student,
            defaults={
                "file": request.FILES.get("file"),
                "text_content": request.data.get("text_content"),
                "submitted_at": timezone.now(),
            },
        )
        return Response(SubmissionSerializer(submission).data)

    @action(detail=True, methods=["get"])
    def submissions(self, request, pk=None):
        """List all submissions for this assignment (teachers only)"""
        assignment = self.get_object()
        if request.user.role_name not in ["TEACHER", "PRINCIPAL", "HOD", "ADMIN"]:
            return Response({"detail": "Not allowed"}, status=403)
        subs = assignment.submissions.select_related("student").all()
        return Response(SubmissionSerializer(subs, many=True).data)

    @action(detail=False, methods=["post"])
    def grade(self, request):
        """Grade a submission"""
        submission_id = request.data.get("submission_id")
        grade = request.data.get("grade")
        feedback = request.data.get("feedback", "")

        try:
            sub = Submission.objects.get(id=submission_id)
        except Submission.DoesNotExist:
            return Response({"detail": "Submission not found"}, status=404)

        if request.user.role_name not in ["TEACHER", "PRINCIPAL", "HOD"]:
            return Response({"detail": "Only teachers can grade"}, status=403)

        sub.grade = grade
        sub.feedback = feedback
        sub.graded_at = timezone.now()
        sub.save()
        return Response(SubmissionSerializer(sub).data)


class LessonNoteViewSet(TenantAwareViewSetMixin, viewsets.ModelViewSet):
    serializer_class = LessonNoteSerializer
    permission_classes = [permissions.IsAuthenticated, StrictTenantPermission]

    def get_queryset(self):
        user = self.request.user
        qs = LessonNote.objects.all().select_related("subject")

        if user.role_name == "STUDENT":
            student = getattr(user, "student_profile", None)
            if student and student.stream:
                from classes.models import SubjectAssignment

                assigned_subjects = SubjectAssignment.objects.filter(
                    stream=student.stream
                ).values_list("subject_id", flat=True)
                qs = qs.filter(subject_id__in=assigned_subjects)
            else:
                qs = qs.none()
        elif user.role_name in ["TEACHER", "PRINCIPAL", "HOD"]:
            teacher = getattr(user, "teacher_profile", None)
            if teacher:
                from classes.models import SubjectAssignment

                assigned_subjects = SubjectAssignment.objects.filter(
                    teacher=teacher
                ).values_list("subject_id", flat=True)
                qs = qs.filter(subject_id__in=assigned_subjects)
            else:
                qs = qs.none()

        return qs

    @action(detail=True, methods=["post"])
    def mark_as_read(self, request, pk=None):
        note = self.get_object()
        if request.user.role_name != "STUDENT":
            return Response(
                {"detail": "Only students can confirm reading."},
                status=status.HTTP_403_FORBIDDEN,
            )

        NoteConfirmation.objects.get_or_create(
            note=note, student=request.user.student_profile
        )
        return Response({"status": "confirmed"})


class QuizViewSet(TenantAwareViewSetMixin, viewsets.ModelViewSet):
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated, StrictTenantPermission]

    def get_queryset(self):
        user = self.request.user
        qs = Quiz.objects.filter(is_active=True).select_related("subject")

        if user.role_name == "STUDENT":
            student = getattr(user, "student_profile", None)
            if student and student.stream:
                from classes.models import SubjectAssignment

                assigned_subjects = SubjectAssignment.objects.filter(
                    stream=student.stream
                ).values_list("subject_id", flat=True)
                qs = qs.filter(subject_id__in=assigned_subjects)
            else:
                qs = qs.none()
        elif user.role_name in ["TEACHER", "PRINCIPAL", "HOD"]:
            teacher = getattr(user, "teacher_profile", None)
            if teacher:
                from classes.models import SubjectAssignment

                assigned_subjects = SubjectAssignment.objects.filter(
                    teacher=teacher
                ).values_list("subject_id", flat=True)
                qs = qs.filter(subject_id__in=assigned_subjects)
            else:
                qs = qs.none()

        return qs

    @action(detail=True, methods=["post"])
    def attempt(self, request, pk=None):
        quiz = self.get_object()
        student = request.user.student_profile
        answers = request.data.get("answers", {})  # {question_id: answer}

        total_score = 0
        questions = quiz.questions.all()
        max_possible = sum(q.points for q in questions)

        for q in questions:
            student_answer = answers.get(str(q.id))
            if student_answer is not None and str(student_answer) == str(
                q.correct_answer
            ):
                total_score += q.points

        attempt = QuizAttempt.objects.create(
            quiz=quiz, student=student, score=total_score
        )

        return Response(
            {"attempt_id": attempt.id, "score": total_score, "max_score": max_possible}
        )

    @action(detail=True, methods=["get"])
    def my_attempts(self, request, pk=None):
        """Allow students to see their past quiz attempts and scores"""
        quiz = self.get_object()
        student = getattr(request.user, "student_profile", None)
        if not student:
            return Response({"detail": "Student profile required"}, status=400)

        attempts = quiz.attempts.filter(student=student).order_by("-completed_at")
        data = [
            {
                "id": a.id,
                "score": a.score,
                "max_score": sum(q.points for q in quiz.questions.all()),
                "completed_at": a.completed_at,
            }
            for a in attempts
        ]
        return Response(data)


class ResourceViewSet(TenantAwareViewSetMixin, viewsets.ModelViewSet):
    serializer_class = ResourceSerializer
    permission_classes = [permissions.IsAuthenticated, StrictTenantPermission]

    def get_queryset(self):
        user = self.request.user
        qs = Resource.objects.all().select_related("subject", "uploaded_by")

        if user.role_name == "STUDENT":
            student = getattr(user, "student_profile", None)
            if student and student.stream:
                from classes.models import SubjectAssignment

                assigned_subjects = SubjectAssignment.objects.filter(
                    stream=student.stream
                ).values_list("subject_id", flat=True)
                qs = qs.filter(subject_id__in=assigned_subjects)
            else:
                qs = qs.none()
        elif user.role_name in ["TEACHER", "PRINCIPAL", "HOD"]:
            teacher = getattr(user, "teacher_profile", None)
            if teacher:
                from classes.models import SubjectAssignment

                assigned_subjects = SubjectAssignment.objects.filter(
                    teacher=teacher
                ).values_list("subject_id", flat=True)
                qs = qs.filter(
                    models.Q(uploaded_by=teacher)
                    | models.Q(subject_id__in=assigned_subjects)
                )
            else:
                qs = qs.none()

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        teacher = getattr(user, "teacher_profile", None)
        # Even if teacher is None, we save (admin might not have teacher profile)
        serializer.save(uploaded_by=teacher)

    @action(detail=True, methods=["post"])
    def track_watch(self, request, pk=None):
        """Track video watch time for analytics"""
        resource = self.get_object()
        student = getattr(request.user, "student_profile", None)
        if not student or resource.category != "VIDEO":
            return Response({"detail": "Invalid"}, status=400)

        from .models import VideoWatchTime

        watched = int(request.data.get("watched_seconds", 0))
        position = int(request.data.get("last_position", 0))

        watch, _ = VideoWatchTime.objects.update_or_create(
            resource=resource,
            student=student,
            defaults={
                "watched_seconds": watched,
                "last_position": position,
                "completed": watched >= 300,  # example threshold
            },
        )
        return Response({"status": "tracked", "watched": watch.watched_seconds})


class SubmissionViewSet(TenantAwareViewSetMixin, viewsets.ModelViewSet):
    serializer_class = SubmissionSerializer
    permission_classes = [permissions.IsAuthenticated, StrictTenantPermission]

    def get_queryset(self):
        user = self.request.user
        qs = Submission.objects.all().select_related("student", "assignment")

        if user.role_name in ["TEACHER", "PRINCIPAL", "HOD"]:
            teacher = getattr(user, "teacher_profile", None)
            if teacher:
                qs = qs.filter(assignment__teacher=teacher)
            else:
                qs = qs.none()
        elif user.role_name == "STUDENT":
            student = getattr(user, "student_profile", None)
            if student:
                qs = qs.filter(student=student, assignment__stream=student.stream)
            else:
                qs = qs.none()

        assignment_id = self.request.query_params.get("assignment")
        if assignment_id:
            qs = qs.filter(assignment_id=assignment_id)

        return qs

    @action(detail=True, methods=["post"])
    def grade(self, request, pk=None):
        submission = self.get_object()
        user = request.user

        # Security check: only the teacher who owns the assignment (or school
        # admin) can grade
        is_owner = False
        if user.role_name in ["TEACHER", "PRINCIPAL", "HOD"]:
            teacher = getattr(user, "teacher_profile", None)
            if teacher and submission.assignment.teacher == teacher:
                is_owner = True
        elif user.role_name in ["ADMIN", "SUPER_ADMIN"]:
            is_owner = True

        if not is_owner:
            return Response(
                {"detail": "You do not have permission to grade this submission."},
                status=status.HTTP_403_FORBIDDEN,
            )

        grade = request.data.get("score")  # Frontend sends 'score'
        feedback = request.data.get("feedback", "")

        if grade is None:
            return Response(
                {"detail": "Score is required."}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            grade_val = float(grade)
            if grade_val < 0 or grade_val > submission.assignment.max_score:
                return Response(
                    {"detail": f"Score must be between 0 and {
                            submission.assignment.max_score}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            submission.grade = grade_val
            submission.feedback = feedback
            submission.graded_at = timezone.now()
            submission.save()

            return Response(SubmissionSerializer(submission).data)
        except ValueError:
            return Response(
                {"detail": "Invalid score value."}, status=status.HTTP_400_BAD_REQUEST
            )
