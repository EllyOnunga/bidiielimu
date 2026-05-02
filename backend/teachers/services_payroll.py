from decimal import Decimal
from .models import HRSettings

class PayrollEngine:
    @staticmethod
    def calculate_monthly_pay(basic_salary, allowances=0):
        gross_pay = Decimal(basic_salary) + Decimal(allowances)
        settings = HRSettings.objects.first() or HRSettings()

        # 1. Statutory Deductions
        nssf = PayrollEngine.calculate_nssf(gross_pay)
        housing_levy = gross_pay * settings.housing_levy_rate
        shif = gross_pay * settings.shif_rate
        
        # 2. Taxable Pay
        taxable_pay = gross_pay - nssf
        
        # 3. PAYE (Kenyan Bands 2024)
        paye = PayrollEngine.calculate_paye(taxable_pay)
        # Personal Relief (Fixed at 2,400)
        net_paye = max(0, paye - Decimal(2400))

        # 4. Net Pay
        total_deductions = nssf + housing_levy + shif + net_paye
        net_pay = gross_pay - total_deductions

        return {
            "gross_pay": round(gross_pay, 2),
            "nssf": round(nssf, 2),
            "shif": round(shif, 2),
            "housing_levy": round(housing_levy, 2),
            "paye": round(net_paye, 2),
            "net_pay": round(net_pay, 2)
        }

    @staticmethod
    def calculate_nssf(gross):
        # Tier I & II combined approx 6% capped at 2160
        return min(gross * Decimal(0.06), Decimal(2160))

    @staticmethod
    def calculate_paye(taxable):
        tax = Decimal(0)
        # Simple implementation of bands
        if taxable <= 24000:
            tax = taxable * Decimal(0.1)
        elif taxable <= 32333:
            tax = (24000 * Decimal(0.1)) + (taxable - 24000) * Decimal(0.25)
        else:
            tax = (24000 * Decimal(0.1)) + (8333 * Decimal(0.25)) + (taxable - 32333) * Decimal(0.3)
        return tax
