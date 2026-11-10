"""
Celery application configuration.

Start the worker with:
    celery -A config worker --loglevel=info

Start the beat scheduler with:
    celery -A config beat --loglevel=info

Requires Redis:
    pip install celery redis django-celery-beat django-celery-results
    # Redis must be running on localhost:6379 (or configure CELERY_BROKER_URL)
"""
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('maternity_tracker')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
