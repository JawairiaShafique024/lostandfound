"""
WSGI config for lostandfound_backend project.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lostandfound_backend.settings')

application = get_wsgi_application()
