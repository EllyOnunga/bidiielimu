from django.db import models

class InventoryItem(models.Model):
    CATEGORY_CHOICES = (
        ('STATIONERY', 'Stationery'),
        ('LAB', 'Laboratory'),
        ('LIBRARY', 'Library'),
        ('GENERAL', 'General'),
    )
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    quantity = models.IntegerField(default=0)
    unit = models.CharField(max_length=20) # e.g. PCS, BOX
    min_threshold = models.IntegerField(default=5)
    last_restock = models.DateField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.quantity} {self.unit})"

class ProcurementLog(models.Model):
    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name='logs')
    quantity_added = models.IntegerField()
    cost = models.DecimalField(max_digits=12, decimal_places=2)
    supplier = models.CharField(max_length=255)
    date = models.DateField(auto_now_add=True)
