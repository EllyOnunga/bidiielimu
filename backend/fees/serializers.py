from rest_framework import serializers
from schools.utils import TenantSerializerMixin
from .models import FeeStructure, FeePayment

class FeeStructureSerializer(TenantSerializerMixin, serializers.ModelSerializer):
    grade_level_name = serializers.CharField(source='grade_level.name', read_only=True)

    class Meta:
        model = FeeStructure
        fields = ['id', 'grade_level', 'grade_level_name', 'term', 'academic_year', 'amount', 'description']

class FeePaymentSerializer(TenantSerializerMixin, serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_admission = serializers.CharField(source='student.admission_number', read_only=True)
    transaction_reference = serializers.CharField(source='transaction_id', read_only=True)
    received_by_name = serializers.CharField(source='received_by.get_full_name', read_only=True)

    class Meta:
        model = FeePayment
        fields = ['id', 'student', 'student_name', 'student_admission', 'amount', 'payment_date',
                  'payment_method', 'transaction_id', 'transaction_reference', 'received_by', 'received_by_name', 'notes']
        read_only_fields = ['payment_date', 'received_by']

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"
