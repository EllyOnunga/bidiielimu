from rest_framework import serializers
from .models import InventoryItem, ProcurementLog

class InventoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = '__all__'

class ProcurementLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcurementLog
        fields = '__all__'
