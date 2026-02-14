"""
Local development settings - connects to local PostgreSQL.
"""
from .base import *
import os

DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']

# Local PostgreSQL (installed via Homebrew)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'tourist_assistant',
        'USER': os.environ.get('USER', 'postgres'),
        'PASSWORD': '',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

CORS_ALLOW_ALL_ORIGINS = True

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Relax password validation for easier testing
AUTH_PASSWORD_VALIDATORS = []
