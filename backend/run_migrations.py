import os
import django
from django.core.management import call_command

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_dev')
django.setup()

print("Generating migrations...")
call_command('makemigrations', 'referrals')

print("Running migrations...")
call_command('migrate')

print("Migrations completed successfully!")
