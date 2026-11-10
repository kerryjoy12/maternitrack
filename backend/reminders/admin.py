from django.contrib import admin
from .models import ReminderLog


@admin.register(ReminderLog)
class ReminderLogAdmin(admin.ModelAdmin):
    list_display = ['patient', 'phone_number', 'delivery_status', 'provider', 'sent_at']
    list_filter = ['delivery_status', 'provider']
    search_fields = ['patient__full_name', 'phone_number']
    ordering = ['-sent_at']
    readonly_fields = ['sent_at']
