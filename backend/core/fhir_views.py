"""
FHIR R4 Export — Phase 3G

Exposes patient data in HL7 FHIR R4 JSON format for interoperability
with external health information systems.

GET /api/core/fhir/patient/<pk>/
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsAdminOrDoctor
from patients.models import Patient


def serialize_patient_to_fhir(patient):
    """
    Serializes a Patient model instance into an HL7 FHIR R4 Patient resource.
    
    Reference: https://www.hl7.org/fhir/patient.html
    """
    fhir_resource = {
        'resourceType': 'Patient',
        'id': str(patient.pk),
        'meta': {
            'versionId': '1',
            'lastUpdated': patient.updated_at.isoformat(),
            'source': 'MaterniTrack',
        },
        'identifier': [
            {
                'use': 'official',
                'system': 'urn:maternitrack:patient-number',
                'value': patient.patient_number,
            }
        ],
        'active': patient.is_active,
        'gender': 'female',  # Default gender for maternity patients
        'telecom': [],
        'address': [],
    }

    # Standard FHIR R4 name details
    name_details = {
        'use': 'official',
        'text': patient.full_name,
    }
    if patient.last_name:
        name_details['family'] = patient.last_name
    
    given_names = []
    if patient.first_name:
        given_names.append(patient.first_name)
    if patient.middle_name:
        given_names.append(patient.middle_name)
    if given_names:
        name_details['given'] = given_names
    
    fhir_resource['name'] = [name_details]

    # Identifiers (National ID / NHIF Number)
    if patient.national_id:
        fhir_resource['identifier'].append({
            'use': 'official',
            'type': {
                'coding': [{
                    'system': 'http://terminology.hl7.org/CodeSystem/v2-0203',
                    'code': 'NI',
                    'display': 'National Unique Individual Identifier'
                }]
            },
            'system': 'urn:maternitrack:national-id',
            'value': patient.national_id,
        })
    if patient.nhif_number:
        fhir_resource['identifier'].append({
            'use': 'official',
            'type': {
                'coding': [{
                    'system': 'http://terminology.hl7.org/CodeSystem/v2-0203',
                    'code': 'MC',
                    'display': "Patient's Member Number / NHIF"
                }]
            },
            'system': 'urn:maternitrack:nhif-number',
            'value': patient.nhif_number,
        })

    # Phone
    if patient.phone_number:
        fhir_resource['telecom'].append({
            'system': 'phone',
            'value': patient.phone_number,
            'use': 'mobile',
        })

    # Date of birth
    if patient.date_of_birth:
        fhir_resource['birthDate'] = patient.date_of_birth.isoformat()

    # Address Mapping
    address_dict = {
        'use': 'home',
        'type': 'both',
    }
    if patient.address:
        address_dict['text'] = patient.address
    
    lines = []
    if patient.estate_house_number:
        lines.append(patient.estate_house_number)
    if patient.residence_village:
        lines.append(patient.residence_village)
    if lines:
        address_dict['line'] = lines
        
    if patient.residence_ward:
        address_dict['district'] = patient.residence_ward
    if patient.residence_subcounty:
        address_dict['city'] = patient.residence_subcounty
    if patient.residence_county:
        address_dict['state'] = patient.residence_county
        
    if any(k in address_dict for k in ['text', 'line', 'district', 'city', 'state']):
        fhir_resource['address'].append(address_dict)

    # Next of Kin & Spouse as Contacts
    contact_list = []
    if patient.next_of_kin_name:
        contact = {
            'relationship': [
                {
                    'coding': [{
                        'system': 'http://terminology.hl7.org/CodeSystem/v2-0131',
                        'code': 'N',
                        'display': 'Next-of-Kin',
                    }]
                }
            ],
            'name': {'text': patient.next_of_kin_name},
        }
        if patient.next_of_kin_phone:
            contact['telecom'] = [{'system': 'phone', 'value': patient.next_of_kin_phone}]
        if patient.emergency_contact_relationship:
            contact['relationship'][0]['coding'].append({
                'system': 'urn:maternitrack:relationship',
                'code': patient.emergency_contact_relationship.upper().replace(' ', '_'),
                'display': patient.emergency_contact_relationship
            })
        contact_list.append(contact)

    if patient.spouse_name:
        spouse_contact = {
            'relationship': [
                {
                    'coding': [{
                        'system': 'http://terminology.hl7.org/CodeSystem/v2-0131',
                        'code': 'S',
                        'display': 'Spouse',
                    }]
                }
            ],
            'name': {'text': patient.spouse_name},
        }
        if patient.spouse_phone:
            spouse_contact['telecom'] = [{'system': 'phone', 'value': patient.spouse_phone}]
        contact_list.append(spouse_contact)

    if contact_list:
        fhir_resource['contact'] = contact_list

    # Extensions — Maternity-specific clinical and facility details
    extensions = []
    if patient.lmp:
        extensions.append({
            'url': 'urn:maternitrack:extension:lmp',
            'valueDate': patient.lmp.isoformat(),
        })
    if patient.edd:
        extensions.append({
            'url': 'urn:maternitrack:extension:edd',
            'valueDate': patient.edd.isoformat(),
        })
    
    extensions.append({
        'url': 'urn:maternitrack:extension:risk-level',
        'valueCode': patient.risk_level,
    })
    extensions.append({
        'url': 'urn:maternitrack:extension:clinic-stage',
        'valueCode': patient.clinic_stage,
    })
    
    if patient.blood_group:
        extensions.append({
            'url': 'urn:maternitrack:extension:blood-group',
            'valueCode': patient.blood_group,
        })
    if patient.weeks_pregnant is not None:
        extensions.append({
            'url': 'urn:maternitrack:extension:gestational-age-weeks',
            'valueInteger': patient.weeks_pregnant,
        })
    if patient.gravida is not None:
        extensions.append({
            'url': 'urn:maternitrack:extension:gravida',
            'valueInteger': patient.gravida,
        })
    if patient.parity is not None:
        extensions.append({
            'url': 'urn:maternitrack:extension:parity',
            'valueInteger': patient.parity,
        })
    if patient.height is not None:
        extensions.append({
            'url': 'urn:maternitrack:extension:height',
            'valueDecimal': float(patient.height),
        })
    if patient.weight is not None:
        extensions.append({
            'url': 'urn:maternitrack:extension:weight',
            'valueDecimal': float(patient.weight),
        })
    if patient.health_facility_name:
        extensions.append({
            'url': 'urn:maternitrack:extension:health-facility-name',
            'valueString': patient.health_facility_name,
        })
    if patient.kmhfl_code:
        extensions.append({
            'url': 'urn:maternitrack:extension:kmhfl-code',
            'valueString': patient.kmhfl_code,
        })
    if patient.anc_number:
        extensions.append({
            'url': 'urn:maternitrack:extension:anc-number',
            'valueString': patient.anc_number,
        })
    if patient.pnc_number:
        extensions.append({
            'url': 'urn:maternitrack:extension:pnc-number',
            'valueString': patient.pnc_number,
        })
    if patient.household_size is not None:
        extensions.append({
            'url': 'urn:maternitrack:extension:household-size',
            'valueInteger': patient.household_size,
        })

    # Medical History Flags
    extensions.append({
        'url': 'urn:maternitrack:extension:has-diabetes',
        'valueBoolean': patient.has_diabetes,
    })
    extensions.append({
        'url': 'urn:maternitrack:extension:has-hypertension',
        'valueBoolean': patient.has_hypertension,
    })
    if patient.blood_transfusion_history:
        extensions.append({
            'url': 'urn:maternitrack:extension:blood-transfusion-history',
            'valueString': patient.blood_transfusion_history,
        })
    if patient.tb_history:
        extensions.append({
            'url': 'urn:maternitrack:extension:tb-history',
            'valueString': patient.tb_history,
        })
    extensions.append({
        'url': 'urn:maternitrack:extension:has-drug-allergy',
        'valueBoolean': patient.has_drug_allergy,
    })
    if patient.drug_allergies_specify:
        extensions.append({
            'url': 'urn:maternitrack:extension:drug-allergies-specify',
            'valueString': patient.drug_allergies_specify,
        })
    extensions.append({
        'url': 'urn:maternitrack:extension:family-history-twins',
        'valueBoolean': patient.family_history_twins,
    })
    extensions.append({
        'url': 'urn:maternitrack:extension:family-history-tb',
        'valueBoolean': patient.family_history_tb,
    })

    fhir_resource['extension'] = extensions
    return fhir_resource


class FHIRPatientExportView(APIView):
    """
    Returns a FHIR R4-compliant Patient resource.
    Reference: https://www.hl7.org/fhir/patient.html
    """
    permission_classes = [IsAuthenticated, IsAdminOrDoctor]

    def get(self, request, pk):
        try:
            patient = Patient.objects.get(pk=pk)
        except Patient.DoesNotExist:
            return Response({'error': 'Patient not found.'}, status=404)

        fhir_resource = serialize_patient_to_fhir(patient)
        return Response(fhir_resource)


class FHIRBundleExportView(APIView):
    """
    GET /api/core/fhir/patients/
    Returns a FHIR Bundle containing all active patients.
    Admin/Doctor only.
    """
    permission_classes = [IsAuthenticated, IsAdminOrDoctor]

    def get(self, request):
        name = request.query_params.get('name', '')
        patients = Patient.objects.filter(is_active=True)
        if name:
            patients = patients.filter(full_name__icontains=name)
        patients = patients[:100]  # Limit for safety

        entries = []
        for p in patients:
            entries.append({
                'resource': serialize_patient_to_fhir(p),
                'request': {
                    'method': 'GET',
                    'url': f'Patient/{p.pk}',
                },
            })

        bundle = {
            'resourceType': 'Bundle',
            'type': 'searchset',
            'total': len(entries),
            'entry': entries,
        }

        return Response(bundle)


# ─── FHIR Procedure (Delivery Record) Interoperability ────────────────────────

from postnatal.models import PostnatalRecord

def serialize_postnatal_to_fhir_procedure(postnatal):
    """
    Serializes a PostnatalRecord model instance into an HL7 FHIR R4 Procedure resource.
    
    Reference: https://www.hl7.org/fhir/procedure.html
    """
    snomed_coding = {
        'NORMAL': {
            'system': 'http://snomed.info/sct',
            'code': '386684002',
            'display': 'Vaginal delivery'
        },
        'CAESAREAN': {
            'system': 'http://snomed.info/sct',
            'code': '116224001',
            'display': 'Caesarean section'
        },
        'ASSISTED': {
            'system': 'http://snomed.info/sct',
            'code': '236985002',
            'display': 'Assisted delivery'
        }
    }
    
    delivery_code = postnatal.delivery_type.upper() if postnatal.delivery_type else 'NORMAL'
    coding = snomed_coding.get(delivery_code, {
        'system': 'http://snomed.info/sct',
        'code': '386684002',
        'display': 'Delivery procedure'
    })

    fhir_resource = {
        'resourceType': 'Procedure',
        'id': f'postnatal-{postnatal.pk}',
        'meta': {
            'versionId': '1',
            'lastUpdated': postnatal.updated_at.isoformat(),
            'source': 'MaterniTrack',
        },
        'status': 'completed',
        'code': {
            'coding': [coding],
            'text': postnatal.get_delivery_type_display(),
        },
        'subject': {
            'reference': f'Patient/{postnatal.patient.pk}',
            'display': postnatal.patient.full_name,
        },
        'performedDateTime': postnatal.delivery_date.isoformat() if postnatal.delivery_date else None,
        'outcome': {
            'text': f"Mother Condition: {postnatal.mother_condition or 'Stable'}. Baby Condition: {postnatal.baby_condition or 'Healthy'}"
        },
        'note': []
    }

    # Custom attributes mapped to extensions
    extensions = []
    if postnatal.baby_weight_kg is not None:
        extensions.append({
            'url': 'urn:maternitrack:extension:baby-weight',
            'valueDecimal': float(postnatal.baby_weight_kg)
        })
    if postnatal.baby_gender:
        extensions.append({
            'url': 'urn:maternitrack:extension:baby-gender',
            'valueCode': postnatal.baby_gender
        })
    if postnatal.apgar_score_1min is not None:
        extensions.append({
            'url': 'urn:maternitrack:extension:apgar-1min',
            'valueInteger': postnatal.apgar_score_1min
        })
    if postnatal.apgar_score_5min is not None:
        extensions.append({
            'url': 'urn:maternitrack:extension:apgar-5min',
            'valueInteger': postnatal.apgar_score_5min
        })

    if extensions:
        fhir_resource['extension'] = extensions

    if postnatal.notes:
        fhir_resource['note'].append({
            'text': postnatal.notes
        })

    return fhir_resource


class FHIRProcedureExportView(APIView):
    """
    Returns a FHIR R4-compliant Procedure resource for a delivery event.
    Reference: https://www.hl7.org/fhir/procedure.html
    """
    permission_classes = [IsAuthenticated, IsAdminOrDoctor]

    def get(self, request, pk):
        try:
            postnatal = PostnatalRecord.objects.get(pk=pk)
        except PostnatalRecord.DoesNotExist:
            return Response({'error': 'Delivery record not found.'}, status=404)

        fhir_resource = serialize_postnatal_to_fhir_procedure(postnatal)
        return Response(fhir_resource)


class FHIRProcedureBundleView(APIView):
    """
    GET /api/core/fhir/procedures/
    Returns a FHIR Bundle containing recent delivery procedures.
    Admin/Doctor only.
    """
    permission_classes = [IsAuthenticated, IsAdminOrDoctor]

    def get(self, request):
        patient_id = request.query_params.get('patient', '')
        records = PostnatalRecord.objects.all()
        if patient_id:
            records = records.filter(patient_id=patient_id)
        
        records = records.select_related('patient')[:100]

        entries = []
        for r in records:
            entries.append({
                'resource': serialize_postnatal_to_fhir_procedure(r),
                'request': {
                    'method': 'GET',
                    'url': f'Procedure/postnatal-{r.pk}',
                },
            })

        bundle = {
            'resourceType': 'Bundle',
            'type': 'searchset',
            'total': len(entries),
            'entry': entries,
        }

        return Response(bundle)


class FHIRMockReceiverView(APIView):
    """
    A mock EHR receiver endpoint that accepts POST requests of FHIR resources.
    """
    permission_classes = []  # Publicly open for easy mock testing

    def post(self, request):
        resource = request.data
        resource_type = resource.get('resourceType', 'Unknown')
        resource_id = resource.get('id', 'new')
        print(f"[EHR Mock Receiver] Received FHIR R4 {resource_type} (ID: {resource_id})")
        return Response({
            'status': 'created',
            'message': f'Successfully received {resource_type} resource.',
            'id': resource_id
        }, status=201)
