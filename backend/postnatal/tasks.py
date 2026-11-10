import logging
import requests
from django.conf import settings
from postnatal.models import PostnatalRecord
from core.fhir_views import serialize_postnatal_to_fhir_procedure

logger = logging.getLogger(__name__)

try:
    from celery import shared_task

    @shared_task(bind=True, max_retries=3, default_retry_delay=60)
    def push_postnatal_record_to_ehr_task(self, record_id):
        """
        Asynchronously formats a delivery record into a FHIR R4 Procedure resource
        and pushes it to a central EHR REST API endpoint.
        """
        try:
            record = PostnatalRecord.objects.select_related('patient').get(pk=record_id)
        except PostnatalRecord.DoesNotExist:
            logger.warning(f"[FHIR] PostnatalRecord {record_id} not found - skipping EHR push.")
            return

        url = getattr(settings, 'EXTERNAL_EHR_FHIR_URL', None)
        if not url:
            logger.info("[FHIR] EXTERNAL_EHR_FHIR_URL is not configured - skipping EHR push.")
            return

        payload = serialize_postnatal_to_fhir_procedure(record)
        headers = {'Content-Type': 'application/fhir+json'}

        logger.info(f"[FHIR] Attempting to push delivery record {record.id} to central EHR: {url}")
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            if response.status_code in [200, 201]:
                logger.info(f"[FHIR] Successfully pushed delivery record for patient {record.patient.id} to central EHR.")
            else:
                logger.error(f"[FHIR] Failed to push to central EHR: {response.status_code} - {response.text}")
                # Retry for 5xx server errors or timeouts
                if response.status_code >= 500:
                    raise self.retry(exc=Exception(f"EHR server error {response.status_code}"))
        except requests.RequestException as exc:
            logger.error(f"[FHIR] Network error pushing to central EHR: {str(exc)}")
            raise self.retry(exc=exc)

except ImportError:
    logger.info('[FHIR] Celery not available - asynchronous EHR push task disabled.')

    class PushPostnatalRecordToEHRTaskFallback:
        def __call__(self, record_id):
            self.run(record_id)

        def delay(self, record_id):
            self.run(record_id)

        def run(self, record_id):
            """Fallback synchronous push logic when Celery is not active."""
            try:
                record = PostnatalRecord.objects.select_related('patient').get(pk=record_id)
            except PostnatalRecord.DoesNotExist:
                return
            url = getattr(settings, 'EXTERNAL_EHR_FHIR_URL', None)
            if not url:
                return
            payload = serialize_postnatal_to_fhir_procedure(record)
            try:
                requests.post(url, json=payload, headers={'Content-Type': 'application/fhir+json'}, timeout=5)
            except Exception as e:
                logger.error(f"[FHIR Sync Fallback] EHR push error: {str(e)}")

    push_postnatal_record_to_ehr_task = PushPostnatalRecordToEHRTaskFallback()
