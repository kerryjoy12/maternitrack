from rest_framework import generics, permissions
from .models import MaternalDeathReview
from .serializers import MaternalDeathReviewSerializer
from core.permissions import IsAdminOrDoctor

class MaternalDeathReviewListCreateView(generics.ListCreateAPIView):
    """
    GET  — List all death/near-miss reviews
    POST — Create a new death/near-miss review
    Restricted to ADMIN or DOCTOR users.
    """
    queryset = MaternalDeathReview.objects.select_related('patient', 'reviewed_by').all()
    serializer_class = MaternalDeathReviewSerializer
    permission_classes = [IsAdminOrDoctor]

    def perform_create(self, serializer):
        serializer.save(reviewed_by=self.request.user)


class MaternalDeathReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET/PUT/PATCH/DELETE a mortality review.
    Restricted to ADMIN or DOCTOR users.
    """
    queryset = MaternalDeathReview.objects.select_related('patient', 'reviewed_by').all()
    serializer_class = MaternalDeathReviewSerializer
    permission_classes = [IsAdminOrDoctor]
