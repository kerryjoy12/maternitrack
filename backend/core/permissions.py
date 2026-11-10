"""
Reusable DRF permission classes for the Maternity Tracker.

Usage in views:
    permission_classes = [IsAdminRole]
    permission_classes = [IsAdminRole | IsNurseRole]
    permission_classes = [IsAuthenticated, CanEditOwnPartograph]
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminRole(BasePermission):
    """Allow only users with role == 'ADMIN'."""
    message = 'Administrator access required.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            getattr(request.user, 'role', None) == 'ADMIN'
        )


class IsDoctorRole(BasePermission):
    """Allow only users with role == 'DOCTOR'."""
    message = 'Doctor access required.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            getattr(request.user, 'role', None) == 'DOCTOR'
        )


class IsNurseRole(BasePermission):
    """Allow only users with role == 'NURSE'."""
    message = 'Nurse access required.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            getattr(request.user, 'role', None) == 'NURSE'
        )


class IsAdminOrDoctor(BasePermission):
    """Allow ADMIN or DOCTOR roles."""
    message = 'Admin or Doctor access required.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            getattr(request.user, 'role', None) in ('ADMIN', 'DOCTOR')
        )


class IsAdminOrReadOnly(BasePermission):
    """
    Read access for any authenticated user.
    Write/delete access only for ADMIN.
    """
    message = 'Administrator access required for modifications.'

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return getattr(request.user, 'role', None) == 'ADMIN'


class CanEditOwnPartograph(BasePermission):
    """
    Object-level permission for partograph entries.
    - ADMIN can always edit/delete.
    - The nurse who recorded the entry can edit/delete their own.
    - Others get read-only access.
    """
    message = 'You can only edit partograph entries you recorded.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if getattr(request.user, 'role', None) == 'ADMIN':
            return True
        return obj.recorded_by == request.user


class IsAdminOrNurse(BasePermission):
    """Allow ADMIN or NURSE roles — used for clinical data creation."""
    message = 'Clinical staff access required.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            getattr(request.user, 'role', None) in ('ADMIN', 'NURSE')
        )


class IsMotherRole(BasePermission):
    """Allow only users with role == 'MOTHER' and associated patient record."""
    message = 'Mother access required.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            getattr(request.user, 'role', None) == 'MOTHER' and
            getattr(request.user, 'patient', None) is not None
        )

