from django.db.models.signals import post_save
from django.dispatch import receiver
from datetime import timedelta
from postnatal.models import PostnatalRecord
from pediatrics.models import ChildProfile, VaccinationRecord

@receiver(post_save, sender=PostnatalRecord)
def create_child_profile_and_vaccinations(sender, instance, created, **kwargs):
    """
    Automatically spawns a ChildProfile and generic vaccine schedule
    whenever a PostnatalRecord (i.e. Delivery) is registered.
    """
    if created and not hasattr(instance, 'child_profile'):
        # 1. Create the Child Profile
        child = ChildProfile.objects.create(
            mother=instance.patient,
            postnatal_record=instance,
            first_name=instance.baby_first_name,
            last_name=instance.baby_last_name,
            date_of_birth=instance.delivery_date,
            birth_weight_kg=instance.baby_weight_kg,
            gender=instance.baby_gender
        )
        
        dob = instance.delivery_date
        
        # 2. Pre-populate the Vaccine Schedule (Kenyan EPI standard)
        # Expected dates based on weeks/months from Date of Birth
        schedule = [
            # At Birth
            ('BCG', dob),
            ('OPV0', dob),
            # 6 Weeks
            ('OPV1', dob + timedelta(weeks=6)),
            ('PENTA1', dob + timedelta(weeks=6)),
            ('PCV1', dob + timedelta(weeks=6)),
            ('ROTA1', dob + timedelta(weeks=6)),
            # 10 Weeks
            ('OPV2', dob + timedelta(weeks=10)),
            ('PENTA2', dob + timedelta(weeks=10)),
            ('PCV2', dob + timedelta(weeks=10)),
            ('ROTA2', dob + timedelta(weeks=10)),
            # 14 Weeks
            ('OPV3', dob + timedelta(weeks=14)),
            ('PENTA3', dob + timedelta(weeks=14)),
            ('PCV3', dob + timedelta(weeks=14)),
            ('IPV', dob + timedelta(weeks=14)),
            # 9 Months (39 weeks approx)
            ('MEASLES_RUBELLA', dob + timedelta(days=274)),
        ]
        
        vaccines_to_create = []
        for code, expected_date in schedule:
            status = 'PENDING'
            given_date = None
            
            # Sync birth vaccines if already marked given on the PostnatalRecord
            if code == 'BCG' and instance.bcg_given:
                status = 'GIVEN'
                given_date = instance.bcg_date or dob
            elif code == 'OPV0' and instance.opv0_given:
                status = 'GIVEN'
                given_date = instance.opv0_date or dob
            
            vaccines_to_create.append(
                VaccinationRecord(
                    child=child,
                    vaccine_name=code,
                    expected_date=expected_date,
                    status=status,
                    given_date=given_date
                )
            )
            
        # Bulk create for efficiency
        VaccinationRecord.objects.bulk_create(vaccines_to_create)
