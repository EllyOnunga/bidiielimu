from rest_framework import serializers
from .models import StudentReport

class StudentReportSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    exam_name = serializers.CharField(source='exam.name', read_only=True)

    class Meta:
        model = StudentReport
        fields = '__all__'
