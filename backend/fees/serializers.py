from rest_framework import serializers
from schools.utils import TenantSerializerMixin
from .models import FeeStructure, FeePayment, Invoice, FinancialAid

class FeeStructureSerializer(serializers.ModelSerializer):
    grade_level_name = serializers.CharField(source='grade_level.name', read_only=True)

    class Meta:
        model = FeeStructure
        fields = [
            'id', 'grade_level', 'grade_level_name', 'term', 
            'academic_year', 'amount', 'currency', 'description'
        ]

class InvoiceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    fee_structure_details = serializers.CharField(source='fee_structure.__str__', read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'student', 'student_name', 'fee_structure', 
            'fee_structure_details', 'total_amount', 'paid_amount', 
            'balance', 'due_date', 'status', 'created_at'
        ]
        read_only_fields = ['paid_amount', 'balance', 'created_at']

class FeePaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_admission = serializers.CharField(source='student.admission_number', read_only=True)
    received_by_name = serializers.CharField(source='received_by.get_full_name', read_only=True)

    class Meta:
        model = FeePayment
        fields = [
            'id', 'invoice', 'student', 'student_name', 'student_admission', 
            'amount', 'currency', 'payment_date', 'payment_method', 
            'transaction_id', 'is_confirmed', 'received_by', 'received_by_name', 'notes'
        ]
        read_only_fields = ['payment_date', 'received_by']

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"

class FinancialAidSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)

    class Meta:
        model = FinancialAid
        fields = [
            'id', 'student', 'student_name', 'invoice', 
            'amount', 'aid_type', 'source', 'granted_at'
        ]

