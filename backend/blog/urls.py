from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AdminBlogPostViewSet,
    AdminCategoryViewSet,
    PublicBlogDetailView,
    PublicBlogListView,
    PublicCategoryListView,
)

router = DefaultRouter()
router.register("admin/posts", AdminBlogPostViewSet, basename="admin_blogpost")
router.register("admin/categories", AdminCategoryViewSet, basename="admin_category")

urlpatterns = [
    path("", PublicBlogListView.as_view(), name="blog_list"),
    path("categories/", PublicCategoryListView.as_view(), name="category_list"),
    path("<slug:slug>/", PublicBlogDetailView.as_view(), name="blog_detail"),
    path("", include(router.urls)),
]
