import uuid

from django.db.models import Sum
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsTeacher
from config.tenant_security import StrictTenantPermission, TenantAwareViewSetMixin

from .models import FeePayment, FeeStructure
from .serializers import FeePaymentSerializer, FeeStructureSerializer


class FeeStructureViewSet(TenantAwareViewSetMixin, viewsets.ModelViewSet):
    serializer_class = FeeStructureSerializer
    permission_classes = [permissions.IsAuthenticated, StrictTenantPermission]
    search_fields = ["grade_level__name"]

    def get_queryset(self):
        return FeeStructure.objects.all().select_related("grade_level")

    def perform_create(self, serializer):
        serializer.save()


class FeePaymentViewSet(TenantAwareViewSetMixin, viewsets.ModelViewSet):
    serializer_class = FeePaymentSerializer
    permission_classes = [permissions.IsAuthenticated, StrictTenantPermission]
    filterset_fields = ["student", "payment_method"]
    search_fields = [
        "student__first_name",
        "student__last_name",
        "transaction_id",
        "student__admission_number",
    ]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsTeacher()]
        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user
        qs = FeePayment.objects.all().select_related("student__user", "received_by")
        if user.role_name == "STUDENT":
            qs = qs.filter(student__user=user)
        elif user.role_name == "PARENT":
            qs = qs.filter(student__guardians__email=user.email)
        return qs

    def perform_create(self, serializer):
        serializer.save(received_by=self.request.user)

    @action(detail=False, methods=["get"])
    def student_balances(self, request):
        from django.db.models import DecimalField, OuterRef, Subquery

        from students.models import Student

        # Calculate total paid for each student
        total_paid_subquery = (
            FeePayment.objects.filter(student=OuterRef("pk"))
            .values("student")
            .annotate(total=Sum("amount"))
            .values("total")
        )

        students = (
            Student.objects.filter(is_active=True)
            .select_related("stream__grade_level")
            .annotate(
                total_paid=Subquery(total_paid_subquery, output_field=DecimalField())
            )
        )

        if request.user.role_name == "STUDENT":
            students = students.filter(user=request.user)
        elif request.user.role_name == "PARENT":
            students = students.filter(guardians__email=request.user.email)

        # Pre-fetch fee structures to avoid N+1 inside the loop
        structures = (
            FeeStructure.objects.all()
            .values("grade_level_id")
            .annotate(total_expected=Sum("amount"))
        )
        structure_map = {s["grade_level_id"]: s["total_expected"] for s in structures}

        data = []
        for student in students:
            grade_id = student.stream.grade_level_id if student.stream else None
            if not grade_id:
                continue

            expected_fees = structure_map.get(grade_id, 0)
            total_paid = student.total_paid or 0
            balance = expected_fees - total_paid

            data.append(
                {
                    "student_id": student.id,
                    "name": f"{
                        student.first_name} {
                        student.last_name}",
                    "admission_number": student.admission_number,
                    "class": f"{
                        student.stream.grade_level.name} {
                        student.stream.name if student.stream else ''}",
                    "expected_fees": float(expected_fees),
                    "total_paid": float(total_paid),
                    "balance": float(balance),
                }
            )

        return Response(data)

    @action(detail=False, methods=["get"])
    def my_fee_summary(self, request):
        """
        Returns fee summary for the currently authenticated student or parent's children.
        Scoped to individual student(s) — no list scanning.
        Query param (parent only): ?student_id=<id>
        """
        from students.models import Student

        user = request.user

        # Resolve target student(s)
        if user.role_name == "STUDENT":
            try:
                student = Student.objects.select_related("stream__grade_level").get(
                    user=user
                )
                students = [student]
            except Student.DoesNotExist:
                return Response({"detail": "Student profile not found."}, status=404)

        elif user.role_name == "PARENT":
            student_id = request.query_params.get("student_id")
            qs = (
                Student.objects.filter(guardians__email=user.email)
                .select_related("stream__grade_level")
                .distinct()
            )
            if student_id:
                qs = qs.filter(id=student_id)
            students = list(qs)

        else:
            # Admin/Teacher: require explicit student_id
            student_id = request.query_params.get("student_id")
            if not student_id:
                return Response({"detail": "student_id is required."}, status=400)
            try:
                students = [
                    Student.objects.select_related("stream__grade_level").get(
                        id=student_id
                    )
                ]
            except Student.DoesNotExist:
                return Response({"detail": "Student not found."}, status=404)

        # Pre-fetch fee structures
        from fees.models import FeeStructure

        structures = {
            s["grade_level_id"]: s["total_expected"]
            for s in FeeStructure.objects.values("grade_level_id").annotate(
                total_expected=Sum("amount")
            )
        }

        results = []
        for student in students:
            grade_id = student.stream.grade_level_id if student.stream else None
            expected = float(structures.get(grade_id, 0))

            payments = FeePayment.objects.filter(student=student).order_by(
                "-payment_date"
            )
            total_paid = payments.aggregate(total=Sum("amount"))["total"] or 0
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

            results.append(
                {
                    "student_id": student.id,
                    "name": f"{student.first_name} {student.last_name}",
                    "admission_number": student.admission_number,
                    "grade": (
                        student.stream.grade_level.name if student.stream else None
                    ),
                    "expected_fees": expected,
                    "total_paid": total_paid,
                    "balance": balance,
                    "is_cleared": balance <= 0,
                    "recent_payments": recent_payments,
                }
            )

        return Response(results if len(results) > 1 else results[0] if results else {})

    @action(detail=False, methods=["post"])
    def initiate_mpesa(self, request):
        student_id = request.data.get("student_id")
        amount = request.data.get("amount")
        phone = request.data.get("phone")
        invoice_id = request.data.get("invoice_id")

        if not all([student_id, amount, phone]):
            return Response(
                {"detail": "Missing required fields (student_id, amount, phone)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from django.conf import settings

        from students.models import Student

        from .services_payments import MpesaService

        try:
            student = Student.objects.get(id=student_id)
        except Student.DoesNotExist:
            return Response(
                {"detail": "Student not found."}, status=status.HTTP_404_NOT_FOUND
            )

        # Check if live M-Pesa is configured
        if (
            settings.MPESA_CONSUMER_KEY
            and settings.MPESA_CONSUMER_SECRET
            and settings.MPESA_PASSKEY
        ):
            # Trigger actual Safaricom STK Push
            response = MpesaService.initiate_stk_push(
                phone=phone,
                amount=amount,
                invoice_id=invoice_id,
                student_id=student_id,
            )
            if response.get("ResponseCode") == "0":
                return Response(
                    {
                        "detail": "STK Push request sent successfully. Please check your phone for the M-Pesa PIN prompt.",
                        "checkout_request_id": response.get("CheckoutRequestID"),
                        "amount": amount,
                    },
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {
                        "detail": f"M-Pesa STK Push failed: {response.get('ResponseDescription', 'Unknown error')}"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Smart Dev Fallback: Create mock payment directly
        transaction_id = f"MPESA{str(uuid.uuid4())[:8].upper()}"

        payment = FeePayment.objects.create(
            student=student,
            amount=amount,
            payment_method="MPESA",
            transaction_id=transaction_id,
            received_by=request.user,
            notes=f"Auto-generated via Mock M-Pesa STK Push to {phone} (Daraja keys not set)",
        )

        return Response(
            {
                "detail": "Payment processed successfully (Mock Mode).",
                "transaction_id": transaction_id,
                "amount": amount,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=False,
        methods=["post"],
        url_path="mpesa-callback",
        permission_classes=[permissions.AllowAny],
    )
    def mpesa_callback(self, request):
        from .services_payments import MpesaService

        # Hand off payload parsing to services_payments.py
        MpesaService.handle_webhook(request.data)
        # Safaricom requires this exact response format
        return Response(
            {"ResultCode": 0, "ResultDesc": "Success"}, status=status.HTTP_200_OK
        )

    @action(detail=True, methods=["get"])
    def download_receipt(self, request, pk=None):
        from django.http import HttpResponse

        from .services_receipts import ReceiptService

        try:
            payment = self.get_object()
        except Exception:
            return Response({"detail": "Payment not found"}, status=404)

        pdf_bytes = ReceiptService.generate_receipt_pdf(payment.id)

        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = (
            f'attachment; filename="receipt_{payment.transaction_id}.pdf"'
        )
        return response

    @action(detail=False, methods=["post"], url_path="bulk-print")
    def bulk_print(self, request):
        """
        Action to compile and print multiple receipts.
        If size is small (<= 5), returns combined PDF synchronously.
        If large (> 5), spawns background Celery compilation.
        """
        from django.http import HttpResponse

        from .tasks import generate_bulk_receipts_pdf, generate_bulk_receipts_pdf_task

        payment_ids = request.data.get("payment_ids", [])
        if not payment_ids:
            return Response(
                {"detail": "No payment_ids provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            payment_ids = [int(pid) for pid in payment_ids]
        except (ValueError, TypeError):
            return Response(
                {"detail": "payment_ids must be a list of integers."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Strict Authorization Check: Only fetch payments authorized for the active user session.
        # This completely prevents multi-tenant leaks.
        authorized_payments = self.get_queryset().filter(id__in=payment_ids)
        authorized_ids = list(authorized_payments.values_list("id", flat=True))

        if not authorized_ids:
            return Response(
                {"detail": "No authorized payments found for the provided IDs."},
                status=status.HTTP_403_FORBIDDEN,
            )

        schema_name = request.tenant.schema_name

        # For small requests, generate synchronously for optimal UX
        if len(authorized_ids) <= 5:
            try:
                pdf_bytes = generate_bulk_receipts_pdf(authorized_ids)
                response = HttpResponse(pdf_bytes, content_type="application/pdf")
                response["Content-Disposition"] = (
                    'attachment; filename="bulk_receipts.pdf"'
                )
                return response
            except Exception as e:
                return Response(
                    {"detail": f"Failed to generate receipts: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
        else:
            # Asynchronous generation for larger print batches
            task = generate_bulk_receipts_pdf_task.delay(schema_name, authorized_ids)
            return Response(
                {
                    "task_id": task.id,
                    "detail": "Bulk receipt PDF generation started in the background.",
                    "status": "PENDING",
                },
                status=status.HTTP_202_ACCEPTED,
            )
