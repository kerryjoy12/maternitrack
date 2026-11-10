from alerts.models import ClinicalAlert
from datetime import date

def evaluate_anc_visit_cds(visit):
    """
    Evaluates clinical parameters recorded during an ANC Visit and generates/updates
    ClinicalAlert records for healthcare workers according to WHO ANC standards.
    Returns a list of generated alert instances.
    """
    patient = visit.patient
    pregnancy = visit.pregnancy or patient.active_pregnancy
    generated_alerts = []

    # 1. Anaemia Alert (Hb < 10 g/dL)
    if visit.hemoglobin_gdl is not None:
        hb = float(visit.hemoglobin_gdl)
        if hb < 10.0:
            severity = ClinicalAlert.Severity.CRITICAL if hb < 7.0 else ClinicalAlert.Severity.WARNING
            alert, created = ClinicalAlert.objects.get_or_create(
                patient=patient,
                alert_type=ClinicalAlert.AlertType.ANEMIA_ALERT,
                acknowledged=False,
                defaults={
                    'severity': severity,
                    'value_triggered': f"{hb} g/dL",
                    'threshold': "< 10.0 g/dL",
                    'message': f"Anaemia detected (Hb {hb} g/dL). Severity: {visit.get_anemia_severity_display() or 'Severe' if hb < 7.0 else 'Moderate'}. Iron/Folic Acid supplementation or transfusion evaluation recommended."
                }
            )
            generated_alerts.append(alert)

    # 2. Possible Pre-eclampsia Alert (BP Systolic >= 140 or Diastolic >= 90)
    if visit.bp_systolic is not None and visit.bp_diastolic is not None:
        sys_bp = visit.bp_systolic
        dia_bp = visit.bp_diastolic
        if sys_bp >= 140 or dia_bp >= 90:
            severity = ClinicalAlert.Severity.CRITICAL if (sys_bp >= 160 or dia_bp >= 110) else ClinicalAlert.Severity.WARNING
            alert, created = ClinicalAlert.objects.get_or_create(
                patient=patient,
                alert_type=ClinicalAlert.AlertType.PRE_ECLAMPSIA_ALERT,
                acknowledged=False,
                defaults={
                    'severity': severity,
                    'value_triggered': f"{sys_bp}/{dia_bp} mmHg",
                    'threshold': ">= 140/90 mmHg",
                    'message': f"Elevated blood pressure ({sys_bp}/{dia_bp} mmHg). Possible Pre-eclampsia risk. Check urine protein and screen for pre-eclampsia symptoms (headache, epigastric pain, visual disturbance)."
                }
            )
            generated_alerts.append(alert)

    # 3. HIV Positive / Reactive Alert
    if visit.hiv_status in ['REACTIVE', 'POSITIVE']:
        alert, created = ClinicalAlert.objects.get_or_create(
            patient=patient,
            alert_type=ClinicalAlert.AlertType.HIV_POSITIVE_ALERT,
            acknowledged=False,
            defaults={
                'severity': ClinicalAlert.Severity.CRITICAL,
                'value_triggered': visit.get_hiv_status_display(),
                'threshold': "Reactive / Positive",
                'message': "HIV Reactive outcome. Recommend immediate ART enrollment, partner notification, and PMTCT protocol initiation."
            }
        )
        generated_alerts.append(alert)

    # 4. TB Positive Screening Outcome Alert
    if visit.tb_screening_outcome == 'POSITIVE':
        alert, created = ClinicalAlert.objects.get_or_create(
            patient=patient,
            alert_type=ClinicalAlert.AlertType.TB_POSITIVE_ALERT,
            acknowledged=False,
            defaults={
                'severity': ClinicalAlert.Severity.CRITICAL,
                'value_triggered': "Positive Screening",
                'threshold': "Intensive Case Finding Positive",
                'message': "TB screening positive. Refer for diagnostic sputum/X-ray evaluation immediately and isolate/mask as appropriate."
            }
        )
        generated_alerts.append(alert)

    # 5. Syphilis Reactive Alert
    if visit.syphilis_status in ['REACTIVE', 'POSITIVE']:
        alert, created = ClinicalAlert.objects.get_or_create(
            patient=patient,
            alert_type=ClinicalAlert.AlertType.SYPHILIS_POSITIVE_ALERT,
            acknowledged=False,
            defaults={
                'severity': ClinicalAlert.Severity.CRITICAL,
                'value_triggered': visit.get_syphilis_status_display(),
                'threshold': "Reactive",
                'message': "Syphilis test Reactive. Administer Benzathine Penicillin treatment and arrange partner screening."
            }
        )
        generated_alerts.append(alert)

    # 6. Post-term Pregnancy Alert (> 41 weeks)
    weeks = visit.gestational_age_weeks
    if weeks is None and pregnancy and pregnancy.weeks_pregnant:
        weeks = pregnancy.weeks_pregnant
    
    if weeks and weeks >= 41:
        alert, created = ClinicalAlert.objects.get_or_create(
            patient=patient,
            alert_type=ClinicalAlert.AlertType.POST_TERM_ALERT,
            acknowledged=False,
            defaults={
                'severity': ClinicalAlert.Severity.WARNING if weeks == 41 else ClinicalAlert.Severity.CRITICAL,
                'value_triggered': f"{weeks} weeks",
                'threshold': ">= 41 weeks",
                'message': f"Post-term pregnancy ({weeks} weeks gestation). Evaluate fetal wellbeing, biophysical profile, and consider induction of labour."
            }
        )
        generated_alerts.append(alert)

    return generated_alerts
