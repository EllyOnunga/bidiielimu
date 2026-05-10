from rest_framework import serializers
from .models import InventoryItem, ProcurementLog, BookIssue

class InventoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = '__all__'

class ProcurementLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcurementLog
        fields = '__all__'

class BookIssueSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    issued_by_name = serializers.CharField(source='issued_by.get_full_name', read_only=True)
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = BookIssue
        fields = [
            'id', 'item', 'item_name', 'student', 'student_name',
            'issued_by', 'issued_by_name', 'issue_date', 'due_date',
            'return_date', 'status', 'condition_on_return', 'fine_amount',
            'notes', 'is_overdue'
        ]
        read_only_fields = ['issue_date', 'issued_by', 'fine_amount']

    def get_is_overdue(self, obj):
        from django.utils import timezone
        if obj.status == 'ISSUED' and obj.due_date < timezone.now().date():
            return True
        return obj.status == 'OVERDUE'
