import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)

def send_email_reminder(email_address: str, subject: str, message: str) -> dict:
    """
    Send an email reminder via Django's SMTP backend.
    """
    try:
        sent_count = send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@perinatal360.com',
            recipient_list=[email_address],
            fail_silently=False,
        )
        if sent_count > 0:
            return {'success': True, 'response': 'Email sent successfully'}
        else:
            return {'success': False, 'error': 'Failed to send email'}
    except Exception as e:
        logger.error("Failed to send email to %s: %s", email_address, e)
        return {'success': False, 'error': str(e)}

def build_vaccination_reminder(patient_name: str, baby_name: str, vaccine_name: str, expected_date: str, lang: str = 'en') -> str:
    if lang == 'sw':
        return (
            f"Mpendwa {patient_name}, "
            f"Mwanao {baby_name or 'mtoto'} anapaswa kupata chanjo ya {vaccine_name} tarehe {expected_date}. "
            f"Tafadhali tembelea kliniki ili kuhakikisha mtoto wako analindwa. Asante."
        )
    return (
        f"Dear {patient_name}, "
        f"Your baby {baby_name or 'the baby'} is due for the {vaccine_name} vaccination on {expected_date}. "
        f"Please visit the clinic to ensure your child stays protected."
    )

def build_missed_visit_alert(patient_name: str, visit_type: str, missed_date: str, lang: str = 'en') -> str:
    if lang == 'sw':
        return (
            f"KWA HARAKA: Mpendwa {patient_name}, ulikosa miadi yako ya {visit_type} tarehe {missed_date}. "
            f"Ni muhimu kwa afya yako na ya mwanao kuhudhuria miadi hii. "
            f"Tafadhali wasiliana nasi mara moja ili kupanga tarehe nyingine. Asante."
        )
    return (
        f"URGENT: Dear {patient_name}, you missed your scheduled {visit_type} on {missed_date}. "
        f"It is important for your health and your baby's health to attend these visits. "
        f"Please contact us immediately to reschedule."
    )