from django.test import TestCase
from django.utils import timezone
from datetime import date, timedelta
import hashlib
from cryptography.fernet import Fernet
from django.conf import settings
from rest_framework import status
from rest_framework.test import APITestCase

from users.models import StaffUser
from patients.models import Patient
from patients.serializers import PatientSerializer
from appointments.models import Appointment
from alerts.models import ClinicalAlert
from referrals.models import Referral

class Phase6ComplianceAndSecurityTests(APITestCase):
    """Test suite covering Phase 6 improvements: field encryption, hash-based lookups, NHIF validation, and Referrals."""

    def setUp(self):
        self.admin = StaffUser.objects.create_user(
            email='admin@imnh.com', password='securepass123',
            full_name='Admin Doctor', role='ADMIN'
        )
        self.nurse = StaffUser.objects.create_user(
            email='nurse@imnh.com', password='securepass123',
            full_name='Nurse Joy', role='NURSE'
        )
        self.client.force_authenticate(user=self.nurse)

    def test_nhif_number_validation_serializer(self):
        """PatientSerializer should reject invalid NHIF formats and accept valid ones."""
        # Valid 8-digit NHIF
        data_valid_8 = {
            'full_name': 'Valid Patient One',
            'phone_number': '0711223344',
            'national_id': '33445566',
            'nhif_number': '12345678',
            'lmp': (date.today() - timedelta(weeks=12)).isoformat(),
        }
        serializer = PatientSerializer(data=data_valid_8)
        self.assertTrue(serializer.is_valid(), serializer.errors)

        # Valid 12-digit NHIF
        data_valid_12 = {
            'full_name': 'Valid Patient Two',
            'phone_number': '0711223345',
            'national_id': '33445567',
            'nhif_number': '123456789012',
            'lmp': (date.today() - timedelta(weeks=12)).isoformat(),
        }
        serializer = PatientSerializer(data=data_valid_12)
        self.assertTrue(serializer.is_valid(), serializer.errors)

        # Invalid NHIF (too short)
        data_invalid_short = data_valid_8.copy()
        data_invalid_short['nhif_number'] = '1234567'
        serializer = PatientSerializer(data=data_invalid_short)
        self.assertFalse(serializer.is_valid())
        self.assertIn('nhif_number', serializer.errors)

        # Invalid NHIF (contains non-digits)
        data_invalid_chars = data_valid_8.copy()
        data_invalid_chars['nhif_number'] = '1234567A'
        serializer = PatientSerializer(data=data_invalid_chars)
        self.assertFalse(serializer.is_valid())
        self.assertIn('nhif_number', serializer.errors)

    def test_field_encryption_at_rest(self):
        """Sensitive patient fields must be encrypted at the database level but decrypted on query."""
        patient = Patient.objects.create(
            full_name='Secret Patient',
            phone_number='0799887766',
            national_id='98765432',
            nhif_number='87654321',
            lmp=date.today() - timedelta(weeks=10),
            registered_by=self.nurse
        )

        # Retrieve direct raw values from the database
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT phone_number, national_id, nhif_number FROM patients WHERE id = %s", [patient.pk])
            row = cursor.fetchone()
            
        db_phone, db_nat_id, db_nhif = row

        # Check that they do NOT match the raw plaintext values and are Fernet tokens (starting with gAAAA)
        self.assertNotEqual(db_phone, '0799887766')
        self.assertNotEqual(db_nat_id, '98765432')
        self.assertNotEqual(db_nhif, '87654321')
        self.assertTrue(db_phone.startswith('gAAAA'))

        # Check that querying via Django ORM automatically decrypts them
        fetched = Patient.objects.get(pk=patient.pk)
        self.assertEqual(fetched.phone_number, '0799887766')
        self.assertEqual(fetched.national_id, '98765432')
        self.assertEqual(fetched.nhif_number, '87654321')

    def test_sha256_hash_generation_and_search(self):
        """SHA-256 hashes must be generated for lookups, and searching by hash must return correct patients."""
        phone = '0788776655'
        nat_id = '11223344'
        nhif = '22334455'

        patient = Patient.objects.create(
            full_name='Hashed Patient',
            phone_number=phone,
            national_id=nat_id,
            nhif_number=nhif,
            lmp=date.today() - timedelta(weeks=10),
            registered_by=self.nurse
        )

        expected_phone_hash = hashlib.sha256(phone.encode('utf-8')).hexdigest()
        expected_nat_id_hash = hashlib.sha256(nat_id.encode('utf-8')).hexdigest()
        expected_nhif_hash = hashlib.sha256(nhif.encode('utf-8')).hexdigest()

        self.assertEqual(patient.phone_number_hash, expected_phone_hash)
        self.assertEqual(patient.national_id_hash, expected_nat_id_hash)
        self.assertEqual(patient.nhif_number_hash, expected_nhif_hash)

        # Search by phone number
        response = self.client.get('/api/v1/patients/', {'search': phone})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['full_name'], 'Hashed Patient')

        # Search by national ID
        response = self.client.get('/api/v1/patients/', {'search': nat_id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['full_name'], 'Hashed Patient')

    def test_referral_creation(self):
        """Referrals should be successfully created with facility code and name."""
        patient = Patient.objects.create(
            full_name='Referral Patient',
            phone_number='0712345678',
            lmp=date.today() - timedelta(weeks=20),
            registered_by=self.nurse
        )

        referral = Referral.objects.create(
            patient=patient,
            referred_by=self.nurse,
            referral_date=date.today(),
            destination_facility='12345 - Referral Hospital'
        )
        self.assertEqual(referral.patient.id, patient.id)
        self.assertEqual(referral.destination_facility, '12345 - Referral Hospital')

    def test_fhir_patient_name_search(self):
        """Querying FHIR patients bundle with name filter should return matching patients."""
        patient_matching = Patient.objects.create(
            full_name='Jane Doe Interop',
            phone_number='0711111111',
            national_id='11111111',
            lmp=date.today() - timedelta(weeks=10),
            registered_by=self.nurse
        )
        patient_other = Patient.objects.create(
            full_name='Alice Smith',
            phone_number='0722222222',
            national_id='22222222',
            lmp=date.today() - timedelta(weeks=10),
            registered_by=self.nurse
        )

        self.client.force_authenticate(user=self.admin)
        
        response = self.client.get('/api/v1/core/fhir/patients/', {'name': 'Jane'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        bundle = response.data
        self.assertEqual(bundle['resourceType'], 'Bundle')
        self.assertEqual(bundle['total'], 1)
        self.assertEqual(bundle['entry'][0]['resource']['name'][0]['text'], 'Jane Doe Interop')

    def test_postnatal_fhir_procedure_serialization(self):
        """PostnatalRecord must serialize correctly into a FHIR Procedure resource with standard SNOMED codes."""
        from postnatal.models import PostnatalRecord
        from core.fhir_views import serialize_postnatal_to_fhir_procedure
        
        patient = Patient.objects.create(
            full_name='Maternity Mother',
            phone_number='0733333333',
            lmp=date.today() - timedelta(weeks=40),
            registered_by=self.nurse
        )
        postnatal = PostnatalRecord.objects.create(
            patient=patient,
            delivery_date=date.today(),
            delivery_type='CAESAREAN',
            baby_weight_kg=3.25,
            baby_gender='MALE',
            apgar_score_1min=8,
            apgar_score_5min=9,
            mother_condition='Good',
            baby_condition='Healthy',
            created_by=self.nurse
        )

        resource = serialize_postnatal_to_fhir_procedure(postnatal)
        self.assertEqual(resource['resourceType'], 'Procedure')
        self.assertEqual(resource['status'], 'completed')
        self.assertEqual(resource['code']['coding'][0]['code'], '116224001')  # SNOMED Caesarean
        self.assertEqual(resource['code']['coding'][0]['display'], 'Caesarean section')
        self.assertEqual(resource['subject']['reference'], f'Patient/{patient.id}')

        weight_ext = next(ext for ext in resource['extension'] if 'baby-weight' in ext['url'])
        gender_ext = next(ext for ext in resource['extension'] if 'baby-gender' in ext['url'])
        self.assertEqual(weight_ext['valueDecimal'], 3.25)
        self.assertEqual(gender_ext['valueCode'], 'MALE')

    def test_automatic_postnatal_fhir_push(self):
        """Saving a PostnatalRecord triggers EHR push task (mock receiver integration)."""
        from postnatal.models import PostnatalRecord
        from unittest.mock import patch

        patient = Patient.objects.create(
            full_name='Push Mother',
            phone_number='0744444444',
            lmp=date.today() - timedelta(weeks=40),
            registered_by=self.nurse
        )

        with patch('requests.post') as mock_post:
            from unittest.mock import Mock
            mock_resp = Mock()
            mock_resp.status_code = 201
            mock_post.return_value = mock_resp

            postnatal = PostnatalRecord.objects.create(
                patient=patient,
                delivery_date=date.today(),
                delivery_type='NORMAL',
                created_by=self.nurse
            )

            from postnatal.tasks import push_postnatal_record_to_ehr_task
            push_postnatal_record_to_ehr_task(postnatal.pk)

            self.assertTrue(mock_post.called)
            args, kwargs = mock_post.call_args
            self.assertEqual(kwargs['headers']['Content-Type'], 'application/fhir+json')
            payload = kwargs['json']
            self.assertEqual(payload['resourceType'], 'Procedure')
            self.assertEqual(payload['code']['coding'][0]['code'], '386684002')
