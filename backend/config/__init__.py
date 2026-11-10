# Import celery app so it's available when Django starts
try:
    from .celery import app as celery_app
    __all__ = ('celery_app',)
except ImportError:
    # Celery not installed yet — gracefully skip
    pass
