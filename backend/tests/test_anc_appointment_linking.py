"""
Test suite for ANCVisit creation linked to appointment attendance status updates.
This tests the feature: "Link ANCVisit creation to appointment attendance status updates in models and views"
"""
from datetime import date, timedelta
from rest_framework import status
from rest_framework.test import APITestCase

from users.models import StaffUser
from patients.models import Patient
from appointments.models import Appointment
from clinical.models import ANCVisit


class ANCVisitAppointmentLinkingTests(APITestCase):
    """Test suite for the ANCVisit-Appointment linking feature."""

    def setUp(self):
        """Set up test data."""
        self.nurse = StaffUser.objects.create_user(
            email='nurse@test.com',
            password='securepass123',
            full_name='Nurse Joy',
            role='NURSE'
        )
        self.patient = Patient.objects.create(
            full_name='Test Mother',
            phone_number='0712345678',
            lmp=date.today() - timedelta(weeks=20),
            registered_by=self.nurse
        )
        self.client.force_authenticate(user=self.nurse)

    def test_mark_anc_appointment_attended_creates_anc_visit(self):
        """Marking an ANC appointment as attended should create an ANCVisit record."""
        appointment = Appointment.objects.create(
            patient=self.patient,
            appointment_type='ANC1',
            scheduled_date=date.today(),
            status='UPCOMING'
        )

        response = self.client.post(f'/api/v1/appointments/{appointment.pk}/attend/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        appointment.refresh_from_db()
        self.assertEqual(appointment.status, 'ATTENDED')
        self.assertEqual(appointment.attended_date, date.today())

        # Check ANCVisit was created
        anc_visit = ANCVisit.objects.filter(appointment=appointment).first()
        self.assertIsNotNone(anc_visit)
        self.assertEqual(anc_visit.patient, self.patient)
        self.assertEqual(anc_visit.visit_number, 1)
        self.assertEqual(anc_visit.visit_date, date.today())
        self.assertEqual(anc_visit.appointment, appointment)

    def test_mark_anc2_appointment_creates_visit_number_2(self):
        """Marking an ANC2 appointment as attended should create ANCVisit with visit_number=2."""
        appointment = Appointment.objects.create(
            patient=self.patient,
            appointment_type='ANC2',
            scheduled_date=date.today(),
            status='UPCOMING'
        )

        response = self.client.post(f'/api/v1/appointments/{appointment.pk}/attend/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        anc_visit = ANCVisit.objects.filter(appointment=appointment).first()
        self.assertIsNotNone(anc_visit)
        self.assertEqual(anc_visit.visit_number, 2)

    def test_mark_anc3_appointment_creates_visit_number_3(self):
        """Marking an ANC3 appointment as attended should create ANCVisit with visit_number=3."""
        appointment = Appointment.objects.create(
            patient=self.patient,
            appointment_type='ANC3',
            scheduled_date=date.today(),
            status='UPCOMING'
        )

        response = self.client.post(f'/api/v1/appointments/{appointment.pk}/attend/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        anc_visit = ANCVisit.objects.filter(appointment=appointment).first()
        self.assertIsNotNone(anc_visit)
        self.assertEqual(anc_visit.visit_number, 3)

    def test_mark_anc4_appointment_creates_visit_number_4(self):
        """Marking an ANC4 appointment as attended should create ANCVisit with visit_number=4."""
        appointment = Appointment.objects.create(
            patient=self.patient,
            appointment_type='ANC4',
            scheduled_date=date.today(),
            status='UPCOMING'
        )

        response = self.client.post(f'/api/v1/appointments/{appointment.pk}/attend/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        anc_visit = ANCVisit.objects.filter(appointment=appointment).first()
        self.assertIsNotNone(anc_visit)
        self.assertEqual(anc_visit.visit_number, 4)

    def test_mark_non_anc_appointment_does_not_create_anc_visit(self):
        """Marking a non-ANC appointment as attended should NOT create an ANCVisit record."""
        appointment = Appointment.objects.create(
            patient=self.patient,
            appointment_type='POSTNATAL_7DAY',
            scheduled_date=date.today(),
            status='UPCOMING'
        )

        response = self.client.post(f'/api/v1/appointments/{appointment.pk}/attend/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        appointment.refresh_from_db()
        self.assertEqual(appointment.status, 'ATTENDED')

        # Check no ANCVisit was created
        anc_visit = ANCVisit.objects.filter(appointment=appointment).first()
        self.assertIsNone(anc_visit)

    def test_duplicate_mark_attended_does_not_create_duplicate_anc_visit(self):
        """Marking an appointment as attended twice should not create duplicate ANCVisit."""
        appointment = Appointment.objects.create(
            patient=self.patient,
            appointment_type='ANC1',
            scheduled_date=date.today(),
            status='UPCOMING'
        )

        # First mark as attended
        response1 = self.client.post(f'/api/v1/appointments/{appointment.pk}/attend/')
        self.assertEqual(response1.status_code, status.HTTP_200_OK)

        # Second mark as attended (should not create duplicate)
        response2 = self.client.post(f'/api/v1/appointments/{appointment.pk}/attend/')
        self.assertEqual(response2.status_code, status.HTTP_200_OK)

        # Check only one ANCVisit exists
        anc_visits = ANCVisit.objects.filter(appointment=appointment)
        self.assertEqual(anc_visits.count(), 1)

    def test_response_includes_anc_visit_id(self):
        """The response from mark-attended should include the created ANCVisit ID."""
        appointment = Appointment.objects.create(
            patient=self.patient,
            appointment_type='ANC1',
            scheduled_date=date.today(),
            status='UPCOMING'
        )

        response = self.client.post(f'/api/v1/appointments/{appointment.pk}/attend/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('anc_visit_created', response.data)
        self.assertIsNotNone(response.data['anc_visit_created'])

    def test_anc_visit_save_updates_appointment_status(self):
        """Saving an ANCVisit with an appointment should update the appointment status to ATTENDED."""
        appointment = Appointment.objects.create(
            patient=self.patient,
            appointment_type='ANC1',
            scheduled_date=date.today(),
            status='UPCOMING'
        )

        # Create ANCVisit directly (not through mark-attended)
        anc_visit = ANCVisit.objects.create(
            patient=self.patient,
            visit_number=1,
            visit_date=date.today(),
            appointment=appointment,
            attending_staff=self.nurse
        )

        # Refresh appointment from database
        appointment.refresh_from_db()
        self.assertEqual(appointment.status, 'ATTENDED')
        self.assertEqual(appointment.attended_date, date.today())

    def test_anc_visit_save_does_not_change_already_attended_appointment(self):
        """Saving an ANCVisit should not change an already ATTENDED appointment."""
        appointment = Appointment.objects.create(
            patient=self.patient,
            appointment_type='ANC1',
            scheduled_date=date.today(),
            status='ATTENDED',
            attended_date=date.today()
        )

        # Create ANCVisit directly
        anc_visit = ANCVisit.objects.create(
            patient=self.patient,
            visit_number=1,
            visit_date=date.today(),
            appointment=appointment,
            attending_staff=self.nurse
        )

        # Refresh appointment from database
        appointment.refresh_from_db()
        # Should still be ATTENDED (no change)
        self.assertEqual(appointment.status, 'ATTENDED')
