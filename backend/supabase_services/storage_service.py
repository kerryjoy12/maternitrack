"""
supabase_services/storage_service.py
──────────────────────────────────────
Handles all file operations using Django's native storage backend.
Automatically routes to AWS S3 if credentials are provided in settings,
or falls back to local disk storage in the media/ directory.

Virtual Bucket Layout (mapped to subfolders):
  patient-documents/  → clinical documents, consent forms, ID scans
  ultrasound-images/  → ultrasound scans (JPEG/PNG/DICOM)
  lab-reports/        → PDF lab reports
  education-videos/   → educational video content
"""
import os
import mimetypes
from typing import Optional
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile


class StorageService:
    """Facade over Django's storage system for maternity documents."""

    @staticmethod
    def _bucket(name: str) -> str:
        """Map logical names to subfolders matching the old Supabase buckets."""
        buckets = {
            'documents':  'patient-documents',
            'ultrasound': 'ultrasound-images',
            'lab':        'lab-reports',
            'education':  'education-videos',
        }
        return buckets.get(name, name)

    @classmethod
    def upload(
        cls,
        bucket: str,
        path: str,
        file_bytes: bytes,
        filename: str,
        upsert: bool = False,
    ) -> str:
        """
        Upload bytes to Django storage.
        Maps the Supabase bucket name to a root-level directory.
        Returns the storage path on success.
        """
        bucket_name = cls._bucket(bucket)
        full_path = f"{bucket_name}/{path}"

        # If file already exists and upsert is allowed, delete first
        if default_storage.exists(full_path):
            if upsert:
                default_storage.delete(full_path)
            else:
                # Append a suffix to avoid duplicates, or just let Django handle renaming
                pass

        default_storage.save(full_path, ContentFile(file_bytes))
        return full_path

    @classmethod
    def delete(cls, bucket: str, path: str) -> None:
        """Remove a file from storage."""
        bucket_name = cls._bucket(bucket)
        full_path = f"{bucket_name}/{path}"
        if default_storage.exists(full_path):
            default_storage.delete(full_path)

    @classmethod
    def signed_url(cls, bucket: str, path: str, expires_in: int = 3600) -> str:
        """
        Generate a URL for secure file access.
        If using S3, this generates a pre-signed URL.
        If using Local Storage, it returns a local media URL.
        """
        # For our unified storage, path is already stored with bucket prefix (e.g. 'patient-documents/path')
        # If it doesn't start with the bucket name, we prepend it.
        bucket_name = cls._bucket(bucket)
        if not path.startswith(bucket_name):
            full_path = f"{bucket_name}/{path}"
        else:
            full_path = path

        try:
            url = default_storage.url(full_path)
        except Exception:
            # Fallback in case storage backend fails
            return f"/media/{full_path}"

        # If it's a relative URL (local FileSystemStorage), prepend the backend domain
        if url.startswith('/'):
            backend_url = getattr(settings, 'BACKEND_URL', 'http://127.0.0.1:8000')
            url = f"{backend_url.rstrip('/')}{url}"

        return url

    @classmethod
    def public_url(cls, bucket: str, path: str) -> str:
        """Return the public URL of the file."""
        return cls.signed_url(bucket, path)

    # ── domain-specific upload helpers ────────────────────────────────────────

    @classmethod
    def upload_document(
        cls,
        patient_id: int,
        file_bytes: bytes,
        filename: str,
        subfolder: str = '',
    ) -> str:
        """Upload a clinical document for a patient. Returns storage path."""
        folder = f'patients/{patient_id}/documents'
        if subfolder:
            folder = f'{folder}/{subfolder}'
        path = f'{folder}/{filename}'
        return cls.upload('documents', path, file_bytes, filename, upsert=True)

    @classmethod
    def upload_ultrasound(
        cls,
        patient_id: int,
        file_bytes: bytes,
        filename: str,
        visit_id: Optional[int] = None,
    ) -> str:
        """Upload an ultrasound image. Returns storage path."""
        folder = f'patients/{patient_id}/ultrasound'
        if visit_id:
            folder = f'{folder}/visit_{visit_id}'
        path = f'{folder}/{filename}'
        return cls.upload('ultrasound', path, file_bytes, filename, upsert=True)

    @classmethod
    def upload_lab_report(
        cls,
        patient_id: int,
        file_bytes: bytes,
        filename: str,
        visit_id: Optional[int] = None,
    ) -> str:
        """Upload a lab report PDF. Returns storage path."""
        folder = f'patients/{patient_id}/lab'
        if visit_id:
            folder = f'{folder}/visit_{visit_id}'
        path = f'{folder}/{filename}'
        return cls.upload('lab', path, file_bytes, filename, upsert=True)

    @classmethod
    def upload_education_video(
        cls,
        module_id: int,
        file_bytes: bytes,
        filename: str,
    ) -> str:
        """Upload an educational video. Returns storage path."""
        path = f'modules/{module_id}/{filename}'
        return cls.upload('education', path, file_bytes, filename, upsert=True)

    @classmethod
    def document_signed_url(cls, path: str, expires_in: int = 3600) -> str:
        return cls.signed_url('documents', path, expires_in)

    @classmethod
    def ultrasound_signed_url(cls, path: str, expires_in: int = 3600) -> str:
        return cls.signed_url('ultrasound', path, expires_in)

    @classmethod
    def lab_signed_url(cls, path: str, expires_in: int = 3600) -> str:
        return cls.signed_url('lab', path, expires_in)
