"""
supabase_services/auth_service.py
───────────────────────────────────
Synchronises Django StaffUser accounts with Supabase Auth.

Why:
  The React frontend authenticates with Django (JWT) for REST API calls,
  AND with Supabase (session token) so that Realtime channel subscriptions
  respect the user's identity.  Supabase Realtime/RLS checks auth.uid(),
  so each Django user must have a matching Supabase Auth user.

Flow:
  Django login → AuthApi.login() creates Supabase Auth session
               → returns supbaseToken to frontend
  Frontend    → calls supabase.auth.setSession(supabaseToken)
               → Realtime subscriptions now have valid auth context

Usage:
    from supabase_services import auth

    token_data = auth.sign_in(email, password)
    # token_data = {'access_token': ..., 'refresh_token': ..., 'expires_in': ...}

    auth.create_user(email, password, user_metadata)
    auth.delete_user(supabase_uid)
    auth.update_password(email, new_password)
"""
import logging
from typing import Optional
from .client import get_client

logger = logging.getLogger(__name__)


class AuthService:
    """Thin wrapper over Supabase Auth admin API for server-side user management."""

    # ── User creation ─────────────────────────────────────────────────────────

    @classmethod
    def create_user(
        cls,
        email: str,
        password: str,
        full_name: str = '',
        role: str = 'NURSE',
        django_user_id: Optional[str] = None,
    ) -> Optional[str]:
        """
        Create a Supabase Auth user matching a Django StaffUser.
        Returns the Supabase UID (UUID string) on success, None on failure.

        The Supabase UID is used as user_id in the realtime_staff_notifications
        RLS policy:  auth.uid()::text = user_id::text
        """
        try:
            sb = get_client()
            response = sb.auth.admin.create_user({
                'email': email,
                'password': password,
                'email_confirm': True,  # Skip email confirmation for staff
                'user_metadata': {
                    'full_name': full_name,
                    'role': role,
                    'django_user_id': str(django_user_id) if django_user_id else None,
                },
            })
            if response and response.user:
                logger.info(
                    'Supabase Auth user created: %s (uid=%s)',
                    email,
                    response.user.id,
                )
                return str(response.user.id)
            return None
        except Exception as exc:
            logger.warning('AuthService.create_user failed for %s: %s', email, exc)
            return None

    # ── Sign-in (called from Django login view) ───────────────────────────────

    @classmethod
    def sign_in(cls, email: str, password: str) -> Optional[dict]:
        """
        Sign in a user via Supabase Auth using email/password.
        Returns a dict with access_token, refresh_token, expires_in.
        The frontend calls supabase.auth.setSession() with these tokens.

        Returns None if sign-in fails (user may not exist in Supabase yet).
        """
        try:
            sb = get_client()
            response = sb.auth.sign_in_with_password({
                'email': email,
                'password': password,
            })
            if response and response.session:
                return {
                    'access_token': response.session.access_token,
                    'refresh_token': response.session.refresh_token,
                    'expires_in': response.session.expires_in,
                    'token_type': 'bearer',
                }
            return None
        except Exception as exc:
            logger.warning('AuthService.sign_in failed for %s: %s', email, exc)
            return None

    # ── Password management ───────────────────────────────────────────────────

    @classmethod
    def update_password(cls, email: str, new_password: str) -> bool:
        """
        Update a user's Supabase password by email.
        Used when an admin resets a Django user's password.
        """
        try:
            sb = get_client()
            # Get the user by email to find their Supabase UID
            response = sb.auth.admin.list_users()
            if response:
                for user in response:
                    if user.email == email:
                        sb.auth.admin.update_user_by_id(
                            str(user.id),
                            {'password': new_password}
                        )
                        return True
            return False
        except Exception as exc:
            logger.warning(
                'AuthService.update_password failed for %s: %s', email, exc
            )
            return False

    # ── User deletion ─────────────────────────────────────────────────────────

    @classmethod
    def delete_user_by_email(cls, email: str) -> bool:
        """Remove a user from Supabase Auth when they are deleted from Django."""
        try:
            sb = get_client()
            response = sb.auth.admin.list_users()
            if response:
                for user in response:
                    if user.email == email:
                        sb.auth.admin.delete_user(str(user.id))
                        logger.info('Supabase Auth user deleted: %s', email)
                        return True
            return False
        except Exception as exc:
            logger.warning(
                'AuthService.delete_user_by_email failed for %s: %s', email, exc
            )
            return False
