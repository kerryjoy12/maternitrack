"""
Django signal: fires evaluate_clinical_thresholds after every
PartographEntry save so alerts are created in real-time.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender='patients.PartographEntry')
def partograph_entry_saved(sender, instance, created, **kwargs):
    """Evaluate clinical thresholds whenever a partograph entry is saved."""
    if instance and instance.pk:
        try:
            from alerts.services import evaluate_clinical_thresholds
            evaluate_clinical_thresholds(instance)
        except Exception as exc:
            import logging
            logging.getLogger(__name__).error(
                'Clinical alert evaluation failed for entry %s: %s',
                instance.pk, exc
            )
