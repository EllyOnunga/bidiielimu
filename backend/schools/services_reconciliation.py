import csv
import difflib
import io
from decimal import Decimal, InvalidOperation

from fees.models import FeePayment, Invoice


class BankStatementReconciler:
    def __init__(self, csv_file_obj):
        self.csv_file_obj = csv_file_obj

    def _fuzzy_match_name(self, query, student):
        full_name = f"{student.first_name} {student.last_name}".strip().lower()
        query_lower = query.lower()
        return difflib.SequenceMatcher(None, query_lower, full_name).ratio()

    def reconcile(self):
        """
        Parses a banking/MPesa CSV spreadsheet and reconciles payments against pending invoices.
        Returns a list of dictionaries representing the parsed rows and their match confidences.
        """
        decoded_file = self.csv_file_obj.read().decode("utf-8", errors="replace")
        io_string = io.StringIO(decoded_file)
        reader = csv.DictReader(io_string)

        results = []
        pending_invoices = list(
            Invoice.objects.filter(
                status__in=["UNPAID", "PARTIAL", "OVERDUE"]
            ).select_related("student")
        )

        for row in reader:
            # Map standard columns, handling variations
            date_str = row.get("Date", row.get("Transaction Date", ""))
            desc = row.get("Description", row.get("Details", ""))
            ref = row.get("Reference", row.get("Receipt No.", ""))

            amount_str = row.get("Credit", row.get("Amount", "0"))
            try:
                amount = Decimal(str(amount_str).replace(",", "").strip())
            except (InvalidOperation, ValueError):
                amount = Decimal("0")

            if amount <= 0:
                continue

            # Check if reference already exists
            if ref and FeePayment.objects.filter(transaction_id=ref).exists():
                results.append(
                    {
                        "date": date_str,
                        "description": desc,
                        "reference": ref,
                        "amount": float(amount),
                        "status": "ALREADY_PROCESSED",
                        "confidence": 1.0,
                        "suggested_student_id": None,
                        "suggested_student_name": None,
                        "suggested_invoice_id": None,
                    }
                )
                continue

            best_match = None
            highest_score = 0.0

            for invoice in pending_invoices:
                score = 0.0

                # Check amount match
                if invoice.balance == amount:
                    score += 0.5
                elif invoice.balance > amount:
                    score += 0.2

                # Check name fuzzy match
                name_match = self._fuzzy_match_name(desc, invoice.student)
                if name_match > 0.6:
                    score += name_match * 0.4

                # Check admission number match
                if (
                    invoice.student.admission_number
                    and invoice.student.admission_number.lower() in desc.lower()
                ):
                    score += 0.8  # Very strong signal

                if score > highest_score:
                    highest_score = score
                    best_match = invoice

            highest_score = min(highest_score, 1.0)

            if best_match and highest_score > 0.4:
                results.append(
                    {
                        "date": date_str,
                        "description": desc,
                        "reference": ref,
                        "amount": float(amount),
                        "status": "MATCHED",
                        "confidence": round(highest_score, 2),
                        "suggested_student_id": best_match.student.id,
                        "suggested_student_name": f"{best_match.student.first_name} {best_match.student.last_name}",
                        "suggested_invoice_id": best_match.id,
                    }
                )
            else:
                results.append(
                    {
                        "date": date_str,
                        "description": desc,
                        "reference": ref,
                        "amount": float(amount),
                        "status": "UNMATCHED",
                        "confidence": round(highest_score, 2),
                        "suggested_student_id": None,
                        "suggested_student_name": None,
                        "suggested_invoice_id": None,
                    }
                )

        return results
