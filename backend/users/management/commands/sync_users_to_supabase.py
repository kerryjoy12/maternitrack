import logging
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from supabase_services import auth as supabase_auth

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Sync existing Django staff and mother users to Supabase Auth'

    def add_arguments(self, parser):
        parser.add_argument(
            '--password',
            type=str,
            default='#Itierio@254',
            help='Default password for synced users in Supabase Auth'
        )

    def handle(self, *args, **options):
        default_password = options['password']
        User = get_user_model()
        users = User.objects.all()
        
        self.stdout.write(self.style.NOTICE(f"Found {users.count()} users in Django database."))
        
        success_count = 0
        error_count = 0
        
        for user in users:
            self.stdout.write(f"Syncing {user.email} (Role: {user.role})...")
            try:
                # We attempt to create the user in Supabase Auth.
                # If the user already exists, it might raise an exception or return None.
                # We can specify metadata and the matching django_user_id.
                uid = supabase_auth.create_user(
                    email=user.email,
                    password=default_password,
                    full_name=user.full_name,
                    role=user.role,
                    django_user_id=str(user.id)
                )
                if uid:
                    self.stdout.write(self.style.SUCCESS(f"Successfully synced {user.email} -> Supabase UID: {uid}"))
                    success_count += 1
                else:
                    self.stdout.write(self.style.WARNING(f"User {user.email} could not be created (might already exist)."))
                    error_count += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error syncing {user.email}: {str(e)}"))
                error_count += 1
                
        self.stdout.write(self.style.SUCCESS(
            f"Sync finished. Success: {success_count}, Failed/Already Exists: {error_count}"
        ))
