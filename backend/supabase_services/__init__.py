"""
supabase_services
─────────────────
Thin service layer wrapping the Supabase Python SDK.

Usage anywhere in Django:
    from supabase_services import storage, realtime, client, auth
"""
# from .client import get_client          # noqa: F401
from .storage_service import StorageService as storage   # noqa: F401
from .realtime_service import RealtimeService as realtime  # noqa: F401
# from .auth_service import AuthService as auth  # noqa: F401

