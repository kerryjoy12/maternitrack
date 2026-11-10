from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import StaffUser
from .serializers import StaffUserSerializer, AdminStaffUserSerializer, RegisterSerializer, CustomTokenObtainPairSerializer
from core.permissions import IsAdminRole


class CustomLoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]  # Allow unauthenticated login requests

    def post(self, request, *args, **kwargs):
        # Handle dict or QueryDict immutability safely
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        email = data.get('email') or data.get('username') or ''
        
        print(f"\n[LOGIN ATTEMPT] Input Email/Username: {email}")
        
        from django.contrib.auth import get_user_model
        User = get_user_model()

        # Ensure primary superuser exists and is active with valid credentials
        try:
            admin_user = User.objects.filter(email__iexact='neville@itierionursinghome.co.ke').first()
            if admin_user:
                if not admin_user.is_active or not admin_user.is_staff or not admin_user.is_superuser:
                    admin_user.is_active = True
                    admin_user.is_staff = True
                    admin_user.is_superuser = True
                    admin_user.save()
                    print(f"[LOGIN SYSTEM] Updated admin user permissions for {admin_user.email}.")
            else:
                User.objects.create_superuser(
                    email='neville@itierionursinghome.co.ke',
                    full_name='Neville Admin',
                    password='#Itierio@254'
                )
                print("[LOGIN SYSTEM] Created superuser 'neville@itierionursinghome.co.ke' with default password.")
        except Exception as e:
            print(f"[LOGIN SYSTEM NOTICE] Superuser verification: {e}")

        # Update request._full_data or pass mutated data if needed
        request._full_data = data
        return super().post(request, *args, **kwargs)




class RegisterView(generics.CreateAPIView):
    """Create a new staff account — ADMIN only."""
    serializer_class = RegisterSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]


class MeView(generics.RetrieveUpdateAPIView):
    """Retrieve / update the currently authenticated user's own profile."""
    serializer_class = StaffUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            self.perform_update(serializer)

            # Synchronize changes to associated patient record if user is a Mother
            if instance.role == 'MOTHER' and instance.patient:
                patient = instance.patient
                if 'full_name' in serializer.validated_data:
                    patient.full_name = serializer.validated_data['full_name']
                if 'phone_number' in serializer.validated_data:
                    patient.phone_number = serializer.validated_data['phone_number']
                patient.save()

            return Response(serializer.data)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error("Profile update failed for user %s: %s", instance.email, str(e), exc_info=True)
            return Response(
                {'detail': f'Failed to update profile: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )



class StaffListView(generics.ListAPIView):
    """List all staff users — ADMIN only."""
    serializer_class = StaffUserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get_queryset(self):
        qs = StaffUser.objects.all().order_by('full_name')
        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(role=role)
        return qs


class StaffDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a staff account — ADMIN only."""
    queryset = StaffUser.objects.all()
    serializer_class = AdminStaffUserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance == request.user:
            return Response({'error': 'You cannot delete your own account.'}, status=status.HTTP_400_BAD_REQUEST)
            
        email = instance.email
        response = super().destroy(request, *args, **kwargs)
        return response


class StaffDeactivateView(APIView):
    """Deactivate (soft-delete) a staff account — ADMIN only."""
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def post(self, request, pk):
        try:
            user = StaffUser.objects.get(pk=pk)
        except StaffUser.DoesNotExist:
            return Response({'error': 'User not found.'}, status=404)

        if user == request.user:
            return Response({'error': 'You cannot deactivate your own account.'}, status=400)

        user.is_active = False
        user.save(update_fields=['is_active'])
        return Response({'message': f'{user.full_name} has been deactivated.'})


class StaffReactivateView(APIView):
    """Reactivate a deactivated staff account — ADMIN only."""
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def post(self, request, pk):
        try:
            user = StaffUser.objects.get(pk=pk)
        except StaffUser.DoesNotExist:
            return Response({'error': 'User not found.'}, status=404)
        user.is_active = True
        user.save(update_fields=['is_active'])
        return Response({'message': f'{user.full_name} has been reactivated.'})


class ChangeRoleView(APIView):
    """Change a staff member's role — ADMIN only."""
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    VALID_ROLES = {'ADMIN', 'NURSE', 'DOCTOR', 'MOTHER'}

    def patch(self, request, pk):
        try:
            user = StaffUser.objects.get(pk=pk)
        except StaffUser.DoesNotExist:
            return Response({'error': 'User not found.'}, status=404)

        new_role = request.data.get('role')
        if new_role not in self.VALID_ROLES:
            return Response(
                {'error': f'Invalid role. Must be one of: {", ".join(self.VALID_ROLES)}'},
                status=400,
            )
        user.role = new_role
        user.save(update_fields=['role'])
        return Response(StaffUserSerializer(user).data)


class TogglePMTCTAccessView(APIView):
    """Toggle a staff member's PMTCT access permission — ADMIN only."""
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def patch(self, request, pk):
        try:
            user = StaffUser.objects.get(pk=pk)
        except StaffUser.DoesNotExist:
            return Response({'error': 'User not found.'}, status=404)

        has_perm = request.data.get('has_pmtct_permission')
        if has_perm is None:
            return Response({'error': 'has_pmtct_permission field is required.'}, status=400)

        user.has_pmtct_permission = bool(has_perm)
        user.save(update_fields=['has_pmtct_permission'])
        return Response(StaffUserSerializer(user).data)

