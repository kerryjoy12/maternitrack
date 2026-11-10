from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import EducationCategory, EducationResource
from .serializers import EducationCategorySerializer, EducationResourceSerializer

class EducationCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = EducationCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'slug'

    def get_queryset(self):
        user = self.request.user
        # Get accessible resources first
        resource_viewset = EducationResourceViewSet()
        resource_viewset.request = self.request
        accessible_resources = resource_viewset.get_queryset()
        
        # Only show categories that have at least one accessible resource
        category_ids = accessible_resources.values_list('category_id', flat=True).distinct()
        return EducationCategory.objects.filter(id__in=category_ids)

class EducationResourceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = EducationResourceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['audience', 'category__slug', 'is_published']
    search_fields = ['title', 'summary', 'content']
    ordering_fields = ['created_at', 'title']
    lookup_field = 'slug'

    def get_queryset(self):
        user = self.request.user
        qs = EducationResource.objects.filter(is_published=True)

        if user.role == 'ADMIN':
            # Admins can see everything
            return EducationResource.objects.all()
        
        if user.role == 'MOTHER':
            # Mothers only see patient-facing content
            return qs.filter(audience='PATIENT')
        
        if user.role == 'DOCTOR':
            # Doctors see doctor-specific content
            return qs.filter(audience='DOCTOR')
            
        if user.role == 'NURSE':
            # Nurses see nurse-specific content
            return qs.filter(audience='NURSE')

        return qs.none()
