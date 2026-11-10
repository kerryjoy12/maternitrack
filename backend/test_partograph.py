from patients.serializers import PartographEntrySerializer
from patients.models import Patient

data = {
    'patient': Patient.objects.first().id if Patient.objects.exists() else 1,
    'hours_in_labour': 6,
    'cervical_dilation_cm': 8,
    'fetal_heart_rate': 112,
    'contractions_per_10min': 4,
    'descent_station': -4,
    'bp_systolic': 120,
    'bp_diastolic': 80,
    'pulse_rate': 72,
    'temperature_celsius': 36.5,
    'moulding': '0',
    'liquor': 'I',
    'contraction_duration': '20-40',
    'urine_protein': 'TRACE',
    'drugs_given': 'Oxytocin',
    'notes': 'The delivery was aided'
}

serializer = PartographEntrySerializer(data=data)
if serializer.is_valid():
    print("Valid!")
else:
    print("Errors:", serializer.errors)
