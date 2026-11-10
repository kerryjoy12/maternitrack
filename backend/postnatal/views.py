from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from datetime import date
from .models import PostnatalRecord
from .serializers import PostnatalSerializer


class PostnatalListCreateView(generics.ListCreateAPIView):
    queryset = PostnatalRecord.objects.select_related('patient').order_by('-delivery_date')
    serializer_class = PostnatalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class PostnatalDetailView(generics.RetrieveUpdateAPIView):
    queryset = PostnatalRecord.objects.select_related('patient')
    serializer_class = PostnatalSerializer
    permission_classes = [permissions.IsAuthenticated]


class Mark7DayAttendedView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            record = PostnatalRecord.objects.get(pk=pk)
            record.review_7day_attended = True
            record.review_7day_notes = request.data.get('notes', '')
            record.save()
            return Response(PostnatalSerializer(record).data)
        except PostnatalRecord.DoesNotExist:
            return Response({'error': 'Record not found'}, status=404)


class Mark6WeekAttendedView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            record = PostnatalRecord.objects.get(pk=pk)
            record.review_6week_attended = True
            record.review_6week_notes = request.data.get('notes', '')
            record.save()
            return Response(PostnatalSerializer(record).data)
        except PostnatalRecord.DoesNotExist:
            return Response({'error': 'Record not found'}, status=404)
