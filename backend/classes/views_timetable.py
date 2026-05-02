from rest_framework import views, status, permissions
from rest_framework.response import Response
from .services_timetable import TimetableGenerator
from .models import ScheduleSlot, Stream
from .serializers import ScheduleSlotSerializer

class TimetableAutoGenerateView(views.APIView):
    """
    Trigger the automated timetable generator for a specific stream.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        stream_id = request.data.get('stream_id')
        if not stream_id:
            return Response({"detail": "stream_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Optional params
        start_time = request.data.get('start_time', '08:00')
        end_time = request.data.get('end_time', '16:00')
        period_duration = int(request.data.get('period_duration', 40))

        results = TimetableGenerator.generate_for_stream(
            stream_id, start_time, end_time, period_duration
        )
        return Response(results, status=status.HTTP_200_OK)

class TimetableConflictView(views.APIView):
    """
    Check if a proposed slot has conflicts.
    Used for real-time validation in the drag-and-drop editor.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = ScheduleSlotSerializer(data=request.data)
        if serializer.is_valid():
            # If valid, just return ok
            return Response({"status": "ok"}, status=status.HTTP_200_OK)
        
        return Response({
            "status": "conflict",
            "errors": serializer.errors
        }, status=status.HTTP_200_OK) # We return 200 so the frontend can handle the data
