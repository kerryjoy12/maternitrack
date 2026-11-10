"""
PDF export views for partograph reports.

Uses Django's template engine to render HTML, then converts to PDF
via WeasyPrint (if installed) or falls back to an HTML response.
"""
from django.http import HttpResponse
from django.template.loader import render_to_string
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from patients.models import Patient, PartographEntry
import logging

logger = logging.getLogger(__name__)


class PartographPDFView(APIView):
    """
    GET /api/patients/{pk}/partograph/pdf/

    Generates a printable PDF of the partograph observations.
    Falls back to HTML if WeasyPrint is not installed.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            patient = Patient.objects.get(pk=pk)
        except Patient.DoesNotExist:
            return Response({'error': 'Patient not found.'}, status=404)

        entries = PartographEntry.objects.filter(
            patient=patient
        ).order_by('hours_in_labour')

        context = {
            'patient': patient,
            'entries': entries,
            'facility_name': 'Itierio Nursing Home',
            'generated_by': request.user.full_name if request.user else 'System',
            'generated_at': __import__('django.utils.timezone', fromlist=['now']).now(),
        }

        html_content = render_to_string('partograph_report.html', context)

        # Try WeasyPrint for PDF
        try:
            from weasyprint import HTML
            pdf_bytes = HTML(string=html_content).write_pdf()
            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            response['Content-Disposition'] = (
                f'inline; filename="partograph_{patient.patient_number}.pdf"'
            )
            return response
        except ImportError:
            logger.info('WeasyPrint not installed — returning HTML report.')
            return HttpResponse(html_content, content_type='text/html')
