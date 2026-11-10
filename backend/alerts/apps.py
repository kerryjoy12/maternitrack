from django.apps import AppConfig


class AlertsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'alerts'
    verbose_name = 'Clinical Alerts'

    def ready(self):
        # Connect signals when Django starts
        import alerts.signals  # noqa: F401
