import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

import json

from django_tenants.utils import schema_context
from rest_framework.test import APIRequestFactory, force_authenticate

from accounts.models import User
from exams.views import ExamViewSet

factory = APIRequestFactory()
request = factory.get("/api/v1/exams/exams/")

with schema_context("makini_school"):
    user = User.objects.get(email="onungae5@gmail.com")
    force_authenticate(request, user=user)
    view = ExamViewSet.as_view({"get": "list"})
    response = view(request)
    print(json.dumps(response.data, indent=2))
