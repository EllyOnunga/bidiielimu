from django.utils import timezone
from .models import LeaveRequest

class LeaveWorkflowService:
    @staticmethod
    def apply_for_leave(user, leave_type, start_date, end_date, reason):
        # 1. Check if dates are valid
        if start_date < timezone.now().date():
            raise ValueError("Start date cannot be in the past")
        
        # 2. Check for overlapping requests
        existing = LeaveRequest.objects.filter(
            user=user,
            status__in=['PENDING', 'APPROVED'],
            start_date__lte=end_date,
            end_date__gte=start_date
        ).exists()
        
        if existing:
            raise ValueError("You already have an overlapping leave request")

        return LeaveRequest.objects.create(
            user=user,
            leave_type=leave_type,
            start_date=start_date,
            end_date=end_date,
            reason=reason
        )

    @staticmethod
    def approve_leave(request_id, admin_user):
        request = LeaveRequest.objects.get(id=request_id)
        request.status = 'APPROVED'
        request.approved_by = admin_user
        request.save()
        return request
