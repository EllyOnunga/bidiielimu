from django_tenants.utils import schema_context
from rest_framework import generics, permissions, viewsets

from accounts.permissions import IsSuperAdmin

from .models import BlogPost, Category
from .serializers import BlogPostSerializer, CategorySerializer


class PublicBlogListView(generics.ListAPIView):
    """
    List all published blog posts. Accessible to anyone on the marketing site and tenants.
    """

    permission_classes = [permissions.AllowAny]
    serializer_class = BlogPostSerializer

    def dispatch(self, request, *args, **kwargs):
        with schema_context("public"):
            return super().dispatch(request, *args, **kwargs)

    def get_queryset(self):
        category_slug = self.request.query_params.get("category")
        queryset = BlogPost.objects.filter(is_published=True)
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        return queryset


class PublicBlogDetailView(generics.RetrieveAPIView):
    """
    Retrieve details of a single blog post using its slug.
    """

    permission_classes = [permissions.AllowAny]
    serializer_class = BlogPostSerializer
    lookup_field = "slug"

    def dispatch(self, request, *args, **kwargs):
        with schema_context("public"):
            return super().dispatch(request, *args, **kwargs)

    def get_queryset(self):
        return BlogPost.objects.filter(is_published=True)


class PublicCategoryListView(generics.ListAPIView):
    """
    List all blog categories.
    """

    permission_classes = [permissions.AllowAny]
    serializer_class = CategorySerializer

    def dispatch(self, request, *args, **kwargs):
        with schema_context("public"):
            return super().dispatch(request, *args, **kwargs)

    def get_queryset(self):
        return Category.objects.all()


class AdminBlogPostViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Super Admin to manage blog posts (CRUD).
    """

    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
    serializer_class = BlogPostSerializer

    def dispatch(self, request, *args, **kwargs):
        with schema_context("public"):
            return super().dispatch(request, *args, **kwargs)

    def get_queryset(self):
        return BlogPost.objects.all()


class AdminCategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Super Admin to manage blog categories (CRUD).
    """

    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
    serializer_class = CategorySerializer

    def dispatch(self, request, *args, **kwargs):
        with schema_context("public"):
            return super().dispatch(request, *args, **kwargs)

    def get_queryset(self):
        return Category.objects.all()
