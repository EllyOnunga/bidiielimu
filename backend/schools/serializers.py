from rest_framework import serializers

from .models import School, SchoolSetting, Subscription, MediaAsset


class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = ["id", "plan", "status", "start_date", "expiry_date"]
        read_only_fields = ["id", "start_date"]


class SchoolSettingSerializer(serializers.ModelSerializer):

    class Meta:
        model = SchoolSetting
        fields = [
            "id",
            "current_term",
            "academic_year",
            "currency",
            "tax_percentage",
            "enable_email_notifications",
            "enable_sms_notifications",
            "principal_name",
            "school_motto",
            "accent_color",
        ]


class SchoolSerializer(serializers.ModelSerializer):
    subscription = SubscriptionSerializer(read_only=True)
    settings = SchoolSettingSerializer(read_only=True)
    student_count = serializers.SerializerMethodField()
    total_revenue = serializers.SerializerMethodField()

    def get_student_count(self, obj):
        from django_tenants.utils import tenant_context

        from students.models import Student

        if obj.schema_name == "public":
            return 0
        try:
            with tenant_context(obj):
                return Student.objects.count()
        except Exception:
            return 0

    def get_total_revenue(self, obj):
        from django.db.models import Sum
        from django_tenants.utils import tenant_context

        from fees.models import FeePayment

        if obj.schema_name == "public":
            return 0.00
        try:
            with tenant_context(obj):
                total = FeePayment.objects.aggregate(total=Sum("amount"))["total"]
                return float(total) if total else 0.00
        except Exception:
            return 0.00

    domain_url = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = School
        fields = [
            "id",
            "name",
            "schema_name",
            "domain_url",
            "address",
            "contact_email",
            "contact_phone",
            "logo",
            "created_at",
            "updated_at",
            "subscription",
            "settings",
            "student_count",
            "total_revenue",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


import os
import hashlib

ALLOWED_SIGNATURES = {
    "pdf": [b"%PDF-"],
    "png": [b"\x89PNG\r\n\x1a\n"],
    "jpg": [b"\xff\xd8\xff"],
    "jpeg": [b"\xff\xd8\xff"],
    "gif": [b"GIF87a", b"GIF89a"],
    "zip": [b"PK\x03\x04"],
    "docx": [b"PK\x03\x04"],
    "xlsx": [b"PK\x03\x04"],
}

ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "gif", "docx", "xlsx", "txt", "csv"}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


class MediaAssetSerializer(serializers.ModelSerializer):
    file = serializers.FileField(write_only=True, required=True)
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = MediaAsset
        fields = [
            "id",
            "original_filename",
            "content_type",
            "size_bytes",
            "checksum_sha256",
            "visibility",
            "scan_status",
            "created_at",
            "file",
            "download_url",
        ]
        read_only_fields = [
            "id",
            "original_filename",
            "content_type",
            "size_bytes",
            "checksum_sha256",
            "scan_status",
            "created_at",
            "download_url",
        ]

    def validate_file(self, value):
        # 1. Size Check
        if value.size > MAX_FILE_SIZE:
            raise serializers.ValidationError("File size exceeds the 10MB limit.")

        # 2. Extension Check
        filename = value.name
        ext = os.path.splitext(filename)[1].lower().lstrip(".")
        if ext not in ALLOWED_EXTENSIONS:
            raise serializers.ValidationError(f"Extension .{ext} is not allowed.")

        # 3. Magic Bytes Check
        value.seek(0)
        header = value.read(2048)
        value.seek(0)  # Reset stream pointer

        if ext in ALLOWED_SIGNATURES:
            signatures = ALLOWED_SIGNATURES[ext]
            matched = any(header.startswith(sig) for sig in signatures)
            if not matched:
                raise serializers.ValidationError(
                    "File header content does not match its extension signature."
                )
        elif ext in ["txt", "csv"]:
            try:
                header.decode("utf-8")
            except UnicodeDecodeError:
                raise serializers.ValidationError(
                    "Plaintext file contains invalid encoding or binary data."
                )

        return value

    def get_download_url(self, obj):
        from django.core.files.storage import default_storage

        try:
            return default_storage.url(obj.storage_key)
        except Exception:
            return None

    def create(self, validated_data):
        file_obj = validated_data.pop("file")
        request = self.context.get("request")
        user = request.user if request else None
        school = request.tenant if request else None

        # Compute SHA256
        sha256_hash = hashlib.sha256()
        file_obj.seek(0)
        for chunk in file_obj.chunks():
            sha256_hash.update(chunk)
        file_obj.seek(0)
        checksum = sha256_hash.hexdigest()

        # Generate unique storage key
        import uuid

        ext = os.path.splitext(file_obj.name)[1].lower()
        unique_name = f"media_assets/{uuid.uuid4()}{ext}"

        # Save to S3/Storage
        from django.core.files.storage import default_storage

        storage_path = default_storage.save(unique_name, file_obj)

        # Create MediaAsset model instance
        media_asset = MediaAsset.objects.create(
            school=school,
            uploaded_by=user,
            storage_key=storage_path,
            original_filename=file_obj.name,
            content_type=file_obj.content_type or "application/octet-stream",
            size_bytes=file_obj.size,
            checksum_sha256=checksum,
            visibility=validated_data.get("visibility", "PRIVATE"),
            scan_status="CLEAN",
        )
        return media_asset
