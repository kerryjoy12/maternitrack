from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from patients.models import Patient, SymptomReport
from alerts.models import ClinicalAlert
from patients.models import SecureMessage
import datetime

class PatientMotherAccountSignalTest(TestCase):
    def test_mother_account_created_automatically(self):
        User = get_user_model()
        initial_user_count = User.objects.count()

        # Create a patient
        patient = Patient.objects.create(
            full_name="Maria Theresa",
            phone_number="+254711222333",
            lmp=datetime.date.today() - datetime.timedelta(weeks=10)
        )

        # Confirm a new user was created
        self.assertEqual(User.objects.count(), initial_user_count + 1)

        # Retrieve the user and verify details
        mother_user = User.objects.get(patient=patient)
        self.assertEqual(mother_user.email, f"{patient.patient_number.lower()}@maternity.local")
        self.assertEqual(mother_user.role, 'MOTHER')
        self.assertTrue(mother_user.check_password("Mother123!"))


class MotherPortalViewsTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.User = get_user_model()

        # Create patient
        self.patient = Patient.objects.create(
            full_name="Jane Doe",
            phone_number="+254700111222",
            lmp=datetime.date.today() - datetime.timedelta(weeks=20)
        )
        # Mother account automatically created by signal
        self.mother_user = self.User.objects.get(patient=self.patient)

        # Create a staff user (Doctor)
        self.doctor_user = self.User.objects.create_user(
            email="doc@maternity.local",
            full_name="Dr. Smith",
            role="DOCTOR",
            password="password123"
        )

    def test_mother_dashboard_view_success(self):
        self.client.force_authenticate(user=self.mother_user)
        response = self.client.get('/api/v1/patients/mother/dashboard/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['pregnancy_status'], 'Pregnancy Active')
        self.assertEqual(response.data['gestational_age_weeks'], 20)
        self.assertEqual(response.data['trimester'], '2nd Trimester')

    def test_mother_dashboard_permission_denied_for_doctor(self):
        self.client.force_authenticate(user=self.doctor_user)
        response = self.client.get('/api/v1/patients/mother/dashboard/')
        self.assertEqual(response.status_code, 403)

    def test_mother_report_symptom_success(self):
        self.client.force_authenticate(user=self.mother_user)
        payload = {
            'symptoms': 'bleeding, fever',
            'description': 'Severe headache and spotting noticed',
            'severity': 'HIGH'
        }
        response = self.client.post('/api/v1/patients/mother/symptoms/', payload)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(SymptomReport.objects.count(), 1)
        report = SymptomReport.objects.first()
        self.assertEqual(report.patient, self.patient)
        self.assertEqual(report.status, 'PENDING')
        alert = ClinicalAlert.objects.get(patient=self.patient)
        self.assertEqual(alert.alert_type, ClinicalAlert.AlertType.PATIENT_SYMPTOM_REPORT)
        self.assertEqual(alert.severity, ClinicalAlert.Severity.CRITICAL)
        self.assertIn(self.patient.full_name, alert.message)
        self.assertIn('bleeding', alert.message)

    def test_mother_report_symptom_description_only(self):
        self.client.force_authenticate(user=self.mother_user)
        response = self.client.post('/api/v1/patients/mother/symptoms/', {
            'symptoms': '',
            'description': 'Mild cramping since this morning',
            'severity': 'LOW',
        })
        self.assertEqual(response.status_code, 201)
        report = SymptomReport.objects.first()
        self.assertEqual(report.symptoms, 'custom')
        self.assertEqual(report.description, 'Mild cramping since this morning')
        alert = ClinicalAlert.objects.get(patient=self.patient)
        self.assertEqual(alert.alert_type, ClinicalAlert.AlertType.PATIENT_SYMPTOM_REPORT)
        self.assertEqual(alert.severity, ClinicalAlert.Severity.WARNING)

    def test_alert_follow_up_sends_care_message_to_mother(self):
        self.client.force_authenticate(user=self.mother_user)
        self.client.post('/api/v1/patients/mother/symptoms/', {
            'symptoms': 'fever',
            'description': 'Feeling unwell',
            'severity': 'HIGH',
        })
        alert = ClinicalAlert.objects.get(patient=self.patient)

        self.client.force_authenticate(user=self.doctor_user)
        response = self.client.post(
            f'/api/v1/alerts/{alert.pk}/follow-up/',
            {'message': 'Please come to the hospital today for review.'},
        )
        self.assertEqual(response.status_code, 201)
        care_message = SecureMessage.objects.get(
            patient=self.patient,
            message_type=SecureMessage.MessageType.CARE_ALERT,
        )
        self.assertEqual(care_message.recipient, self.mother_user)
        self.assertEqual(care_message.sender, self.doctor_user)
        self.assertIn('hospital', care_message.message.lower())
        alert.refresh_from_db()
        self.assertTrue(alert.acknowledged)

        self.client.force_authenticate(user=self.mother_user)
        dashboard = self.client.get('/api/v1/patients/mother/dashboard/')
        self.assertEqual(dashboard.status_code, 200)
        self.assertEqual(len(dashboard.data['care_alerts']), 1)

    def test_mother_list_symptoms_returns_unpaginated_array(self):
        self.client.force_authenticate(user=self.mother_user)
        SymptomReport.objects.create(
            patient=self.patient,
            symptoms='fever',
            description='Feeling warm',
            severity='MEDIUM',
        )
        response = self.client.get('/api/v1/patients/mother/symptoms/')
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 1)



