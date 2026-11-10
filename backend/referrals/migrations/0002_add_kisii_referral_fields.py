from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('referrals', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='referral',
            name='serial_no',
            field=models.CharField(blank=True, help_text='Form Serial Number', max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='referring_facility_name',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='referring_facility_mfl',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='referring_facility_contacts',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='receiving_facility_mfl',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='receiving_facility_contacts',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='referral_time',
            field=models.TimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='admission_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='admission_time',
            field=models.TimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='patient_age',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='patient_gender',
            field=models.CharField(blank=True, max_length=10, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='patient_ip_op_no',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='patient_diagnosis',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='next_of_kin_contacts',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='history_illness_injury',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='medical_surgical_history',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='allergies',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='anc_visits_count',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='anc_facility',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='tt_dose',
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='para',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='gravida',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='hiv_status',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='syphilis_status',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='hb_level',
            field=models.DecimalField(blank=True, decimal_places=1, max_digits=4, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='blood_group',
            field=models.CharField(blank=True, max_length=10, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='rhesus_factor',
            field=models.CharField(blank=True, max_length=10, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='fundal_height',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='fetal_lie',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='fetal_presentation',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='fetal_position',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='cervical_dilatation',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='presenting_part',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='membranes_status',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='fetal_heart_rate',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='spo2',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='pulse_rate',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='respiratory_rate',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='blood_pressure',
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='temperature',
            field=models.DecimalField(blank=True, decimal_places=1, max_digits=4, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='investigations_done',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='treatment_interventions',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='ambulance_first_call_time',
            field=models.TimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='ambulance_call_received_time',
            field=models.TimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='ambulance_dispatched_time',
            field=models.TimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='ambulance_arrival_scene_time',
            field=models.TimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='ambulance_departure_facility_time',
            field=models.TimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='ambulance_arrival_hospital_time',
            field=models.TimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='gcs_eye',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='gcs_motor',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='gcs_verbal',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='gcs_score_total',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='crew_1_name',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='crew_1_sign',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='crew_2_name',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='crew_2_sign',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='ambulance_reg_no',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='receiving_hospital',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='staff_handed_over',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='handover_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='handover_time',
            field=models.TimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='call_made_by',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='call_made_by_designation',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='call_made_by_time',
            field=models.TimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='call_received_by',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='call_received_by_designation',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='call_received_by_time',
            field=models.TimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='referral',
            name='comments',
            field=models.TextField(blank=True, null=True),
        ),
    ]
