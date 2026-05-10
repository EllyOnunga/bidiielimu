from django.db import models


class InventoryItem(models.Model):
    CATEGORY_CHOICES = (
        ("STATIONERY", "Stationery"),
        ("LAB", "Laboratory"),
        ("LIBRARY", "Library"),
        ("GENERAL", "General"),
    )
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    quantity = models.IntegerField(default=0)
    unit = models.CharField(max_length=20)  # e.g. PCS, BOX
    min_threshold = models.IntegerField(default=5)
    last_restock = models.DateField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.quantity} {self.unit})"


class ProcurementLog(models.Model):
    item = models.ForeignKey(
        InventoryItem, on_delete=models.CASCADE, related_name="logs"
    )
    quantity_added = models.IntegerField()
    cost = models.DecimalField(max_digits=12, decimal_places=2)
    supplier = models.CharField(max_length=255)
    date = models.DateField(auto_now_add=True)


class BookIssue(models.Model):
    STATUS_CHOICES = (
        ("ISSUED", "Issued"),
        ("RETURNED", "Returned"),
        ("OVERDUE", "Overdue"),
        ("LOST", "Lost"),
    )
    CONDITION_CHOICES = (
        ("GOOD", "Good"),
        ("DAMAGED", "Damaged"),
        ("LOST", "Lost"),
    )

    item = models.ForeignKey(
        InventoryItem,
        on_delete=models.CASCADE,
        related_name="issues",
        limit_choices_to={"category": "LIBRARY"},
    )
    student = models.ForeignKey(
        "students.Student", on_delete=models.CASCADE, related_name="book_issues"
    )
    issued_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="issued_books",
    )
    issue_date = models.DateField(auto_now_add=True)
    due_date = models.DateField()
    return_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="ISSUED")
    condition_on_return = models.CharField(
        max_length=10, choices=CONDITION_CHOICES, null=True, blank=True
    )
    fine_amount = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    notes = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.item.name} -> {self.student} ({self.status})"
