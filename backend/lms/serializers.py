from rest_framework import serializers
from .models import Assignment, Submission, Resource, LessonNote, NoteConfirmation, Quiz, Question, QuizAttempt

class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = '__all__'

class SubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    
    class Meta:
        model = Submission
        fields = '__all__'

class AssignmentSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)
    submission_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Assignment
        fields = '__all__'

class LessonNoteSerializer(serializers.ModelSerializer):
    is_read = serializers.BooleanField(read_only=True)

    class Meta:
        model = LessonNote
        fields = '__all__'

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'text', 'question_type', 'points', 'options'] # Hide correct_answer

class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Quiz
        fields = ['id', 'subject', 'title', 'description', 'duration_minutes', 'is_active', 'questions']

class QuizAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAttempt
        fields = '__all__'
