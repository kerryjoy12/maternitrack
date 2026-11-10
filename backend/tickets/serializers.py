from rest_framework import serializers
from django.utils import timezone
from .models import Ticket, Notification
from users.models import StaffUser
from patients.models import Patient
from .models import TicketReply
from rest_framework.fields import SerializerMethodField


class TicketCreateSerializer(serializers.ModelSerializer):
    patient_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = Ticket
        fields = ['title', 'description', 'priority', 'patient_id']

    def validate_patient_id(self, value):
        if value is None:
            return None
        try:
            return Patient.objects.get(pk=value)
        except Patient.DoesNotExist:
            raise serializers.ValidationError('Patient not found.')

    def create(self, validated_data):
        patient = validated_data.pop('patient_id', None)
        ticket = Ticket.objects.create(
            created_by=self.context['request'].user,
            patient=patient,
            **validated_data,
        )
        return ticket


class TicketSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    created_by_role = serializers.CharField(source='created_by.role', read_only=True)
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    patient_number = serializers.CharField(source='patient.patient_number', read_only=True)

    class Meta:
        model = Ticket
        fields = [
            'id', 'title', 'description', 'priority', 'status',
            'created_by', 'created_by_name', 'created_by_role',
            'patient', 'patient_name', 'patient_number',
            'created_at', 'updated_at',
            'reply',
        ]
        read_only_fields = ['id', 'status', 'created_by', 'created_by_name', 'created_by_role', 'created_at', 'updated_at']

    reply = SerializerMethodField(read_only=True)

    def get_reply(self, obj):
        # Return latest admin reply if present
        reply = obj.replies.last()
        if not reply:
            return None
        return TicketReplySerializer(reply).data


class TicketStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = ['status']

    def validate_status(self, value):
        valid = {choice[0] for choice in Ticket.STATUS_CHOICES}
        if value not in valid:
            raise serializers.ValidationError('Invalid ticket status.')
        return value


class NotificationSerializer(serializers.ModelSerializer):
    ticket_title = serializers.CharField(source='ticket.title', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'user', 'user_email', 'ticket', 'ticket_title', 'message', 'is_read', 'created_at']
        read_only_fields = ['id', 'user', 'user_email', 'ticket', 'ticket_title', 'created_at']


class TicketReplySerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.full_name', read_only=True)

    class Meta:
        model = TicketReply
        fields = ['id', 'ticket', 'author', 'author_name', 'message', 'created_at']
        read_only_fields = ['id', 'ticket', 'author', 'author_name', 'created_at']


class TicketReplyCreateSerializer(serializers.Serializer):
    message = serializers.CharField()

    def validate_message(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Message cannot be empty.')
        return value.strip()
