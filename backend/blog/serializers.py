from rest_framework import serializers
from rest_framework.serializers import ModelSerializer

from .models import BlogPost, Category


class CategorySerializer(ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug"]


class BlogPostSerializer(ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source="category",
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = BlogPost
        fields = [
            "id",
            "title",
            "slug",
            "content",
            "excerpt",
            "featured_image",
            "is_published",
            "created_at",
            "updated_at",
            "category",
            "category_id",
        ]
