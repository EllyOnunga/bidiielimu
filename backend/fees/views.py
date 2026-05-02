from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from .models import FeeStructure, FeePayment
from .serializers import FeeStructureSerializer, FeePaymentSerializer
import uuid

class FeeStructureViewSet(viewsets.ModelViewSet):
    serializer_class = FeeStructureSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['grade_level__name']

    def get_queryset(self):
        return FeeStructure.objects.filter(school=self.request.user.school).select_related('grade_level')

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)

class FeePaymentViewSet(viewsets.ModelViewSet):
    serializer_class = FeePaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['student', 'payment_method']
    search_fields = ['student__first_name', 'student__last_name', 'transaction_id', 'student__admission_number']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            from accounts.permissions import IsTeacher
            return [IsTeacher()]
        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user
        qs = FeePayment.objects.filter(student__school=user.school).select_related('student__user', 'received_by')
        if user.role == 'STUDENT':
            qs = qs.filter(student__user=user)
        elif user.role == 'PARENT':
            qs = qs.filter(student__guardians__email=user.email)
        return qs

    def perform_create(self, serializer):
        serializer.save(received_by=self.request.user)

    @action(detail=False, methods=['get'])
    def student_balances(self, request):
        from students.models import Student
        from django.db.models import Subquery, OuterRef, DecimalField
        school = request.user.school
        
        # Calculate total paid for each student
        total_paid_subquery = FeePayment.objects.filter(
            student=OuterRef('pk')
        ).values('student').annotate(
            total=Sum('amount')
        ).values('total')

        students = Student.objects.filter(school=school, is_active=True).select_related(
            'stream__grade_level'
        ).annotate(
            total_paid=Subquery(total_paid_subquery, output_field=DecimalField())
        )
        
        if request.user.role == 'STUDENT':
            students = students.filter(user=request.user)
        elif request.user.role == 'PARENT':
            students = students.filter(guardians__email=request.user.email)
        
        # Pre-fetch fee structures for the school to avoid N+1 inside the loop
        structures = FeeStructure.objects.filter(school=school).values('grade_level_id').annotate(
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

    @action(detail=False, methods=['post'])
    def initiate_mpesa(self, request):
        student_id = request.data.get('student_id')
        amount = request.data.get('amount')
        phone = request.data.get('phone')
        
        if not all([student_id, amount, phone]):
            return Response({"detail": "Missing required fields (student_id, amount, phone)."}, status=status.HTTP_400_BAD_REQUEST)
            
        from students.models import Student
        try:
            student = Student.objects.get(id=student_id, school=request.user.school)
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
