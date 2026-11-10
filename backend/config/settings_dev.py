from .settings_base import *

DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# Use local memory cache for development to avoid requiring a running Redis instance
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'maternity-dev-cache',
    }
}

# Redirect all outgoing emails to the terminal console during development unless overridden in .env
EMAIL_BACKEND = config('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')

import os
import sys

from decouple import config

if config('USE_SQLITE', default=True, cast=bool) or 'test' in sys.argv or any('pytest' in arg for arg in sys.argv) or 'tests' in sys.argv:
    TESTING = True
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
        }
    }

