"""
Development settings.
"""
import os

from .base import *

DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', 'backend']

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('POSTGRES_DB', 'tourist_assistant'),
        'USER': os.environ.get('POSTGRES_USER', 'postgres'),
        'PASSWORD': os.environ.get('POSTGRES_PASSWORD', 'postgres'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

CORS_ALLOW_ALL_ORIGINS = True

USE_S3_MEDIA = os.environ.get('USE_S3_MEDIA', 'false').lower() in ('1', 'true', 'yes', 'on')

if USE_S3_MEDIA:
    # Docker demo mode: store media in MinIO (S3-compatible object store).
    AWS_ACCESS_KEY_ID = os.environ.get('MINIO_ROOT_USER', 'minioadmin')
    AWS_SECRET_ACCESS_KEY = os.environ.get('MINIO_ROOT_PASSWORD', 'minioadmin')
    AWS_STORAGE_BUCKET_NAME = os.environ.get('MINIO_BUCKET_NAME', 'media')
    AWS_S3_ENDPOINT_URL = f"http://{os.environ.get('MINIO_ENDPOINT', 'minio:9000')}"
    AWS_S3_ADDRESSING_STYLE = 'path'
    AWS_S3_URL_PROTOCOL = 'http:'
    AWS_S3_FILE_OVERWRITE = False
    AWS_DEFAULT_ACL = None
    AWS_QUERYSTRING_AUTH = False
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'

    # Public URL that browsers can access from host machine.
    minio_public_endpoint = os.environ.get('MINIO_PUBLIC_ENDPOINT', 'localhost:9000')
    AWS_S3_CUSTOM_DOMAIN = f"{minio_public_endpoint}/{AWS_STORAGE_BUCKET_NAME}"
    MEDIA_URL = f"http://{minio_public_endpoint}/{AWS_STORAGE_BUCKET_NAME}/"
else:
    MEDIA_URL = '/media/'
    MEDIA_ROOT = BASE_DIR / 'media'
