from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView
from rest_framework_simplejwt.views import TokenRefreshView
from users.views import CustomLoginView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import permissions


class HealthCheckView(APIView):
    """Simple health check endpoint for monitoring backend availability."""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        return Response(
            {'status': 'ok', 'message': 'MaterniTrack backend is running'},
            status=200
        )


urlpatterns = [
    path('', HealthCheckView.as_view(), name='root_health_check'),
    path('admin/', admin.site.urls),
    
    # OpenAPI Schema & Swagger UI
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    
    # Health check endpoint (no auth required)
    path('api/v1/health/', HealthCheckView.as_view(), name='health_check'),

    # API v1 Versioned endpoints
    # Auth
    path('api/v1/auth/login/', CustomLoginView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # Apps
    path('api/v1/patients/', include('patients.urls')),
    path('api/v1/appointments/', include('appointments.urls')),
    path('api/v1/postnatal/', include('postnatal.urls')),
    path('api/v1/reminders/', include('reminders.urls')),
    path('api/v1/dashboard/', include('dashboard.urls')),
    path('api/v1/users/', include('users.urls')),
    path('api/v1/alerts/', include('alerts.urls')),
    path('api/v1/core/', include('core.urls')),
    path('api/v1/clinical/', include('clinical.urls')),
    path('api/v1/pediatrics/', include('pediatrics.urls')),
    path('api/v1/nutrition/', include('nutrition.urls')),
    path('api/v1/procedures/', include('procedures.urls')),
    path('api/v1/tickets/', include('tickets.urls')),
    path('api/v1/referrals/', include('referrals.urls')),
    path('api/v1/mortality/', include('mortality.urls')),
    path('api/v1/pmtct/', include('pmtct.urls')),
    path('api/v1/education/', include('education.urls')),

    # Backward compatibility redirect from /api/ to /api/v1/
    re_path(r'^api/(?!v1/|schema/|docs/)(?P<path>.*)$', RedirectView.as_view(url='/api/v1/%(path)s', permanent=True, query_string=True)),
]

# Serve uploaded media in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
