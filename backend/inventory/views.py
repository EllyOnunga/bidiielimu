from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, Q, F
from .models import InventoryItem, ProcurementLog
from .serializers import InventoryItemSerializer, ProcurementLogSerializer

INVENTORY_ALLOWED_ROLES = ['ADMIN', 'SUPER_ADMIN', 'PRINCIPAL', 'LIBRARIAN']

class InventoryItemViewSet(viewsets.ModelViewSet):
    serializer_class = InventoryItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role_name not in INVENTORY_ALLOWED_ROLES:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to access inventory records.")
        qs = InventoryItem.objects.all()
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category.upper())
        return qs

    @action(detail=False, methods=['get'])
    def library_stats(self, request):
        """
        Admin/Librarian: full library inventory summary from the database.
        """
        if request.user.role_name not in INVENTORY_ALLOWED_ROLES:
            return Response({"detail": "Permission denied."}, status=403)

        library_qs = InventoryItem.objects.filter(category='LIBRARY')

        total_titles = library_qs.count()
        total_copies = library_qs.aggregate(total=Sum('quantity'))['total'] or 0
        low_stock = library_qs.filter(quantity__lte=F('min_threshold')).count()
        
        from .models import BookIssue
        active_issues = BookIssue.objects.filter(status='ISSUED').count()
        available_copies = total_copies - active_issues

        items = list(library_qs.values('id', 'name', 'quantity', 'unit', 'min_threshold', 'last_restock'))

        return Response({
            "total_titles": total_titles,
            "total_copies": total_copies,
            "available_copies": available_copies,
            "low_stock_items": low_stock,
            "items": items,
        })

    @action(detail=False, methods=['get'])
    def books_count(self, request):
        """
        Lightweight endpoint for the student portal stat card.
        Returns total library book count from the database.
        """
        total = InventoryItem.objects.filter(category='LIBRARY').aggregate(
            total=Sum('quantity')
        )['total'] or 0
        titles = InventoryItem.objects.filter(category='LIBRARY').count()
        
        from .models import BookIssue
        active_issues = BookIssue.objects.filter(status='ISSUED').count()
        available = total - active_issues

        return Response({
            "total_books": available,
            "total_titles": titles,
        })


class BookIssueViewSet(viewsets.ModelViewSet):
    from .serializers import BookIssueSerializer
    serializer_class = BookIssueSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        from .models import BookIssue
        user = self.request.user
        qs = BookIssue.objects.all().select_related('item', 'student', 'issued_by')
        if user.role_name == 'STUDENT':
            qs = qs.filter(student__user=user)
        elif user.role_name not in INVENTORY_ALLOWED_ROLES:
            qs = qs.none()
        return qs

    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError
        from .models import BookIssue
        user = self.request.user
        if user.role_name not in INVENTORY_ALLOWED_ROLES:
            raise ValidationError("You do not have permission to issue books.")
        
        item = serializer.validated_data['item']
        active_issues = BookIssue.objects.filter(item=item, status='ISSUED').count()
        available = item.quantity - active_issues
        
        if available <= 0:
            raise ValidationError(f"No available copies of {item.name}.")
            
        serializer.save(issued_by=user)

    @action(detail=True, methods=['post'])
    def return_book(self, request, pk=None):
        from django.utils import timezone
        from rest_framework.exceptions import ValidationError
        
        user = request.user
        if user.role_name not in INVENTORY_ALLOWED_ROLES:
            raise ValidationError("You do not have permission to return books.")
            
        issue = self.get_object()
        if issue.status != 'ISSUED' and issue.status != 'OVERDUE':
            return Response({"detail": "Book is already returned or lost."}, status=400)
            
        condition = request.data.get('condition_on_return', 'GOOD')
        fine_amount = request.data.get('fine_amount', 0)
        notes = request.data.get('notes', '')
        
        issue.status = 'RETURNED'
        issue.return_date = timezone.now().date()
        issue.condition_on_return = condition
        issue.fine_amount = fine_amount
        if notes:
            issue.notes = f"{issue.notes}\nReturn notes: {notes}" if issue.notes else notes
        issue.save()
        
        return Response({"status": "returned"})

    @action(detail=False, methods=['get'])
    def my_books(self, request):
        from django.utils import timezone
        from .models import BookIssue
        user = request.user
        
        qs = BookIssue.objects.filter(status__in=['ISSUED', 'OVERDUE']).select_related('item')
        if user.role_name == 'STUDENT':
            qs = qs.filter(student__user=user)
        elif user.role_name == 'PARENT':
            qs = qs.filter(student__guardians__email=user.email)
        else:
            student_id = request.query_params.get('student_id')
            if student_id:
                qs = qs.filter(student_id=student_id)
            else:
                qs = qs.none()
                
        results = []
        for issue in qs:
            is_overdue = issue.due_date < timezone.now().date()
            if is_overdue and issue.status == 'ISSUED':
                issue.status = 'OVERDUE'
                issue.save()
                
            results.append({
                "id": issue.id,
                "title": issue.item.name,
                "issue_date": issue.issue_date,
                "due_date": issue.due_date,
                "status": issue.status,
                "is_overdue": is_overdue
            })
            
        return Response(results)

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        from django.utils import timezone
        from .models import BookIssue
        
        user = request.user
        if user.role_name not in INVENTORY_ALLOWED_ROLES:
            return Response({"detail": "Permission denied."}, status=403)
            
        today = timezone.now().date()
        
        # Auto-update status to OVERDUE for any ISSUED books past due_date
        BookIssue.objects.filter(status='ISSUED', due_date__lt=today).update(status='OVERDUE')
        
        overdue_qs = BookIssue.objects.filter(status='OVERDUE').select_related('item', 'student')
        
        results = []
        for issue in overdue_qs:
            days_overdue = (today - issue.due_date).days
            auto_fine = days_overdue * 10 # 10 KSh per day
            
            results.append({
                "id": issue.id,
                "student_name": f"{issue.student.first_name} {issue.student.last_name}",
                "student_admission": issue.student.admission_number,
                "title": issue.item.name,
                "due_date": issue.due_date,
                "days_overdue": days_overdue,
                "suggested_fine": auto_fine
            })
            
        return Response(results)


class ProcurementLogViewSet(viewsets.ModelViewSet):
    serializer_class = ProcurementLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role_name not in INVENTORY_ALLOWED_ROLES:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to access procurement logs.")
        return ProcurementLog.objects.all()

