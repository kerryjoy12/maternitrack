from django.urls import path
from .views import MaternalDeathReviewListCreateView, MaternalDeathReviewDetailView

urlpatterns = [
    path('', MaternalDeathReviewListCreateView.as_view(), name='mortality_list_create'),
    path('<int:pk>/', MaternalDeathReviewDetailView.as_view(), name='mortality_detail'),
]
