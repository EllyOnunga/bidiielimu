from django.contrib import admin

from .models import School, Subscription


# Also register standard schools models if not registered yet
@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ["name", "schema_name", "created_at"]
    search_fields = ["name", "schema_name"]


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ["school", "plan", "status", "expiry_date"]
    list_filter = ["plan", "status"]
