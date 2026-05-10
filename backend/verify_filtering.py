import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django_tenants.utils import schema_context
from classes.views import SubjectAssignmentViewSet
from rest_framework.test import APIRequestFactory, force_authenticate
from accounts.models import User
import json

factory = APIRequestFactory()

with schema_context('makini_school'):
    # 1. Check as Teacher
    teacher_user = User.objects.get(email='onungae5@gmail.com')
    request = factory.get('/api/v1/classes/subject-assignments/')
    force_authenticate(request, user=teacher_user)
    view = SubjectAssignmentViewSet.as_view({'get': 'list'})
    response = view(request)
    print(f"Teacher Assignments Count: {response.data['count']}")
    
    # 2. Check as Admin (should see all)
    admin_user = User.objects.get(email='onungahe@gmail.com')
    request_admin = factory.get('/api/v1/classes/subject-assignments/')
    force_authenticate(request_admin, user=admin_user)
    view_admin = SubjectAssignmentViewSet.as_view({'get': 'list'})
    response_admin = view_admin(request_admin)
    print(f"Admin Assignments Count: {response_admin.data['count']}")
