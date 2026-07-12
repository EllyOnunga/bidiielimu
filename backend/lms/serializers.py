import logging
from django.core.exceptions import ObjectDoesNotExist
from rest_framework import serializers

from classes.models import Stream
from teachers.models import Teacher

logger = logging.getLogger(__name__)

from .models import (
    Assignment,
    Discussion,
    LessonNote,
    Question,
    Quiz,
    QuizAttempt,
    Resource,
    StudentProgress,
    Submission,
    VideoWatchTime,
)


class ResourceSerializer(serializers.ModelSerializer):
    stream = serializers.PrimaryKeyRelatedField(
        queryset=Stream.objects.all(), allow_null=True, required=False
    )
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    stream_name = serializers.SerializerMethodField()

    class Meta:
        model = Resource
        fields = "__all__"
        read_only_fields = ["uploaded_by"]

    def get_stream_name(self, obj):
        try:
            return obj.stream.name if obj.stream else "All Classes"
        except BaseException:
            return "All Classes"


class SubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    assignment_title = serializers.CharField(source="assignment.title", read_only=True)
    max_score = serializers.IntegerField(source="assignment.max_score", read_only=True)
    is_graded = serializers.SerializerMethodField()

    class Meta:
        model = Submission
        fields = [
            "id",
            "assignment",
            "assignment_title",
            "student",
            "student_name",
            "text_content",
            "file",
            "submitted_at",
            "grade",
            "feedback",
            "is_graded",
            "max_score",
        ]

    def get_student_name(self, obj):
        try:
            return f"{obj.student.first_name} {obj.student.last_name}"
        except BaseException:
            return "Unknown Student"

    def get_is_graded(self, obj):
        return obj.grade is not None


class AssignmentSerializer(serializers.ModelSerializer):
    subject_name = serializers.SerializerMethodField()
    stream_name = serializers.SerializerMethodField()
    teacher_name = serializers.SerializerMethodField()
    submission_count = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    student_grade = serializers.SerializerMethodField()
    student_feedback = serializers.SerializerMethodField()
    student_text_content = serializers.SerializerMethodField()
    student_file_url = serializers.SerializerMethodField()
    teacher = serializers.PrimaryKeyRelatedField(
        queryset=Teacher.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = Assignment
        fields = [
            "id",
            "title",
            "description",
            "subject",
            "subject_name",
            "stream",
            "stream_name",
            "teacher",
            "teacher_name",
            "due_date",
            "max_score",
            "file",
            "submission_count",
            "status",
            "student_grade",
            "student_feedback",
            "student_text_content",
            "student_file_url",
            "created_at",
        ]
        read_only_fields = ["created_at"]

    def get_student_text_content(self, obj):
        try:
            request = self.context.get("request")
            if (
                request
                and request.user.is_authenticated
                and request.user.role_name == "STUDENT"
            ):
                student = getattr(request.user, "student_profile", None)
                if student:
                    submission = obj.submissions.filter(student=student).first()
                    return submission.text_content if submission else ""
        except BaseException:
            return ""
        return ""

    def get_student_file_url(self, obj):
        try:
            request = self.context.get("request")
            if (
                request
                and request.user.is_authenticated
                and request.user.role_name == "STUDENT"
            ):
                student = getattr(request.user, "student_profile", None)
                if student:
                    submission = obj.submissions.filter(student=student).first()
                    return submission.file.url if submission and submission.file else ""
        except BaseException:
            return ""
        return ""

    def get_student_grade(self, obj):
        try:
            request = self.context.get("request")
            if (
                request
                and request.user.is_authenticated
                and request.user.role_name == "STUDENT"
            ):
                student = getattr(request.user, "student_profile", None)
                if student:
                    submission = obj.submissions.filter(student=student).first()
                    return submission.grade if submission else None
        except BaseException:
            return None
        return None

    def get_student_feedback(self, obj):
        try:
            request = self.context.get("request")
            if (
                request
                and request.user.is_authenticated
                and request.user.role_name == "STUDENT"
            ):
                student = getattr(request.user, "student_profile", None)
                if student:
                    submission = obj.submissions.filter(student=student).first()
                    return submission.feedback if submission else None
        except BaseException:
            return None
        return None

    def get_subject_name(self, obj):
        try:
            return obj.subject.name if obj.subject else ""
        except (AttributeError, ObjectDoesNotExist):
            return ""

    def get_stream_name(self, obj):
        try:
            return obj.stream.name if obj.stream else "All Classes"
        except BaseException:
            return "All Classes"

    def get_teacher_name(self, obj):
        try:
            return obj.teacher.full_name if obj.teacher else ""
        except BaseException:
            return "Unknown Teacher"

    def get_submission_count(self, obj):
        try:
            return obj.submissions.count()
        except BaseException:
            return 0

    def get_status(self, obj):
        try:
            request = self.context.get("request")
            if not request or not request.user or not request.user.is_authenticated:
                return "pending"

            if request.user.role_name == "STUDENT":
                student = getattr(request.user, "student_profile", None)
                if student:
                    # Use .exists() or .first() safely
                    submission = obj.submissions.filter(student=student).first()
                    if submission:
                        if submission.grade is not None:
                            return "graded"
                        return "submitted"
        except Exception as e:
            logger.exception("AssignmentSerializer get_status error")
            # Fallback to pending if anything goes wrong during status check
            return "pending"
        return "pending"


# New serializers for scalable LMS features
class StudentProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProgress
        fields = "__all__"


class VideoWatchTimeSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoWatchTime
        fields = "__all__"


class DiscussionSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_role = serializers.CharField(source="author.role_name", read_only=True)

    class Meta:
        model = Discussion
        fields = [
            "id",
            "resource",
            "assignment",
            "author",
            "author_name",
            "author_role",
            "content",
            "created_at",
        ]
        read_only_fields = ["author", "created_at"]

    def get_author_name(self, obj):
        name = f"{obj.author.first_name} {obj.author.last_name}".strip()
        return name if name else obj.author.email


class LessonNoteSerializer(serializers.ModelSerializer):
    is_read = serializers.BooleanField(read_only=True)

    class Meta:
        model = LessonNote
        fields = "__all__"


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ["id", "text", "question_type", "points", "options", "correct_answer"]

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Security: Hide correct answer for students
        request = self.context.get("request")
        if request and request.user.role_name == "STUDENT":
            ret.pop("correct_answer", None)
        return ret


class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, required=False)
    question_count = serializers.SerializerMethodField()
    stream_name = serializers.SerializerMethodField()
    teacher_name = serializers.SerializerMethodField()
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    teacher = serializers.PrimaryKeyRelatedField(
        queryset=Teacher.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = Quiz
        fields = [
            "id",
            "stream",
            "stream_name",
            "subject",
            "subject_name",
            "teacher",
            "teacher_name",
            "title",
            "description",
            "duration_minutes",
            "is_active",
            "questions",
            "question_count",
        ]
        read_only_fields = ["teacher"]

    def get_question_count(self, obj):
        return obj.questions.count()

    def get_teacher_name(self, obj):
        try:
            return obj.teacher.full_name if obj.teacher else ""
        except BaseException:
            return "Unknown Teacher"

    def get_stream_name(self, obj):
        try:
            return obj.stream.name if obj.stream else "All Classes"
        except BaseException:
            return "All Classes"

    def create(self, validated_data):
        questions_data = validated_data.pop("questions", [])
        quiz = Quiz.objects.create(**validated_data)
        for question_data in questions_data:
            Question.objects.create(quiz=quiz, **question_data)
        return quiz

    def update(self, instance, validated_data):
        questions_data = validated_data.pop("questions", None)

        # Update quiz fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # If questions are provided, replace existing ones (simple sync for builder)
        if questions_data is not None:
            instance.questions.all().delete()
            for question_data in questions_data:
                Question.objects.create(quiz=instance, **question_data)

        return instance


class QuizAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAttempt
        fields = "__all__"
