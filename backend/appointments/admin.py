from django.contrib import admin
from .models import Appointment


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ['patient', 'appointment_type', 'scheduled_date', 'status', 'attended_date']
    list_filter = ['status', 'appointment_type']
    search_fields = ['patient__full_name', 'patient__patient_number']
    ordering = ['scheduled_date']
    raw_id_fields = ['patient']
