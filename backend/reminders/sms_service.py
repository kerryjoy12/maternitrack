import africastalking
from django.conf import settings


def _get_sms():
    """Initialize Africa's Talking SDK and return the SMS service."""
    africastalking.initialize(
        username=settings.AT_USERNAME,
        api_key=settings.AT_API_KEY,
    )
    return africastalking.SMS


def send_sms(phone_number: str, message: str) -> dict:
    """
    Send SMS via Africa's Talking.
    Returns dict with keys: success (bool), error (str, optional).
    """
    try:
        sms = _get_sms()
        kwargs = {}
        if settings.AT_SENDER_ID and settings.AT_USERNAME != 'sandbox':
            kwargs['sender_id'] = settings.AT_SENDER_ID

        response = sms.send(message, [phone_number], **kwargs)

        msg_data = response.get('SMSMessageData', {})
        recipients = msg_data.get('Recipients', [])

        if recipients:
            status = recipients[0].get('status', 'Unknown')
            if status == 'Success':
                return {'success': True, 'response': response}
            return {'success': False, 'error': status, 'response': response}

        api_message = msg_data.get('Message', 'No recipients in response')
        return {'success': False, 'error': api_message, 'raw_response': response}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def build_appointment_reminder(
    patient_name: str,
    appointment_date: str,
    appointment_time: str = None,
    facility_name: str = 'Itierio Nursing Home',
    lang: str = 'en',
) -> str:
    if lang == 'sw':
        time_str = f' saa {appointment_time}' if appointment_time else ''
        return (
            f'Mpendwa {patient_name}, miadi yako ya ANC katika {facility_name} '
            f'imeratibiwa kufanyika tarehe {appointment_date}{time_str}. '
            f'Tafadhali hudhuria. Kwa maswali tupigie. Asante.'
        )
    else:
        time_str = f' at {appointment_time}' if appointment_time else ''
        return (
            f'Dear {patient_name}, your ANC appointment at {facility_name} '
            f'is scheduled for {appointment_date}{time_str}. '
            f'Please attend. For queries call us. Thank you.'
        )


def build_postnatal_reminder(
    patient_name: str,
    review_type: str,
    review_date: str,
    facility_name: str = 'Itierio Nursing Home',
    lang: str = 'en',
) -> str:
    if lang == 'sw':
        return (
            f'Mpendwa {patient_name}, uchunguzi wako wa postnatal ({review_type}) katika {facility_name} '
            f'unatarajiwa tarehe {review_date}. Tafadhali hakikisha unahudhuria. Asante.'
        )
    else:
        return (
            f'Dear {patient_name}, your {review_type} postnatal review at {facility_name} '
            f'is due on {review_date}. Please ensure you attend. Thank you.'
        )
