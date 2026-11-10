"""
Phase 3E — Test suite for clinical alerts, RBAC, and core models.

Run with:
    python manage.py test --verbosity=2

Or with pytest:
    pip install pytest pytest-django
    pytest
"""
from django.test import TestCase
from django.utils import timezone
from datetime import date, timedelta
from users.models import StaffUser
from patients.models import Patient, PartographEntry
from alerts.models import ClinicalAlert
from alerts.services import evaluate_clinical_thresholds


class PatientModelTests(TestCase):
    """Core patient model tests."""

    def setUp(self):
        self.staff = StaffUser.objects.create_user(
            email='nurse@test.com', password='test1234',
            full_name='Test Nurse', role='NURSE',
        )
        self.patient = Patient.objects.create(
            full_name='Jane Test',
            phone_number='0712345678',
            lmp=date.today() - timedelta(weeks=30),
            registered_by=self.staff,
        )

    def test_patient_number_auto_generated(self):
        """Patient number should be auto-generated on save."""
        self.assertTrue(self.patient.patient_number.startswith('MAT-'))

    def test_edd_auto_calculated(self):
        """EDD should be LMP + 280 days."""
        expected = self.patient.lmp + timedelta(days=280)
        self.assertEqual(self.patient.edd, expected)

    def test_weeks_pregnant(self):
        """weeks_pregnant should return correct gestational age."""
        self.assertEqual(self.patient.weeks_pregnant, 30)

    def test_soft_delete(self):
        """Deactivation should soft-delete (is_active=False)."""
        self.patient.is_active = False
        self.patient.save()
        self.assertFalse(
            Patient.objects.filter(pk=self.patient.pk, is_active=True).exists()
        )


class AlertServiceTests(TestCase):
    """Tests for the clinical alerting engine."""

    def setUp(self):
        self.staff = StaffUser.objects.create_user(
            email='nurse2@test.com', password='test1234',
            full_name='Alert Nurse', role='NURSE',
        )
        self.patient = Patient.objects.create(
            full_name='Alert Patient',
            phone_number='0712345679',
            lmp=date.today() - timedelta(weeks=38),
            registered_by=self.staff,
        )

    def test_normal_fhr_no_alert(self):
        """FHR within 110-160 should not trigger alert."""
        entry = PartographEntry.objects.create(
            patient=self.patient,
            recorded_by=self.staff,
            hours_in_labour=2,
            fetal_heart_rate=140,
        )
        alerts = ClinicalAlert.objects.filter(patient=self.patient)
        # evaluate_partograph_entry is called via signal, check no FHR alert
        fhr_alerts = alerts.filter(alert_type__in=['FHR_LOW', 'FHR_HIGH'])
        self.assertEqual(fhr_alerts.count(), 0)

    def test_low_fhr_triggers_alert(self):
        """FHR below 110 should trigger FHR_LOW alert."""
        entry = PartographEntry.objects.create(
            patient=self.patient,
            recorded_by=self.staff,
            hours_in_labour=3,
            fetal_heart_rate=95,
        )
        alert = ClinicalAlert.objects.filter(
            patient=self.patient, alert_type='FHR_LOW'
        ).first()
        self.assertIsNotNone(alert)
        self.assertEqual(alert.severity, 'CRITICAL')

    def test_high_fhr_triggers_alert(self):
        """FHR above 160 should trigger FHR_HIGH alert."""
        entry = PartographEntry.objects.create(
            patient=self.patient,
            recorded_by=self.staff,
            hours_in_labour=4,
            fetal_heart_rate=175,
        )
        alert = ClinicalAlert.objects.filter(
            patient=self.patient, alert_type='FHR_HIGH'
        ).first()
        self.assertIsNotNone(alert)

    def test_critical_bp_triggers_alert(self):
        """BP >= 160/110 should trigger BP_CRITICAL alert."""
        entry = PartographEntry.objects.create(
            patient=self.patient,
            recorded_by=self.staff,
            hours_in_labour=5,
            bp_systolic=170,
            bp_diastolic=115,
        )
        alert = ClinicalAlert.objects.filter(
            patient=self.patient, alert_type='BP_CRITICAL'
        ).first()
        self.assertIsNotNone(alert)
        self.assertEqual(alert.severity, 'CRITICAL')

    def test_dedup_prevents_duplicate(self):
        """Same alert type within dedup window should not create duplicate."""
        PartographEntry.objects.create(
            patient=self.patient, recorded_by=self.staff,
            hours_in_labour=6, fetal_heart_rate=90,
        )
        count1 = ClinicalAlert.objects.filter(
            patient=self.patient, alert_type='FHR_LOW'
        ).count()
        # Second entry within dedup window
        PartographEntry.objects.create(
            patient=self.patient, recorded_by=self.staff,
            hours_in_labour=7, fetal_heart_rate=88,
        )
        count2 = ClinicalAlert.objects.filter(
            patient=self.patient, alert_type='FHR_LOW'
        ).count()
        self.assertEqual(count1, count2)  # Should not increase


class RBACTests(TestCase):
    """Tests for role-based access control."""

    def setUp(self):
        self.admin = StaffUser.objects.create_user(
            email='admin@test.com', password='admin1234',
            full_name='Admin User', role='ADMIN',
        )
        self.nurse = StaffUser.objects.create_user(
            email='nurse3@test.com', password='nurse1234',
            full_name='Nurse User', role='NURSE',
        )
        self.patient = Patient.objects.create(
            full_name='RBAC Patient',
            phone_number='0712345680',
            lmp=date.today() - timedelta(weeks=20),
            registered_by=self.nurse,
        )

    def _get_token(self, email, password):
        from rest_framework.test import APIClient
        client = APIClient()
        response = client.post('/api/v1/auth/login/', {
            'email': email, 'password': password,
        }, format='json')
        return response.data.get('access')

    def test_nurse_cannot_delete_patient(self):
        """Nurse should get 403 when trying to delete patient."""
        from rest_framework.test import APIClient
        client = APIClient()
        token = self._get_token('nurse3@test.com', 'nurse1234')
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = client.delete(f'/api/v1/patients/{self.patient.pk}/')
        self.assertEqual(response.status_code, 403)

    def test_admin_can_delete_patient(self):
        """Admin should be able to soft-delete patient."""
        from rest_framework.test import APIClient
        client = APIClient()
        token = self._get_token('admin@test.com', 'admin1234')
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = client.delete(f'/api/v1/patients/{self.patient.pk}/')
        self.assertEqual(response.status_code, 200)
        self.patient.refresh_from_db()
        self.assertFalse(self.patient.is_active)

    def test_unauthenticated_access_denied(self):
        """Unauthenticated requests should return 401."""
        from rest_framework.test import APIClient
        client = APIClient()
        response = client.get('/api/v1/patients/')
        self.assertIn(response.status_code, [401, 403])
