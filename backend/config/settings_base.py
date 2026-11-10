"""
Django settings for Maternity Follow-Up Tracker (Base Configuration)
"""
from pathlib import Path
from decouple import config
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='django-insecure-dev-key-change-me')
FIELD_ENCRYPTION_KEY = config('FIELD_ENCRYPTION_KEY', default='Z7iHf1QHDFlUrNFPBIRzUKsitZbK1trKw4K5XFuduiI=')
try:
    DEBUG = config('DEBUG', default=True, cast=bool)
except ValueError:
    DEBUG = True
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1,0.0.0.0').split(',')

INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'simple_history',
    'django_filters',
    # Local apps
    'core',
    'users',
    'patients',
    'appointments',
    'postnatal',
    'pediatrics',
    'reminders',
    'dashboard',
    'alerts',
    'clinical',
    'nutrition',
    'procedures',
    'tickets',
    'referrals',
    'mortality',
    'pmtct',
    'education',
    'drf_spectacular',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'simple_history.middleware.HistoryRequestMiddleware',
    'core.middleware.AuditMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', default='postgres'),
        'USER': config('DB_USER', default='postgres'),
        'PASSWORD': config('DB_PASSWORD', default=''),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default=5432, cast=int),
        'CONN_MAX_AGE': config('DB_CONN_MAX_AGE', default=600, cast=int),
        'OPTIONS': {
            'sslmode': config('DB_SSLMODE', default='require'),
            'connect_timeout': 10,
        },
    }
}

# ──────────────────────────────────────────────────────────────────────────────
# External EHR Interoperability (FHIR R4)
# ──────────────────────────────────────────────────────────────────────────────
EXTERNAL_EHR_FHIR_URL = config('EXTERNAL_EHR_FHIR_URL', default='http://127.0.0.1:8000/api/v1/core/fhir/mock-receiver/')

# ──────────────────────────────────────────────────────────────────────────────
# REST Framework + JWT Auth
# ──────────────────────────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    # Rate throttling — production hardening
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '30/minute',
        'user': '120/minute',
    },
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

AUTHENTICATION_BACKENDS = [
    'users.backends.EmailOrUsernameModelBackend',
    'django.contrib.auth.backends.ModelBackend',
]


# ──────────────────────────────────────────────────────────────────────────────
# CORS
# ──────────────────────────────────────────────────────────────────────────────
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https?://localhost(:[0-9]+)?$",
    r"^https?://127\.0\.0\.1(:[0-9]+)?$",
    r"^https?://.*\.vercel\.app$",
]

# ──────────────────────────────────────────────────────────────────────────────
# Africa's Talking SMS
# ──────────────────────────────────────────────────────────────────────────────
AT_USERNAME = config('AT_USERNAME', default='sandbox')
AT_API_KEY = config('AT_API_KEY', default='')
AT_SENDER_ID = config('AT_SENDER_ID', default='MATERNITY')
ADMIN_PHONE_NUMBER = config('ADMIN_PHONE_NUMBER', default='')

# ──────────────────────────────────────────────────────────────────────────────
# Clinical Alert Configuration
# ──────────────────────────────────────────────────────────────────────────────
# Minutes before a duplicate alert of the same type can be raised for a patient
ALERT_DEDUP_MINUTES = config('ALERT_DEDUP_MINUTES', default=120, cast=int)

# django-simple-history
SIMPLE_HISTORY_REVERT_DISABLED = True
SIMPLE_HISTORY_HISTORY_CHANGE_REASON_USE_TEXT_FIELD = True

# ──────────────────────────────────────────────────────────────────────────────
# Static files
# ──────────────────────────────────────────────────────────────────────────────
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
AUTH_USER_MODEL = 'users.StaffUser'

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Nairobi'
USE_I18N = True
USE_TZ = True

# ──────────────────────────────────────────────────────────────────────────────
# Cache — Resilient Local Memory (prevents Redis connection timeouts from blocking requests)
# ──────────────────────────────────────────────────────────────────────────────
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'maternity-cache-store',
    }
}

# ──────────────────────────────────────────────────────────────────────────────
# Celery — async task queue for automated SMS reminders
# ──────────────────────────────────────────────────────────────────────────────
CELERY_BROKER_URL = config('CELERY_BROKER_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = config('CELERY_RESULT_BACKEND', default='redis://localhost:6379/1')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30  # 30 second hard limit per task

# ──────────────────────────────────────────────────────────────────────────────
# Production Security Hardening (Phase 3C)
# ──────────────────────────────────────────────────────────────────────────────
# Security headers (active in development & production base)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_HTTPONLY = True

# File upload limits
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10 MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024

# ──────────────────────────────────────────────────────────────────────────────
# Email SMTP Configuration
# ──────────────────────────────────────────────────────────────────────────────
EMAIL_BACKEND = config('EMAIL_BACKEND', default='django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_USE_SSL = config('EMAIL_USE_SSL', default=False, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@perinatal360.com')

SPECTACULAR_SETTINGS = {
    'TITLE': 'Maternity Follow-Up Tracker API',
    'DESCRIPTION': 'API documentation for the Maternity Follow-Up Tracker system.',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

# ──────────────────────────────────────────────────────────────────────────────
# File Storage (S3 with Local Fallback)
# ──────────────────────────────────────────────────────────────────────────────
AWS_ACCESS_KEY_ID = config('AWS_ACCESS_KEY_ID', default=None)
AWS_SECRET_ACCESS_KEY = config('AWS_SECRET_ACCESS_KEY', default=None)
AWS_STORAGE_BUCKET_NAME = config('AWS_STORAGE_BUCKET_NAME', default=None)
AWS_S3_REGION_NAME = config('AWS_S3_REGION_NAME', default='us-east-1')

if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY and AWS_STORAGE_BUCKET_NAME:
    STORAGES = {
        "default": {
            "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
            "OPTIONS": {
                "bucket_name": AWS_STORAGE_BUCKET_NAME,
                "region_name": AWS_S3_REGION_NAME,
                "querystring_auth": True,  # Generate short-lived signed URLs
                "querystring_expire": 3600,
            }
        },
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
        },
    }
else:
    STORAGES = {
        "default": {
            "BACKEND": "django.core.files.storage.FileSystemStorage",
        },
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
        },
    }

