import os
import django
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_dev')
django.setup()

from users.models import StaffUser
from patients.models import Patient

patient, created = Patient.objects.get_or_create(
    full_name='Mother User',
    phone_number='0712345678',
    defaults={
        'first_name': 'Mother',
        'last_name': 'User',
        'gender': 'FEMALE',
        'email': 'mother@materni.local',
        'clinic_stage': 'POSTNATAL',
        'blood_group': 'O+',
        'lang': 'en',
        'health_facility_name': 'Materni Facility',
        'next_of_kin_name': 'Mother Next',
        'next_of_kin_phone': '0712345679',
        'date_of_birth': date(1990, 1, 1),
        'lmp': date(2024, 1, 1),
    }
)
if created:
    patient.save()

users = [
    {
        'email': 'neville@itierionursinghome.co.ke',
        'full_name': 'Neville Admin',
        'role': 'ADMIN',
        'password': '#Itierio@254',
        'is_staff': True,
        'is_superuser': True,
        'patient': None,
    },
    {
        'email': 'agatha@itierionursinghome.co.ke',
        'full_name': 'Agatha Nurse',
        'role': 'NURSE',
        'password': '#Itierio@254',
        'is_staff': True,
        'is_superuser': False,
        'patient': None,
    },
    {
        'email': 'jude@itierionursinghome.co.ke',
        'full_name': 'Jude Doctor',
        'role': 'DOCTOR',
        'password': '#Itierio@254',
        'is_staff': True,
        'is_superuser': False,
        'patient': None,
    },
    {
        'email': 'fab@itierionursinghome.co.ke',
        'full_name': 'Fab Nurse',
        'role': 'NURSE',
        'password': '#Itierio@254',
        'is_staff': True,
        'is_superuser': False,
        'patient': None,
    },
    {
        'email': 'admin@materni.local',
        'full_name': 'Admin User',
        'role': 'ADMIN',
        'password': 'AdminPass123!',
        'is_staff': True,
        'is_superuser': True,
        'patient': None,
    },
    {
        'email': 'doctor@materni.local',
        'full_name': 'Doctor User',
        'role': 'DOCTOR',
        'password': 'DoctorPass123!',
        'is_staff': True,
        'is_superuser': False,
        'patient': None,
    },
    {
        'email': 'nurse@materni.local',
        'full_name': 'Nurse User',
        'role': 'NURSE',
        'password': 'NursePass123!',
        'is_staff': True,
        'is_superuser': False,
        'patient': None,
    },
    {
        'email': 'mother@materni.local',
        'full_name': 'Mother User',
        'role': 'MOTHER',
        'password': 'MotherPass123!',
        'is_staff': False,
        'is_superuser': False,
        'patient': patient,
    },
]

for spec in users:
    user, created = StaffUser.objects.get_or_create(email=spec['email'], defaults={
        'full_name': spec['full_name'],
        'role': spec['role'],
        'is_staff': spec['is_staff'],
        'is_superuser': spec['is_superuser'],
        'patient': spec['patient'],
    })
    if created:
        user.set_password(spec['password'])
        user.save()
        print(f"Created {spec['role']} user: {spec['email']}")
    else:
        if not user.check_password(spec['password']):
            user.set_password(spec['password'])
            updated_fields = ['password']
            if user.role != spec['role']:
                user.role = spec['role']; updated_fields.append('role')
            if user.is_staff != spec['is_staff']:
                user.is_staff = spec['is_staff']; updated_fields.append('is_staff')
            if user.is_superuser != spec['is_superuser']:
                user.is_superuser = spec['is_superuser']; updated_fields.append('is_superuser')
            if spec['patient'] is not None and user.patient_id != spec['patient'].id:
                user.patient = spec['patient']; updated_fields.append('patient')
            user.save(update_fields=updated_fields)
            print(f"Updated password/role for {spec['email']}")
        else:
            print(f"User already exists: {spec['email']}")

print('\nLogin credentials:')
print('Admin: admin@materni.local / AdminPass123!')
print('Doctor: doctor@materni.local / DoctorPass123!')
print('Nurse: nurse@materni.local / NursePass123!')
print('Mother: mother@materni.local / MotherPass123!')
