import logging
from datetime import date, timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from patients.models import Patient
from appointments.models import Appointment
from postnatal.models import PostnatalRecord
from patients.serializers import PatientListSerializer
from appointments.serializers import AppointmentSerializer

logger = logging.getLogger(__name__)


def safe_format_period(val, date_format):
    if not val:
        return ''
    if hasattr(val, 'strftime'):
        return val.strftime(date_format)
    if isinstance(val, str):
        try:
            from datetime import datetime
            return datetime.fromisoformat(val.split('T')[0]).strftime(date_format)
        except Exception:
            return str(val)
    return str(val)


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        week_from_now = today + timedelta(days=7)

        try:
            total_patients = Patient.objects.filter(is_active=True).count()
            due_this_week = Patient.objects.filter(
                is_active=True, edd__gte=today, edd__lte=week_from_now,
                clinic_stage__in=['ANC1', 'ANC2', 'ANC3', 'ANC4']
            ).count()
            overdue_delivery = Patient.objects.filter(
                is_active=True, edd__lt=today,
                clinic_stage__in=['ANC1', 'ANC2', 'ANC3', 'ANC4']
            ).count()
            missed_appointments = Appointment.objects.filter(status='MISSED').count()
            upcoming_appointments = Appointment.objects.filter(
                status='UPCOMING', scheduled_date__gte=today, scheduled_date__lte=week_from_now
            ).count()
            postnatal_pending_7day = PostnatalRecord.objects.filter(
                review_7day_attended=False, review_7day_date__lte=today
            ).count()
            postnatal_pending_6week = PostnatalRecord.objects.filter(
                review_6week_attended=False, review_6week_date__lte=today
            ).count()
            high_risk = Patient.objects.filter(is_active=True, risk_level='HIGH').count()

            apt_breakdown = {
                'upcoming': Appointment.objects.filter(status='UPCOMING').count(),
                'attended': Appointment.objects.filter(status='ATTENDED').count(),
                'missed': Appointment.objects.filter(status='MISSED').count(),
                'rescheduled': Appointment.objects.filter(status='RESCHEDULED').count(),
            }

            stage_breakdown = {}
            for code, label in Patient.CLINIC_STAGE_CHOICES:
                stage_breakdown[code] = Patient.objects.filter(
                    is_active=True, clinic_stage=code
                ).count()
        except Exception as exc:
            logger.error("Error generating dashboard summary: %s", exc, exc_info=True)
            total_patients = due_this_week = overdue_delivery = missed_appointments = 0
            upcoming_appointments = postnatal_pending_7day = postnatal_pending_6week = high_risk = 0
            apt_breakdown = {'upcoming': 0, 'attended': 0, 'missed': 0, 'rescheduled': 0}
            stage_breakdown = {}

        return Response({
            'kpis': {
                'total_patients': total_patients,
                'due_this_week': due_this_week,
                'overdue_delivery': overdue_delivery,
                'missed_appointments': missed_appointments,
                'upcoming_this_week': upcoming_appointments,
                'postnatal_pending_7day': postnatal_pending_7day,
                'postnatal_pending_6week': postnatal_pending_6week,
                'high_risk_patients': high_risk,
            },
            'appointment_breakdown': apt_breakdown,
            'stage_breakdown': stage_breakdown,
        })


class DueSoonView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        days = int(request.query_params.get('days', 7))
        limit = today + timedelta(days=days)

        try:
            patients = Patient.objects.filter(
                is_active=True,
                edd__gte=today,
                edd__lte=limit,
                clinic_stage__in=['ANC1', 'ANC2', 'ANC3', 'ANC4']
            ).order_by('edd')
            data = PatientListSerializer(patients, many=True).data
        except Exception as exc:
            logger.error("Error getting due soon patients: %s", exc, exc_info=True)
            data = []

        return Response(data)


class OverdueDeliveryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        try:
            patients = Patient.objects.filter(
                is_active=True,
                edd__lt=today,
                clinic_stage__in=['ANC1', 'ANC2', 'ANC3', 'ANC4']
            ).order_by('edd')
            data = PatientListSerializer(patients, many=True).data
        except Exception as exc:
            logger.error("Error getting overdue delivery patients: %s", exc, exc_info=True)
            data = []

        return Response(data)


class RecentActivityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        week_ago = today - timedelta(days=7)

        try:
            recent_registrations = Patient.objects.filter(
                created_at__date__gte=week_ago, is_active=True
            ).order_by('-created_at')[:5]

            recent_appointments = Appointment.objects.filter(
                updated_at__date__gte=week_ago
            ).select_related('patient').order_by('-updated_at')[:10]

            reg_data = PatientListSerializer(recent_registrations, many=True).data
            apt_data = AppointmentSerializer(recent_appointments, many=True).data
        except Exception as exc:
            logger.error("Error fetching recent activity: %s", exc, exc_info=True)
            reg_data = []
            apt_data = []

        return Response({
            'recent_registrations': reg_data,
            'recent_appointments': apt_data,
        })


class TrendsView(APIView):
    """
    GET /api/dashboard/trends/?period=weekly&weeks=12
    Returns time-series data for dashboard trend charts.

    Supported periods: 'weekly' (default) or 'monthly'
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models.functions import TruncWeek, TruncMonth
        from django.db.models import Count

        period = request.query_params.get('period', 'weekly')
        try:
            weeks = int(request.query_params.get('weeks', 12))
        except (ValueError, TypeError):
            weeks = 12

        today = date.today()
        start_date = today - timedelta(weeks=weeks)

        trunc_fn = TruncMonth if period == 'monthly' else TruncWeek
        date_format = '%b %Y' if period == 'monthly' else '%d %b'

        try:
            registrations = (
                Patient.objects.filter(created_at__date__gte=start_date, is_active=True)
                .annotate(period=trunc_fn('created_at'))
                .values('period')
                .annotate(count=Count('id'))
                .order_by('period')
            )

            high_risk_anc = (
                Patient.objects.filter(
                    created_at__date__gte=start_date,
                    is_active=True,
                    risk_level='HIGH',
                    clinic_stage__in=['ANC1', 'ANC2', 'ANC3', 'ANC4'],
                )
                .annotate(period=trunc_fn('created_at'))
                .values('period')
                .annotate(count=Count('id'))
                .order_by('period')
            )

            deliveries = (
                PostnatalRecord.objects.filter(delivery_date__gte=start_date)
                .annotate(period=trunc_fn('delivery_date'))
                .values('period')
                .annotate(count=Count('id'))
                .order_by('period')
            )

            missed = (
                Appointment.objects.filter(
                    scheduled_date__gte=start_date, status='MISSED'
                )
                .annotate(period=trunc_fn('scheduled_date'))
                .values('period')
                .annotate(count=Count('id'))
                .order_by('period')
            )

            reg_map = {safe_format_period(r['period'], date_format): r['count'] for r in registrations if r.get('period')}
            del_map = {safe_format_period(d['period'], date_format): d['count'] for d in deliveries if d.get('period')}
            mis_map = {safe_format_period(m['period'], date_format): m['count'] for m in missed if m.get('period')}
            hr_map = {safe_format_period(h['period'], date_format): h['count'] for h in high_risk_anc if h.get('period')}
        except Exception as exc:
            logger.error("Error generating dashboard trends: %s", exc, exc_info=True)
            reg_map, del_map, mis_map, hr_map = {}, {}, {}, {}
            registrations = deliveries = missed = high_risk_anc = []

        all_keys = []
        if period == 'monthly':
            for i in range(weeks - 1, -1, -1):
                d = today - timedelta(days=i*30)
                lbl = d.strftime(date_format)
                if lbl not in all_keys:
                    all_keys.append(lbl)
        else:
            for i in range(weeks - 1, -1, -1):
                d = today - timedelta(weeks=i)
                lbl = d.strftime(date_format)
                if lbl not in all_keys:
                    all_keys.append(lbl)

        db_keys = set(list(reg_map.keys()) + list(del_map.keys()) + list(mis_map.keys()) + list(hr_map.keys()))
        for k in sorted(db_keys):
            if k and k not in all_keys:
                all_keys.append(k)

        series = [
            {
                'period': k,
                'registrations': reg_map.get(k, 0),
                'deliveries': del_map.get(k, 0),
                'missed_appointments': mis_map.get(k, 0),
                'high_risk_anc': hr_map.get(k, 0),
            }
            for k in all_keys
        ]

        total_reg = sum(r.get('count', 0) for r in registrations)
        total_del = sum(d.get('count', 0) for d in deliveries)
        total_mis = sum(m.get('count', 0) for m in missed)
        total_hr = sum(h.get('count', 0) for h in high_risk_anc)

        return Response({
            'period': period,
            'weeks': weeks,
            'series': series,
            'totals': {
                'registrations': total_reg,
                'deliveries': total_del,
                'missed_appointments': total_mis,
                'high_risk_anc': total_hr,
            },
        })


class PublicStatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            from reminders.models import ReminderLog
            patients_count = Patient.objects.filter(is_active=True).count()
            active_deliveries = Patient.objects.filter(is_active=True, clinic_stage='DELIVERED').count()
            clinic_reminders_sent = ReminderLog.objects.filter(delivery_status='SENT').count()
        except Exception as exc:
            logger.error("Error fetching public stats: %s", exc, exc_info=True)
            patients_count = active_deliveries = clinic_reminders_sent = 0

        return Response({
            'patients_count': patients_count,
            'active_deliveries': active_deliveries,
            'clinic_reminders_sent': clinic_reminders_sent,
        })


class NurseDashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        week_from_now = today + timedelta(days=7)

        try:
            total_patients = Patient.objects.filter(is_active=True).count()
            upcoming_appointments = Appointment.objects.filter(
                status='UPCOMING', scheduled_date__gte=today, scheduled_date__lte=week_from_now
            ).count()
            postnatal_pending_7day = PostnatalRecord.objects.filter(
                review_7day_attended=False, review_7day_date__lte=today
            ).count()
            postnatal_pending_6week = PostnatalRecord.objects.filter(
                review_6week_attended=False, review_6week_date__lte=today
            ).count()

            from reminders.models import ReminderLog
            reminders_sent_today = ReminderLog.objects.filter(
                sent_at__date=today, delivery_status='SENT'
            ).count()

            missed_appointments = Appointment.objects.filter(status='MISSED').count()

            from pediatrics.models import ChildProfile
            total_children = ChildProfile.objects.count()
        except Exception as exc:
            logger.error("Error generating nurse summary: %s", exc, exc_info=True)
            total_patients = upcoming_appointments = postnatal_pending_7day = 0
            postnatal_pending_6week = reminders_sent_today = missed_appointments = total_children = 0

        return Response({
            'total_patients': total_patients,
            'upcoming_appointments': upcoming_appointments,
            'postnatal_pending_7day': postnatal_pending_7day,
            'postnatal_pending_6week': postnatal_pending_6week,
            'reminders_sent_today': reminders_sent_today,
            'missed_appointments': missed_appointments,
            'total_children': total_children,
        })


class DoctorDashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        month_start = today.replace(day=1)

        try:
            high_risk_patients = Patient.objects.filter(is_active=True, risk_level='HIGH').count()

            from tickets.models import Ticket
            unresolved_tickets = Ticket.objects.filter(status='OPEN').count()

            from alerts.models import ClinicalAlert
            critical_alerts = ClinicalAlert.objects.filter(
                severity='CRITICAL', acknowledged=False
            ).count()

            from mortality.models import MaternalDeathReview
            mortality_reviews = MaternalDeathReview.objects.count()

            from procedures.models import ClinicalProcedure
            procedures_this_month = ClinicalProcedure.objects.filter(
                created_at__gte=month_start
            ).count()
        except Exception as exc:
            logger.error("Error generating doctor summary: %s", exc, exc_info=True)
            high_risk_patients = unresolved_tickets = critical_alerts = mortality_reviews = procedures_this_month = 0

        return Response({
            'high_risk_patients': high_risk_patients,
            'unresolved_tickets': unresolved_tickets,
            'critical_alerts': critical_alerts,
            'mortality_reviews': mortality_reviews,
            'procedures_this_month': procedures_this_month,
        })
