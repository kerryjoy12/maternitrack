"""
supabase_services/client.py
────────────────────────────
Returns a single authenticated Supabase client instance reused across
the entire Django process.  The service-role key is used so all
server-side operations bypass Row Level Security.
"""
from functools import lru_cache
from django.conf import settings
from supabase import create_client, Client


@lru_cache(maxsize=1)
def get_client() -> Client:
    """Return a cached Supabase client authenticated with the service key."""
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_KEY,
    )
