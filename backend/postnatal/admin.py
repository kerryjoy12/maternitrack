from django.contrib import admin
from .models import PostnatalRecord


@admin.register(PostnatalRecord)
class PostnatalAdmin(admin.ModelAdmin):
    list_display = ['patient', 'delivery_date', 'delivery_type', 'baby_weight_kg',
                    'review_7day_attended', 'review_6week_attended']
    list_filter = ['delivery_type', 'review_7day_attended', 'review_6week_attended']
    search_fields = ['patient__full_name', 'patient__patient_number']
    ordering = ['-delivery_date']
