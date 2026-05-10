from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from accounts.permissions import IsTeacher
from .models import FeeStructure, FeePayment
from .serializers import FeeStructureSerializer, FeePaymentSerializer
import uuid

class FeeStructureViewSet(viewsets.ModelViewSet):
    serializer_class = FeeStructureSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['grade_level__name']

    def get_queryset(self):
        return FeeStructure.objects.all().select_related('grade_level')

    def perform_create(self, serializer):
        serializer.save()

class FeePaymentViewSet(viewsets.ModelViewSet):
    serializer_class = FeePaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['student', 'payment_method']
    search_fields = ['student__first_name', 'student__last_name', 'transaction_id', 'student__admission_number']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsTeacher()]
        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user
        qs = FeePayment.objects.all().select_related('student__user', 'received_by')
        if user.role_name == 'STUDENT':
            qs = qs.filter(student__user=user)
        elif user.role_name == 'PARENT':
            qs = qs.filter(student__guardians__email=user.email)
        return qs

    def perform_create(self, serializer):
        serializer.save(received_by=self.request.user)

    @action(detail=False, methods=['get'])
    def student_balances(self, request):
        from students.models import Student
        from django.db.models import Subquery, OuterRef, DecimalField
        
        # Calculate total paid for each student
        total_paid_subquery = FeePayment.objects.filter(
            student=OuterRef('pk')
        ).values('student').annotate(
            total=Sum('amount')
        ).values('total')
    
        students = Student.objects.filter(is_active=True).select_related(
            'stream__grade_level'
        ).annotate(
            total_paid=Subquery(total_paid_subquery, output_field=DecimalField())
        )
        
        if request.user.role_name == 'STUDENT':
            students = students.filter(user=request.user)
        elif request.user.role_name == 'PARENT':
            students = students.filter(guardians__email=request.user.email)
        
        # Pre-fetch fee structures to avoid N+1 inside the loop
        structures = FeeStructure.objects.all().values('grade_level_id').annotate(
            total_expected=Sum('amount')
        )
        structure_map = {s['grade_level_id']: s['total_expected'] for s in structures}

        data = []
        for student in students:
            grade_id = student.stream.grade_level_id if student.stream else None
            if not grade_id:
                continue
                
            expected_fees = structure_map.get(grade_id, 0)
            total_paid = student.total_paid or 0
            balance = expected_fees - total_paid
            
            data.append({
                "student_id": student.id,
                "name": f"{student.first_name} {student.last_name}",
                "admission_number": student.admission_number,
                "class": f"{student.stream.grade_level.name} {student.stream.name if student.stream else ''}",
                "expected_fees": float(expected_fees),
                "total_paid": float(total_paid),
                "balance": float(balance)
            })
            
        return Response(data)

    @action(detail=False, methods=['get'])
    def my_fee_summary(self, request):
        """
        Returns fee summary for the currently authenticated student or parent's children.
        Scoped to individual student(s) — no list scanning.
        Query param (parent only): ?student_id=<id>
        """
        from students.models import Student
        user = request.user

        # Resolve target student(s)
        if user.role_name == 'STUDENT':
            try:
                student = Student.objects.select_related('stream__grade_level').get(user=user)
                students = [student]
            except Student.DoesNotExist:
                return Response({"detail": "Student profile not found."}, status=404)

        elif user.role_name == 'PARENT':
            student_id = request.query_params.get('student_id')
            qs = Student.objects.filter(
                guardians__email=user.email
            ).select_related('stream__grade_level').distinct()
            if student_id:
                qs = qs.filter(id=student_id)
            students = list(qs)

        else:
            # Admin/Teacher: require explicit student_id
            student_id = request.query_params.get('student_id')
            if not student_id:
                return Response({"detail": "student_id is required."}, status=400)
            try:
                students = [Student.objects.select_related('stream__grade_level').get(id=student_id)]
            except Student.DoesNotExist:
                return Response({"detail": "Student not found."}, status=404)

        # Pre-fetch fee structures
        from fees.models import FeeStructure
        structures = {
            s['grade_level_id']: s['total_expected']
            for s in FeeStructure.objects.values('grade_level_id').annotate(
                total_expected=Sum('amount')
            )
        }

        results = []
        for student in students:
            grade_id = student.stream.grade_level_id if student.stream else None
            expected = float(structures.get(grade_id, 0))

            payments = FeePayment.objects.filter(student=student).order_by('-payment_date')
            total_paid = payments.aggregate(total=Sum('amount'))['total'] or 0
            total_paid = float(total_paid)
            balance = expected - total_paid

            recent_payments = [
                {
                    "id": p.id,
                    "amount": float(p.amount),
                    "payment_method": p.payment_method,
                    "transaction_id": p.transaction_id,
                    "payment_date": p.payment_date.strftime("%B %d, %Y"),
                }
                for p in payments[:5]
            ]

            results.append({
                "student_id": student.id,
                "name": f"{student.first_name} {student.last_name}",
                "admission_number": student.admission_number,
                "grade": student.stream.grade_level.name if student.stream else None,
                "expected_fees": expected,
                "total_paid": total_paid,
                "balance": balance,
                "is_cleared": balance <= 0,
                "recent_payments": recent_payments,
            })

        return Response(results if len(results) > 1 else results[0] if results else {})


    @action(detail=False, methods=['post'])
    def initiate_mpesa(self, request):
        student_id = request.data.get('student_id')
        amount = request.data.get('amount')
        phone = request.data.get('phone')
        
        if not all([student_id, amount, phone]):
            return Response({"detail": "Missing required fields (student_id, amount, phone)."}, status=status.HTTP_400_BAD_REQUEST)
            
        from students.models import Student
        try:
            student = Student.objects.get(id=student_id)
        except Student.DoesNotExist:
            return Response({"detail": "Student not found."}, status=status.HTTP_404_NOT_FOUND)
            
        # Mock M-Pesa delay and success
        # In a real app, this would call Daraja API and wait for a callback.
        # Here we immediately create the payment to simulate a successful STK push callback.
        
        transaction_id = f"MPESA{str(uuid.uuid4())[:8].upper()}"
        
        payment = FeePayment.objects.create(
            student=student,
            amount=amount,
            payment_method='MPESA',
            transaction_id=transaction_id,
            received_by=request.user,
            notes=f"Auto-generated via Mock M-Pesa STK Push to {phone}"
        )
        
        return Response({
            "detail": "Payment processed successfully.",
            "transaction_id": transaction_id,
            "amount": amount
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def download_receipt(self, request, pk=None):
        from .services_receipts import ReceiptService
        from django.http import HttpResponse
        
        try:
            payment = self.get_object()
        except Exception:
            return Response({"detail": "Payment not found"}, status=404)
            
        pdf_bytes = ReceiptService.generate_receipt_pdf(payment.id)
        
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="receipt_{payment.transaction_id}.pdf"'
        return response
