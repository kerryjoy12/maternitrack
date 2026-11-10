import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class StaffUserManager(BaseUserManager):
    def create_user(self, email, full_name, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, full_name=full_name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user


    def create_superuser(self, email, full_name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')
        return self.create_user(email, full_name, password, **extra_fields)


class StaffUser(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('ADMIN', 'Administrator'),
        ('NURSE', 'Nurse'),
        ('DOCTOR', 'Doctor'),
        ('MOTHER', 'Mother'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=200)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='NURSE')
    phone_number = models.CharField(max_length=30, blank=True)
    bio = models.TextField(blank=True, default='', help_text='Professional bio or about section')
    profile_completed = models.BooleanField(default=False, help_text='Whether the user has completed their initial profile setup')
    has_pmtct_permission = models.BooleanField(default=False, help_text='Designates if a Nurse has access to sensitive PMTCT registry data')
    patient = models.OneToOneField(
        'patients.Patient',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='user_account',
        help_text='Associated patient record if this is a Mother account'
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    objects = StaffUserManager()

    class Meta:
        db_table = 'staff_users'
        verbose_name = 'Staff User'
        verbose_name_plural = 'Staff Users'

    def __str__(self):
        return f"{self.full_name} ({self.role})"
