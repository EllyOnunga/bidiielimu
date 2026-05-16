import json
import os

import django
from accounts.models import User
from django_tenants.utils import schema_context
from exams.views import MarkViewSet
from rest_framework.test import APIRequestFactory, force_authenticate
from students.views import StudentViewSet

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()


factory = APIRequestFactory()

with schema_context("makini_school"):
    user = User.objects.get(email="onungae5@gmail.com")

    print("--- Students Response ---")
    request_students = factory.get("/api/v1/students/?stream=2")
    force_authenticate(request_students, user=user)
    view_students = StudentViewSet.as_view({"get": "list"})
    response_students = view_students(request_students)
    print(json.dumps(response_students.data, indent=2))

    print("\n--- Marks Response ---")
    request_marks = factory.get("/api/v1/exams/marks/?exam=1&subject=1")
    force_authenticate(request_marks, user=user)
    view_marks = MarkViewSet.as_view({"get": "list"})
    response_marks = view_marks(request_marks)
    print(json.dumps(response_marks.data, indent=2))
