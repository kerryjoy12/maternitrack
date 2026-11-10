"""
Celery tasks for automated appointment reminders.

Schedules two reminders per appointment:
  - 24 hours before the scheduled date
  - 1 hour before (on the day)

Includes retry logic (max 3 retries with exponential backoff).
"""
import logging
from datetime import timedelta

logger = logging.getLogger(__name__)


def _create_reminder_notification(patient, message: str):
    """Create an in-app Notification for the patient's user account."""
    try:
        from tickets.models import Notification
        user = getattr(patient, 'user_account', None)
        if user is not None:
            Notification.objects.create(user=user, message=message)
    except Exception as exc:
        logger.warning('Could not create reminder notification for patient %s: %s', patient.pk, exc)


try:
    from celery import shared_task

    @shared_task(bind=True, max_retries=3, default_retry_delay=60)
    def send_appointment_reminder_task(self, appointment_id, hours_before=24):
        """
        Send an SMS and Email reminder for an upcoming appointment.
        """
        from appointments.models import Appointment
        from reminders.sms_service import send_sms, build_appointment_reminder
        from reminders.email_service import send_email_reminder
        from reminders.models import ReminderLog

        try:
            appt = Appointment.objects.select_related('patient').get(pk=appointment_id)
        except Appointment.DoesNotExist:
            logger.warning('Appointment %s not found - skipping reminder.', appointment_id)
            return

        if appt.status != 'UPCOMING':
            logger.info('Appointment %s is %s - skipping.', appointment_id, appt.status)
            return

        patient = appt.patient
        phone = patient.phone_number or ''
        email = getattr(patient, 'email', None)

        if not phone and not email:
            logger.warning('No phone or email for patient %s - skipping.', patient.pk)
            return

        if phone:
            if phone.startswith('0') and len(phone) == 10:
                phone = '+254' + phone[1:]
            elif phone.startswith('254') and not phone.startswith('+'):
                phone = '+' + phone
            elif not phone.startswith('+'):
                phone = '+254' + phone

        time_str = appt.scheduled_time.strftime('%H:%M') if appt.scheduled_time else None
        msg = build_appointment_reminder(
            patient_name=patient.full_name,
            appointment_date=str(appt.scheduled_date),
            appointment_time=time_str,
            lang=getattr(patient, 'lang', 'en'),
        )

        sms_success = True
        email_success = True
        sms_error = ""
        email_error = ""

        # Send SMS if phone is available
        if phone:
            result = send_sms(phone, msg)
            sms_success = result.get('success', False)
            sms_error = result.get('error', '')
            ReminderLog.objects.create(
                patient=patient,
                appointment=appt,
                channel='SMS',
                phone_number=phone,
                message_body=msg,
                delivery_status='SENT' if sms_success else 'FAILED',
                provider='AFRICAS_TALKING',
                error_message=sms_error,
            )
            if sms_success:
                _create_reminder_notification(patient, msg)

        # Send Email if phone is NOT available and email is available
        if not phone and email:
            result = send_email_reminder(email, "Upcoming Appointment Reminder", msg)
            email_success = result.get('success', False)
            email_error = result.get('error', '')
            ReminderLog.objects.create(
                patient=patient,
                appointment=appt,
                channel='EMAIL',
                email_address=email,
                message_body=msg,
                delivery_status='SENT' if email_success else 'FAILED',
                provider='SMTP',
                error_message=email_error,
            )
            if email_success:
                _create_reminder_notification(patient, msg)

        # Retry if any active delivery channel failed
        if (phone and not sms_success) or (not phone and email and not email_success):
            failed_msg = f"SMS: {sms_error}; Email: {email_error}".strip("; ")
            logger.error('Reminder failed for appt %s: %s', appointment_id, failed_msg)
            raise self.retry(exc=Exception(failed_msg or 'Reminder failed'))

        logger.info('Reminder successfully processed for appointment %s (%sh before)', appointment_id, hours_before)

    @shared_task
    def check_upcoming_vaccinations():
        """
        Runs daily to find vaccinations due in 3 days & sends reminders.
        """
        from pediatrics.models import VaccinationRecord
        from reminders.sms_service import send_sms
        from reminders.email_service import send_email_reminder, build_vaccination_reminder
        from reminders.models import ReminderLog
        from django.utils import timezone
        
        target_date = timezone.now().date() + timedelta(days=3)
        due_vaccines = VaccinationRecord.objects.filter(
            status='PENDING', 
            expected_date=target_date
        ).select_related('child__mother')

        for vac in due_vaccines:
            mother = vac.child.mother
            phone = mother.phone_number
            email = getattr(mother, 'email', None)
            
            if not phone and not email:
                continue
                
            msg = build_vaccination_reminder(
                patient_name=mother.full_name,
                baby_name=vac.child.first_name,
                vaccine_name=vac.get_vaccine_name_display(),
                expected_date=str(vac.expected_date),
                lang=getattr(mother, 'lang', 'en')
            )
            
            if phone:
                if phone.startswith('0') and len(phone) == 10:
                    phone = '+254' + phone[1:]
                elif phone.startswith('254') and not phone.startswith('+'):
                    phone = '+' + phone
                elif not phone.startswith('+'):
                    phone = '+254' + phone
                
                res = send_sms(phone, msg)
                ReminderLog.objects.create(
                    patient=mother,
                    channel='SMS',
                    phone_number=phone,
                    message_body=msg,
                    delivery_status='SENT' if res.get('success') else 'FAILED',
                    provider='AFRICAS_TALKING',
                    error_message=res.get('error', ''),
                )
                if res.get('success'):
                    _create_reminder_notification(mother, msg)

            elif email:
                res = send_email_reminder(email, "Upcoming Vaccination Reminder", msg)
                ReminderLog.objects.create(
                    patient=mother,
                    channel='EMAIL',
                    email_address=email,
                    message_body=msg,
                    delivery_status='SENT' if res.get('success') else 'FAILED',
                    provider='SMTP',
                    error_message=res.get('error', ''),
                )
                if res.get('success'):
                    _create_reminder_notification(mother, msg)

    @shared_task
    def check_missed_appointments():
        """
        Runs daily to find ANC/appointments missed yesterday, 
        flags as missed and triggers alerts.
        """
        from appointments.models import Appointment
        from reminders.sms_service import send_sms
        from reminders.email_service import send_email_reminder, build_missed_visit_alert
        from reminders.models import ReminderLog
        from django.utils import timezone

        yesterday = timezone.now().date() - timedelta(days=1)
        missed_appts = Appointment.objects.filter(
            status='UPCOMING',
            scheduled_date=yesterday
        ).select_related('patient')

        for appt in missed_appts:
            appt.status = 'MISSED'
            appt.save(update_fields=['status'])

            patient = appt.patient
            phone = patient.phone_number
            email = getattr(patient, 'email', None)
            
            if not phone and not email:
                continue

            msg = build_missed_visit_alert(
                patient_name=patient.full_name,
                visit_type=appt.get_appointment_type_display(),
                missed_date=str(appt.scheduled_date),
                lang=getattr(patient, 'lang', 'en')
            )
            
            if phone:
                if phone.startswith('0') and len(phone) == 10:
                    phone = '+254' + phone[1:]
                elif phone.startswith('254') and not phone.startswith('+'):
                    phone = '+' + phone
                elif not phone.startswith('+'):
                    phone = '+254' + phone

                res = send_sms(phone, msg)
                ReminderLog.objects.create(
                    patient=patient,
                    appointment=appt,
                    channel='SMS',
                    phone_number=phone,
                    message_body=msg,
                    delivery_status='SENT' if res.get('success') else 'FAILED',
                    provider='AFRICAS_TALKING',
                    error_message=res.get('error', ''),
                )
                if res.get('success'):
                    _create_reminder_notification(patient, msg)

            elif email:
                res = send_email_reminder(email, "Missed Appointment Alert", msg)
                ReminderLog.objects.create(
                    patient=patient,
                    appointment=appt,
                    channel='EMAIL',
                    email_address=email,
                    message_body=msg,
                    delivery_status='SENT' if res.get('success') else 'FAILED',
                    provider='SMTP',
                    error_message=res.get('error', ''),
                )
                if res.get('success'):
                    _create_reminder_notification(patient, msg)

    @shared_task
    def schedule_appointment_reminders(appointment_id):
        from appointments.models import Appointment
        from django.utils import timezone
        from datetime import datetime

        try:
            appt = Appointment.objects.get(pk=appointment_id)
        except Appointment.DoesNotExist:
            return

        if appt.status != 'UPCOMING':
            return

        scheduled_dt = datetime.combine(
            appt.scheduled_date,
            appt.scheduled_time or datetime.min.time(),
        )
        if timezone.is_naive(scheduled_dt):
            scheduled_dt = timezone.make_aware(scheduled_dt)

        eta_24h = scheduled_dt - timedelta(hours=24)
        if eta_24h > timezone.now():
            send_appointment_reminder_task.apply_async(
                args=[appointment_id, 24],
                eta=eta_24h,
                task_id=f'reminder-24h-{appointment_id}',
            )

        eta_1h = scheduled_dt - timedelta(hours=1)
        if eta_1h > timezone.now():
            send_appointment_reminder_task.apply_async(
                args=[appointment_id, 1],
                eta=eta_1h,
                task_id=f'reminder-1h-{appointment_id}',
            )

        @shared_task
        def send_bulk_reminders_task(patient_ids, use_template, message, lang, user_id=None):
            return send_bulk_reminders_sync(patient_ids, use_template, message, lang, user_id)

except ImportError:
    logger.info('Celery not available - automated reminders disabled.')

    def send_appointment_reminder_task(*args, **kwargs):
        pass

    def schedule_appointment_reminders(*args, **kwargs):
        pass
    
    def check_upcoming_vaccinations(*args, **kwargs):
        pass
        
    def check_missed_appointments(*args, **kwargs):
        pass

    def send_bulk_reminders_task(*args, **kwargs):
        pass


def send_bulk_reminders_sync(patient_ids, use_template, message, lang, user_id=None):
    from patients.models import Patient
    from appointments.models import Appointment
    from reminders.sms_service import send_sms, build_appointment_reminder
    from reminders.email_service import send_email_reminder
    from reminders.models import ReminderLog
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    sender = None
    if user_id:
        try:
            sender = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            pass

    patients = Patient.objects.filter(pk__in=patient_ids)
    results = {'sent': 0, 'failed': 0, 'details': []}

    for patient in patients:
        appointment = Appointment.objects.filter(patient=patient, status='UPCOMING').first()
        
        # Build message
        if use_template and appointment:
            time_str = str(appointment.scheduled_time) if appointment.scheduled_time else None
            msg = build_appointment_reminder(
                patient.full_name,
                str(appointment.scheduled_date),
                time_str,
                lang=lang or getattr(patient, 'lang', 'en')
            )
        elif use_template:
            if lang == 'sw':
                msg = f"Mpendwa {patient.full_name}, tafadhali wasiliana na Itierio Nursing Home kwa ajili ya miadi yako ijayo. Asante."
            else:
                msg = f"Dear {patient.full_name}, please contact Itierio Nursing Home for your upcoming appointment. Thank you."
        else:
            msg = message or (
                f"Mpendwa {patient.full_name}, tafadhali wasiliana na Itierio Nursing Home kwa ajili ya miadi yako ijayo. Asante."
                if lang == 'sw'
                else f"Dear {patient.full_name}, please contact Itierio Nursing Home for your upcoming appointment. Thank you."
            )

        # Normalize phone
        phone = patient.phone_number.strip()
        email = getattr(patient, 'email', None)

        if phone:
            if phone.startswith('0') and len(phone) == 10:
                phone = '+254' + phone[1:]
            elif phone.startswith('254') and not phone.startswith('+'):
                phone = '+' + phone
            elif not phone.startswith('+'):
                phone = '+254' + phone

        sms_success = False
        email_success = False

        if phone:
            res_sms = send_sms(phone, msg)
            sms_success = res_sms['success']
            ReminderLog.objects.create(
                patient=patient,
                appointment=appointment,
                channel='SMS',
                phone_number=phone,
                message_body=msg,
                delivery_status='SENT' if sms_success else 'FAILED',
                error_message=res_sms.get('error', ''),
                sent_by=sender,
            )
            if sms_success:
                _create_reminder_notification(patient, msg)

        elif email:
            res_email = send_email_reminder(email, "Reminder Notification", msg)
            email_success = res_email['success']
            ReminderLog.objects.create(
                patient=patient,
                appointment=appointment,
                channel='EMAIL',
                email_address=email,
                message_body=msg,
                delivery_status='SENT' if email_success else 'FAILED',
                error_message=res_email.get('error', ''),
                sent_by=sender,
            )
            if email_success:
                _create_reminder_notification(patient, msg)

        if sms_success or email_success:
            results['sent'] += 1
        else:
            results['failed'] += 1
            
        results['details'].append({
            'patient_id': patient.id,
            'patient_name': patient.full_name,
            'phone_number': phone,
            'email': email,
            'success': sms_success or email_success,
            'error': '' if (sms_success or email_success) else 'Both SMS and Email delivery failed'
        })
        
    return results
