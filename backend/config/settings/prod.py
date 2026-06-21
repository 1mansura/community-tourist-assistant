"""
Production settings.
"""
import os

from .base import *
from .storage import configure_media_storage

DEBUG = False

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('POSTGRES_DB'),
        'USER': os.environ.get('POSTGRES_USER'),
        'PASSWORD': os.environ.get('POSTGRES_PASSWORD'),
        'HOST': os.environ.get('DB_HOST', 'db'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

CORS_ALLOWED_ORIGINS = os.environ.get('CORS_ORIGINS', '').split(',')

configure_media_storage(globals(), allow_local=False)
