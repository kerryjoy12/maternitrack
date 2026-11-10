from django.test import TestCase
from django.utils import timezone
from datetime import date, timedelta
from unittest.mock import patch, MagicMock

from users.models import StaffUser
from patients.models import Patient
from appointments.models import Appointment
from reminders.models import ReminderLog
from reminders.tasks import send_appointment_reminder_task, send_bulk_reminders_sync
from rest_framework.test import APITestCase
from rest_framework import status


class RemindersEmailRefactoringTests(APITestCase):
    def setUp(self):
        self.nurse = StaffUser.objects.create_user(
            email='nurse@test.com',
            password='securepass123',
            full_name='Nurse Joy',
            role='NURSE'
        )
        self.client.force_authenticate(user=self.nurse)

    @patch('reminders.views.send_sms')
    @patch('reminders.email_service.send_email_reminder')
    def test_view_phone_and_email_present_sends_only_sms(self, mock_email, mock_sms):
        """If both phone and email are present, only SMS should be sent."""
        mock_sms.return_value = {'success': True}
        mock_email.return_value = {'success': True}

        patient = Patient.objects.create(
            full_name='Dual Contact Patient',
            phone_number='0712345678',
            email='patient@example.com',
            lmp=date.today() - timedelta(weeks=10),
            registered_by=self.nurse
        )

        appointment = Appointment.objects.create(
            patient=patient,
            appointment_type='ANC1',
            scheduled_date=date.today(),
            status='UPCOMING'
        )

        response = self.client.post('/api/v1/reminders/send/', {
            'patient_id': patient.id,
            'appointment_id': appointment.id,
            'use_template': True
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'], response.data)

        # Verify SMS was sent, but Email was NOT
        mock_sms.assert_called_once()
        mock_email.assert_not_called()

        # Check that only SMS log exists
        logs = ReminderLog.objects.filter(patient=patient)
        self.assertEqual(logs.count(), 1)
        self.assertEqual(logs[0].channel, 'SMS')

    @patch('reminders.views.send_sms')
    @patch('reminders.email_service.send_email_reminder')
    def test_view_only_email_present_sends_email(self, mock_email, mock_sms):
        """If phone is missing but email is present, email should be sent."""
        mock_sms.return_value = {'success': True}
        mock_email.return_value = {'success': True}

        patient = Patient.objects.create(
            full_name='Email Only Patient',
            phone_number='',
            email='patient@example.com',
            lmp=date.today() - timedelta(weeks=10),
            registered_by=self.nurse
        )

        appointment = Appointment.objects.create(
            patient=patient,
            appointment_type='ANC1',
            scheduled_date=date.today(),
            status='UPCOMING'
        )

        response = self.client.post('/api/v1/reminders/send/', {
            'patient_id': patient.id,
            'appointment_id': appointment.id,
            'use_template': True
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'], response.data)

        # Verify SMS was NOT sent, but Email WAS
        mock_sms.assert_not_called()
        mock_email.assert_called_once()

        # Check that only Email log exists
        logs = ReminderLog.objects.filter(patient=patient)
        self.assertEqual(logs.count(), 1)
        self.assertEqual(logs[0].channel, 'EMAIL')
        self.assertEqual(logs[0].email_address, 'patient@example.com')

    @patch('reminders.sms_service.send_sms')
    @patch('reminders.email_service.send_email_reminder')
    def test_task_phone_and_email_present_sends_only_sms(self, mock_email, mock_sms):
        """Celery task: if both phone and email are present, only SMS should be sent."""
        mock_sms.return_value = {'success': True}
        mock_email.return_value = {'success': True}

        patient = Patient.objects.create(
            full_name='Task Patient Dual',
            phone_number='0712345678',
            email='patient@example.com',
            lmp=date.today() - timedelta(weeks=10),
            registered_by=self.nurse
        )

        appointment = Appointment.objects.create(
            patient=patient,
            appointment_type='ANC1',
            scheduled_date=date.today(),
            status='UPCOMING'
        )

        # Call task run method directly (bound method: self is passed automatically)
        send_appointment_reminder_task.run(appointment.id)

        # Verify SMS was sent, but Email was NOT
        mock_sms.assert_called_once()
        mock_email.assert_not_called()

        # Check logs
        logs = ReminderLog.objects.filter(patient=patient)
        self.assertEqual(logs.count(), 1)
        self.assertEqual(logs[0].channel, 'SMS')

    @patch('reminders.sms_service.send_sms')
    @patch('reminders.email_service.send_email_reminder')
    def test_task_only_email_present_sends_email(self, mock_email, mock_sms):
        """Celery task: if phone is missing but email is present, email should be sent."""
        mock_sms.return_value = {'success': True}
        mock_email.return_value = {'success': True}

        patient = Patient.objects.create(
            full_name='Task Patient Email Only',
            phone_number='',
            email='patient@example.com',
            lmp=date.today() - timedelta(weeks=10),
            registered_by=self.nurse
        )

        appointment = Appointment.objects.create(
            patient=patient,
            appointment_type='ANC1',
            scheduled_date=date.today(),
            status='UPCOMING'
        )

        # Call task run method directly (bound method: self is passed automatically)
        send_appointment_reminder_task.run(appointment.id)

        mock_sms.assert_not_called()
        mock_email.assert_called_once()

        # Check logs
        logs = ReminderLog.objects.filter(patient=patient)
        self.assertEqual(logs.count(), 1)
        self.assertEqual(logs[0].channel, 'EMAIL')

    @patch('reminders.sms_service.send_sms')
    @patch('reminders.email_service.send_email_reminder')
    def test_bulk_sync_phone_and_email_present_sends_only_sms(self, mock_email, mock_sms):
        """Bulk reminders: if both phone and email are present, only SMS is sent."""
        mock_sms.return_value = {'success': True}
        mock_email.return_value = {'success': True}

        patient = Patient.objects.create(
            full_name='Bulk Patient Dual',
            phone_number='0712345678',
            email='patient@example.com',
            lmp=date.today() - timedelta(weeks=10),
            registered_by=self.nurse
        )

        results = send_bulk_reminders_sync(
            patient_ids=[patient.id],
            use_template=True,
            message='',
            lang='en',
            user_id=self.nurse.id
        )

        self.assertEqual(results['sent'], 1)
        self.assertEqual(results['failed'], 0)

        mock_sms.assert_called_once()
        mock_email.assert_not_called()
