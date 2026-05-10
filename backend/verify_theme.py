import os
import django
from django.test import RequestFactory
from schools.views_theme import TenantThemeView

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

factory = RequestFactory()
request = factory.get('/api/v1/theme/')

view = TenantThemeView.as_view()
response = view(request)

print(f"Status Code: {response.status_code}")
print(f"Content: {response.data}")
