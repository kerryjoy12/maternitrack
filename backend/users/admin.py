from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import StaffUser


@admin.register(StaffUser)
class StaffUserAdmin(UserAdmin):
    list_display = ['full_name', 'email', 'role', 'is_active', 'date_joined']
    list_filter = ['role', 'is_active']
    search_fields = ['full_name', 'email']
    ordering = ['full_name']

    # Fields shown when EDITING an existing user
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('full_name', 'phone_number', 'role')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Dates', {'fields': ('last_login', 'date_joined')}),
    )
    # Fields shown when ADDING a new user (password1 + password2 ensures hashing)
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'full_name', 'role', 'phone_number', 'password1', 'password2', 'is_active', 'is_staff'),
        }),
    )
    readonly_fields = ['date_joined', 'last_login']
