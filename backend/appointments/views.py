from rest_framework import generics, permissions, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from datetime import date
from .models import Appointment
from .serializers import AppointmentSerializer, AppointmentCreateSerializer
from clinical.models import ANCVisit


class AppointmentListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['patient__full_name', 'patient__patient_number']
    ordering_fields = ['scheduled_date', 'status']
    ordering = ['scheduled_date']

    def get_queryset(self):
        qs = Appointment.objects.select_related('patient', 'created_by')
        status = self.request.query_params.get('status')
        patient = self.request.query_params.get('patient')
        appt_type = self.request.query_params.get('type')
        if status:
            qs = qs.filter(status=status)
        if patient:
            qs = qs.filter(patient_id=patient)
        if appt_type:
            qs = qs.filter(appointment_type=appt_type)
        return qs

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AppointmentCreateSerializer
        return AppointmentSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        # Return full serializer data
        appt = Appointment.objects.get(pk=response.data['id'])
        return Response(AppointmentSerializer(appt).data, status=201)


class AppointmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Appointment.objects.select_related('patient', 'created_by')
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]


class MarkAttendedView(APIView):
    """
    Mark an appointment as attended.
    For ANC appointments, this will also create an ANCVisit record if one doesn't exist.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            appointment = Appointment.objects.get(pk=pk)
            appointment.status = 'ATTENDED'
            appointment.attended_date = date.today()
            appointment.save()

            # Broadcast realtime update
            from supabase_services import realtime
            realtime.appointment_updated(
                appointment_id=appointment.id,
                patient_id=appointment.patient_id,
                new_status='ATTENDED',
                scheduled_date=str(appointment.scheduled_date),
                appointment_type=appointment.appointment_type,
            )
            
            anc_visit = None
            # For ANC appointments, create an ANCVisit record if it doesn't exist
            if appointment.appointment_type in ['ANC1', 'ANC2', 'ANC3', 'ANC4']:
                # Check if an ANCVisit already exists for this appointment
                anc_visit = ANCVisit.objects.filter(appointment=appointment).first()
                if not anc_visit:
                    # Determine visit number from appointment type
                    visit_number_map = {'ANC1': 1, 'ANC2': 2, 'ANC3': 3, 'ANC4': 4}
                    visit_number = visit_number_map.get(appointment.appointment_type, 1)
                    
                    # Create a new ANCVisit record linked to this appointment
                    anc_visit = ANCVisit.objects.create(
                        patient=appointment.patient,
                        visit_number=visit_number,
                        visit_date=date.today(),
                        appointment=appointment,
                        attending_staff=request.user,
                        general_notes=f"ANC visit recorded from appointment: {appointment.appointment_type}"
                    )
            
            return Response({
                'appointment': AppointmentSerializer(appointment).data,
                'anc_visit_created': anc_visit.id if anc_visit else None
            })
        except Appointment.DoesNotExist:
            return Response({'error': 'Appointment not found'}, status=404)


class MarkMissedView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            appointment = Appointment.objects.get(pk=pk)
            appointment.status = 'MISSED'
            appointment.save()

            # Broadcast realtime update
            from supabase_services import realtime
            realtime.appointment_updated(
                appointment_id=appointment.id,
                patient_id=appointment.patient_id,
                new_status='MISSED',
                scheduled_date=str(appointment.scheduled_date),
                appointment_type=appointment.appointment_type,
            )
            return Response(AppointmentSerializer(appointment).data)
        except Appointment.DoesNotExist:
            return Response({'error': 'Appointment not found'}, status=404)


class RescheduleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            appointment = Appointment.objects.get(pk=pk)
            new_date = request.data.get('scheduled_date')
            if not new_date:
                return Response({'error': 'scheduled_date is required'}, status=400)
            appointment.status = 'RESCHEDULED'
            appointment.scheduled_date = new_date
            appointment.scheduled_time = request.data.get('scheduled_time')
            appointment.save()

            # Broadcast realtime update
            from supabase_services import realtime
            realtime.appointment_updated(
                appointment_id=appointment.id,
                patient_id=appointment.patient_id,
                new_status='RESCHEDULED',
                scheduled_date=str(appointment.scheduled_date),
                appointment_type=appointment.appointment_type,
            )
            return Response(AppointmentSerializer(appointment).data)
        except Appointment.DoesNotExist:
            return Response({'error': 'Appointment not found'}, status=404)
