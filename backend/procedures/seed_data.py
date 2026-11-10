"""
Seed data for emergency protocols and procedures.
Based on WHO and Kenya MoH maternity guidelines.

Call via:
    python manage.py shell -c "from procedures.seed_data import seed_all; seed_all()"
"""
import logging
from .models import (
    ClinicalProcedure, ProcedureStep, EmergencyProtocol,
    EmergencyDrug,
)

logger = logging.getLogger(__name__)


def seed_all():
    """Seed procedures and emergencies."""
    seed_procedures()
    seed_emergencies()
    logger.info('All procedure and emergency data seeded.')


def seed_procedures():
    if ClinicalProcedure.objects.exists():
        logger.info('Procedures already seeded.')
        return

    procedures = [
        {
            'category': 'NORMAL_DELIVERY', 'title': 'Normal Vaginal Delivery (Standard)', 'icon': '👶',
            'summary': 'Comprehensive protocol for managing normal delivery including preparation, the three stages of labour, and immediate newborn care.',
            'severity': 'ROUTINE',
            'steps': [
                ('Preparation', 'Ensure delivery room is clean. Prepare delivery kit, sterile gloves, warm towels, and newborn resuscitation equipment. Confirm patient vitals and identify any risks.', 'Sterility is critical to prevent sepsis'),
                ('First Stage Monitoring', 'Monitor cervical dilation, FHR every 30 minutes, maternal BP and pulse hourly. Encourage hydration and upright positions. Update partograph regularly.', 'Escalate if fetal distress or prolonged labour identified'),
                ('Second Stage Delivery', 'Guide controlled pushing with contractions. Support perineum to prevent tears. Deliver head gently. Check for nuchal cord. Deliver body slowly.', 'Avoid fundal pressure'),
                ('Third Stage — AMTSL', 'Administer 10 IU Oxytocin IM. Perform controlled cord traction with uterine counter-traction. Deliver placenta. Massage fundus.', 'Active Management of Third Stage of Labour (AMTSL) prevents PPH'),
                ('Immediate Newborn Care', 'Dry baby immediately. Place skin-to-skin. Clamp cord after 1-3 min. Initiate breastfeeding within 1 hour. APGAR at 1 and 5 minutes.', 'Keep the baby warm'),
                ('Postpartum Monitoring', 'Monitor BP, pulse, and uterine tone every 15 mins for 2 hours. Inspect for tears and repair if necessary. Ensure the mother voids.', 'Most PPH occurs within 2 hours of delivery'),
            ],
        },
        {
            'category': 'CAESAREAN', 'title': 'Pre-operative C-Section Checklist', 'icon': '🏥',
            'summary': 'Standard nursing preparation and checklist for patients undergoing caesarean section.',
            'severity': 'URGENT',
            'steps': [
                ('Documentation', 'Verify surgical consent. Ensure blood is cross-matched. Check latest Hb and platelet levels.', 'Ensure consent is informed'),
                ('Patient Prep', 'Maintain NPO status. Establish two large-bore IV lines. Shave surgical site. Insert indwelling urinary catheter.', ''),
                ('Medication', 'Administer prescribed pre-op antibiotics and antacids. Confirm drug allergies.', 'Antibiotics should be given 30-60 mins before incision'),
                ('Theatre Transfer', 'Ensure newborn resuscitation kit is ready. Transfer to theatre with complete clinical records.', 'Time is of the essence in emergency sections'),
            ],
        },
        {
            'category': 'POSTNATAL_CARE', 'title': 'Postnatal 7-Day Review Protocol', 'icon': '👩‍🍼',
            'summary': 'Clinical steps for the first mandatory postnatal checkup at 7 days.',
            'severity': 'ROUTINE',
            'steps': [
                ('Maternal Assessment', 'Check BP and pulse. Assess uterine involution and lochia. Inspect perineum/surgical wound for infection. Assess breastfeeding progress.', 'Watch for signs of puerperal sepsis or PPH'),
                ('Mental Health', 'Screen for postpartum depression or "baby blues". Assess mother-infant bonding and support systems.', 'Early detection of maternal mental health issues is critical'),
                ('Infant Assessment', 'Check for jaundice, cord infection, or feeding difficulties. Verify weight gain. Confirm BCG/OPV0 vaccinations were given.', 'Cord must be kept dry and clean'),
                ('Family Planning', 'Counsel on postpartum family planning methods and birth spacing.', 'Recommend at least 24 months between pregnancies'),
            ],
        },
    ]

    for p_data in procedures:
        steps_data = p_data.pop('steps')
        proc = ClinicalProcedure.objects.create(**p_data)
        for i, (title, desc, warn) in enumerate(steps_data):
            ProcedureStep.objects.create(
                procedure=proc, step_number=i+1,
                title=title, description=desc, warning_note=warn
            )


def seed_emergencies():
    if EmergencyProtocol.objects.exists():
        logger.info('Emergency protocols already seeded.')
        return

    emergencies = [
        {
            'emergency_type': 'PPH',
            'title': 'Postpartum Hemorrhage (PPH) Management',
            'icon': '🩸',
            'danger_signs': '• Visible blood loss >500ml (vaginal) or >1000ml (C-section)\n• Boggy, soft uterus\n• Rapid pulse (>100 bpm)\n• Falling BP (<90/60 mmHg)\n• Altered consciousness',
            'immediate_response': '1. CALL FOR HELP immediately.\n2. Massage the uterus to stimulate contraction.\n3. Establish 2 large-bore IV lines (16G/18G).\n4. Administer 10 IU Oxytocin IM and 20-40 IU in 1L IV fluids at 60 drops/min.\n5. Empty bladder using a catheter.\n6. Administer TXA 1g IV slowly.\n7. Prepare for aortic compression or manual removal of placenta if necessary.',
            'escalation_steps': '• If medical management fails in 30 mins, transfer to theatre.\n• Consider uterine balloon tamponade.\n• Arrange for blood transfusion (O-negative if cross-match not ready).\n• Prepare for laparotomy / B-Lynch suture / Hysterectomy.',
            'monitoring_requirements': '• Vitals every 5-15 mins.\n• Continuous pulse oximetry.\n• Accurate blood loss measurement (weigh pads).\n• Hourly urine output.',
            'drugs': [
                ('Oxytocin', '10 IU IM and 20-40 IU in 1L IV', 'IV/IM', 'Continuous/Stat', '60 IU total', 'First line drug for PPH'),
                ('Misoprostol', '800 mcg', 'Sublingual/Rectal', 'Single dose', '800 mcg', 'Use if Oxytocin is unavailable or ineffective'),
                ('Tranexamic Acid (TXA)', '1g (10ml of 100mg/ml)', 'IV', 'Repeat after 30 mins if needed', '2g total', 'Give within 3 hours of birth'),
                ('Ergometrine', '0.2 mg', 'IM', 'Repeat every 15 mins', '1.0 mg', 'DO NOT USE in hypertensive/eclamptic patients'),
            ],
        },
        {
            'emergency_type': 'ECLAMPSIA',
            'title': 'Eclampsia & Severe Pre-eclampsia',
            'icon': '⚡',
            'danger_signs': '• Seizures / Convulsions\n• Severe headache / Visual disturbances\n• BP ≥ 160/110 mmHg\n• Epigastric pain\n• Hyperreflexia',
            'immediate_response': '1. Protect airway (Recovery position). Do not restrain.\n2. Give Magnesium Sulphate (MgSO4) Loading Dose: 4g IV (over 20 min) + 10g IM (5g in each buttock).\n3. Administer Antihypertensives: Nifedipine 10mg orally (not sublingual).\n4. Insert urinary catheter to monitor output.',
            'escalation_steps': '• If recurrent seizures: Give 2g MgSO4 IV over 5 mins.\n• Stabilize and deliver within 24 hours.\n• Monitor for MgSO4 toxicity (decreased RR, loss of reflexes).',
            'monitoring_requirements': '• BP every 15 mins.\n• Respiratory rate (>16 required).\n• Patellar reflexes.\n• Urine output (>25ml/hr).',
            'drugs': [
                ('Magnesium Sulphate', '4g IV + 10g IM loading', 'IV/IM', 'Maintenance 5g IM every 4h', '40g / 24h', 'Antidote: Calcium Gluconate'),
                ('Nifedipine', '10 mg', 'Oral', 'Every 30 mins until BP stabilizes', '40 mg', 'Avoid if pulse >110'),
                ('Hydralazine', '5 mg slow IV', 'IV', 'Every 20 mins', '20 mg', 'First line if oral not possible'),
            ],
        },
        {
            'emergency_type': 'CORD_PROLAPSE',
            'title': 'Umbilical Cord Prolapse',
            'icon': '🎗️',
            'danger_signs': '• Cord visible or palpable in vagina\n• Sudden fetal bradycardia after rupture of membranes',
            'immediate_response': '1. CALL FOR HELP and prepare for immediate C-Section.\n2. Position mother in knee-chest or exaggerated Sims position.\n3. Manually displace presenting part upward to relieve pressure on the cord.\n4. Do NOT push the cord back into the uterus.\n5. Wrap cord in warm sterile saline gauze if external.',
            'escalation_steps': '• Immediate delivery is the only definitive treatment.\n• If fully dilated: Assisted vaginal delivery.\n• If not fully dilated: Category 1 Emergency C-Section.',
            'monitoring_requirements': '• Continuous Fetal Heart Rate monitoring.\n• Maternal vitals every 15 mins.',
            'drugs': [
                ('Terbutaline', '0.25 mg', 'SC', 'Single dose', '', 'To reduce contractions and pressure on cord'),
            ],
        },
        {
            'emergency_type': 'SHOULDER_DYSTOCIA',
            'title': 'Shoulder Dystocia Management',
            'icon': '🆘',
            'danger_signs': '• "Turtle sign" (head retracts against perineum)\n• Failure of restitution\n• Failure of shoulders to deliver with standard traction',
            'immediate_response': '1. CALL FOR HELP (Senior midwife, Obstetrician, Pediatrician).\n2. Stop maternal pushing.\n3. McRoberts Maneuver: Hyperflex mother\'s legs against abdomen.\n4. Apply Suprapubic Pressure (NOT fundal pressure).\n5. Consider Episiotomy to allow more room for internal maneuvers.',
            'escalation_steps': '• Internal rotation (Rubin/Woods screw maneuver).\n• Delivery of posterior arm.\n• Gaskin Position (all-fours).\n• Last resort: Zavanelli maneuver or symphysiotomy.',
            'monitoring_requirements': '• Document timing of head delivery and all maneuvers.\n• Pediatrician must assess baby for brachial plexus injury or fracture.',
            'drugs': [],
        },
        {
            'emergency_type': 'NEONATAL_RESUS',
            'title': 'Neonatal Resuscitation Protocol',
            'icon': '👶',
            'danger_signs': '• No breathing or gasping at birth\n• Heart rate <100 bpm\n• Poor muscle tone (floppy)',
            'immediate_response': '1. DRY and STIMULATE the baby.\n2. POSITION the head in "sniffing" position.\n3. SUCTION if airway obstructed by meconium or secretions.\n4. If HR <100 or not breathing: START positive pressure ventilation (BMV) within "The Golden Minute".\n5. Ventilate at 40-60 breaths/min.',
            'escalation_steps': '• If HR <60 bpm after 30s of effective ventilation, start chest compressions.\n• 3 compressions : 1 breath.\n• Administer Epinephrine if HR remains <60 bpm.',
            'monitoring_requirements': '• Heart rate (umbilical pulse or auscultation).\n• Oxygen saturation (Pre-ductal - right hand).\n• APGAR at 1, 5, 10 mins.',
            'drugs': [
                ('Epinephrine', '0.1-0.3 ml/kg of 1:10,000', 'IV/Endotracheal', 'Every 3-5 mins', '', 'Use for persistent bradycardia'),
                ('Normal Saline', '10 ml/kg', 'IV', 'Slow bolus', '', 'Use for suspected hypovolemia'),
            ],
        },
        {
            'emergency_type': 'OBSTRUCTED_LABOUR',
            'title': 'Obstructed Labour Management',
            'icon': '🚧',
            'danger_signs': '• Partograph crosses Action Line\n• Bandl\'s ring (visible uterine indentation)\n• Maternal exhaustion and dehydration\n• Distended bladder',
            'immediate_response': '1. Establish IV line and rehydrate with Normal Saline.\n2. Administer broad-spectrum antibiotics.\n3. Empty bladder with catheter.\n4. Prepare for immediate C-Section.',
            'escalation_steps': '• Obstetric consultation immediately.\n• Monitor for signs of uterine rupture (sudden cessation of contractions, abdominal pain).',
            'monitoring_requirements': '• Maternal BP, Pulse, Temperature.\n• Fetal Heart Rate.',
            'drugs': [
                ('Ampicillin', '2g', 'IV', 'Every 6 hours', '', 'Broad-spectrum cover'),
                ('Gentamicin', '5mg/kg', 'IV', 'Once daily', '', 'For gram-negative cover'),
            ],
        },
    ]

    for e_data in emergencies:
        drugs_data = e_data.pop('drugs', [])
        proto = EmergencyProtocol.objects.create(**e_data)
        for i, (name, dose, route, freq, max_d, notes) in enumerate(drugs_data):
            EmergencyDrug.objects.create(
                protocol=proto, drug_name=name, dosage=dose,
                route=route, frequency=freq, max_dose=max_d,
                important_notes=notes, sort_order=i,
            )

    logger.info('Seeded %d emergency protocols.', len(emergencies))
