# Generated manually to add email field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('patients', '0018_merge_20260609_1041'),
    ]

    operations = [
        migrations.AddField(
            model_name='historicalpatient',
            name='email',
            field=models.EmailField(blank=True, max_length=254, null=True),
        ),
        migrations.AddField(
            model_name='patient',
            name='email',
            field=models.EmailField(blank=True, max_length=254, null=True),
        ),
    ]
