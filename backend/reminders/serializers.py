from rest_framework import serializers
from .models import ReminderLog


class ReminderLogSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    appointment_info = serializers.SerializerMethodField()

    class Meta:
        model = ReminderLog
        fields = '__all__'
        read_only_fields = ['id', 'sent_at', 'delivery_status', 'phone_number', 'message_body', 'error_message']

    def get_patient_name(self, obj):
        return obj.patient.full_name

    def get_appointment_info(self, obj):
        if obj.appointment:
            return f"{obj.appointment.get_appointment_type_display()} on {obj.appointment.scheduled_date}"
        return None


class SendReminderSerializer(serializers.Serializer):
    appointment_id = serializers.IntegerField(required=False)
    patient_id = serializers.IntegerField()
    message = serializers.CharField(required=False, allow_blank=True)
    use_template = serializers.BooleanField(default=True)
    lang = serializers.CharField(required=False, default='en')


class BulkSendReminderSerializer(serializers.Serializer):
    patient_ids = serializers.ListField(child=serializers.IntegerField(), min_length=1)
    use_template = serializers.BooleanField(default=True)
    message = serializers.CharField(required=False, allow_blank=True)
    lang = serializers.CharField(required=False, default='en')
