import os

import django
from django.urls import resolve

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

paths = [
    "/api/v1/accounts/register/",
    "/api/v1/accounts/login/",
    "/api/v1/theme/",
]

for path in paths:
    try:
        match = resolve(path)
        print(f"Path: {path}")
        print(f"  View: {match.func}")
        print(f"  Namespace: {match.namespace}")
        print(f"  URL Name: {match.url_name}")
    except Exception as e:
        print(f"Path: {path} - Error: {e}")
