from rest_framework import generics, permissions, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import (
    ClinicalProcedure, EmergencyProtocol, ProtocolAccessLog,
)
from .serializers import (
    ClinicalProcedureSerializer, EmergencyProtocolSerializer,
    ProtocolAccessLogSerializer,
)


class ProcedureListView(generics.ListAPIView):
    """
    GET /api/procedures/
    List all procedures. Filterable by category and severity.
    Searchable by title, summary.
    """
    serializer_class = ClinicalProcedureSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'summary']
    pagination_class = None  # Return all procedures for offline access

    def get_queryset(self):
        qs = ClinicalProcedure.objects.filter(is_active=True).prefetch_related(
            'steps', 'equipment', 'checklists'
        )
        category = self.request.query_params.get('category')
        severity = self.request.query_params.get('severity')
        if category:
            qs = qs.filter(category=category)
        if severity:
            qs = qs.filter(severity=severity)
        return qs


class ProcedureDetailView(generics.RetrieveUpdateAPIView):
    """GET/PATCH a single procedure (PATCH = admin/doctor only)."""
    queryset = ClinicalProcedure.objects.prefetch_related('steps', 'equipment', 'checklists')
    serializer_class = ClinicalProcedureSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_update(self, serializer):
        if getattr(self.request.user, 'role', None) not in ('ADMIN', 'DOCTOR'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only admins and doctors can edit procedures.')
        serializer.save()


class EmergencyProtocolListView(generics.ListAPIView):
    """
    GET /api/procedures/emergencies/
    List all emergency protocols with drugs and equipment.
    """
    serializer_class = EmergencyProtocolSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'danger_signs', 'immediate_response']
    pagination_class = None

    def get_queryset(self):
        return EmergencyProtocol.objects.filter(is_active=True).prefetch_related(
            'drugs', 'equipment', 'checklists'
        )


class EmergencyProtocolDetailView(generics.RetrieveAPIView):
    """GET a single emergency protocol (logs access for accountability)."""
    queryset = EmergencyProtocol.objects.prefetch_related('drugs', 'equipment', 'checklists')
    serializer_class = EmergencyProtocolSerializer
    permission_classes = [permissions.IsAuthenticated]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Log access for accountability
        ProtocolAccessLog.objects.create(
            protocol=instance,
            accessed_by=request.user,
            patient_id=request.query_params.get('patient'),
        )
        return Response(self.get_serializer(instance).data)


class ProtocolAccessLogView(generics.ListAPIView):
    """
    GET /api/procedures/access-logs/
    Admin-only: view protocol access audit trail.
    """
    serializer_class = ProtocolAccessLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if getattr(self.request.user, 'role', None) != 'ADMIN':
            return ProtocolAccessLog.objects.none()
        return ProtocolAccessLog.objects.select_related('protocol', 'accessed_by').all()
