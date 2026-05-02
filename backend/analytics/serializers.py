from rest_framework import serializers
from .models import PredictiveRisk

class PredictiveRiskSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    grade = serializers.CharField(source='student.stream.grade_level.name', read_only=True)

    class Meta:
        model = PredictiveRisk
        fields = '__all__'
