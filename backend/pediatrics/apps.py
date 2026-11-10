from django.apps import AppConfig

class PediatricsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'pediatrics'

    def ready(self):
        import pediatrics.signals
