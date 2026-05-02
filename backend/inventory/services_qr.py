import uuid
import qrcode
from io import BytesIO
from django.core.files.base import ContentFile

class AssetQRService:
    @staticmethod
    def generate_asset_token():
        # Generates a unique token for the asset's QR code
        return f"SCH-ASSET-{uuid.uuid4().hex[:10].upper()}"

    @staticmethod
    def generate_qr_image(token):
        # Generates a QR code image as a byte stream
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(token)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        return buffer.getvalue()
