"""
Object storage configuration for django-storages (S3Boto3Storage).

Backends:
  - local: filesystem under MEDIA_ROOT (development only)
  - minio: S3-compatible MinIO (default for Docker local/demo)
  - s3: Amazon S3 (optional production backend)
"""
import os

from django.core.exceptions import ImproperlyConfigured

_TRUE = frozenset({'1', 'true', 'yes', 'on'})


def _env_bool(name: str, default: str = 'false') -> bool:
    return os.environ.get(name, default).lower() in _TRUE


def resolve_media_storage_backend(*, allow_local: bool = True) -> str:
    """Resolve MEDIA_STORAGE_BACKEND with legacy USE_S3_MEDIA support."""
    backend = os.environ.get('MEDIA_STORAGE_BACKEND', '').strip().lower()
    if backend:
        if backend == 'local' and not allow_local:
            raise ImproperlyConfigured(
                'MEDIA_STORAGE_BACKEND=local is not supported in production.'
            )
        if backend not in {'local', 'minio', 's3'}:
            raise ImproperlyConfigured(
                f'Invalid MEDIA_STORAGE_BACKEND={backend!r}. '
                'Expected one of: local, minio, s3.'
            )
        return backend

    if _env_bool('USE_S3_MEDIA'):
        return 'minio'

    return 'local' if allow_local else 'minio'


def _s3_common_settings() -> dict:
    return {
        'AWS_S3_FILE_OVERWRITE': False,
        'AWS_DEFAULT_ACL': None,
        'DEFAULT_FILE_STORAGE': 'storages.backends.s3boto3.S3Boto3Storage',
    }


def _configure_minio() -> dict:
    bucket = os.environ.get('MINIO_BUCKET_NAME', 'media')
    endpoint = os.environ.get('MINIO_ENDPOINT', 'minio:9000')
    public_endpoint = os.environ.get('MINIO_PUBLIC_ENDPOINT', 'localhost:9000')

    return {
        'AWS_ACCESS_KEY_ID': os.environ.get('MINIO_ROOT_USER', 'minioadmin'),
        'AWS_SECRET_ACCESS_KEY': os.environ.get('MINIO_ROOT_PASSWORD', 'minioadmin'),
        'AWS_STORAGE_BUCKET_NAME': bucket,
        'AWS_S3_ENDPOINT_URL': f'http://{endpoint}',
        'AWS_S3_ADDRESSING_STYLE': 'path',
        'AWS_S3_URL_PROTOCOL': 'http:',
        'AWS_QUERYSTRING_AUTH': False,
        'AWS_S3_CUSTOM_DOMAIN': f'{public_endpoint}/{bucket}',
        'MEDIA_URL': f'http://{public_endpoint}/{bucket}/',
        **_s3_common_settings(),
    }


def _configure_aws_s3() -> dict:
    access_key = os.environ.get('AWS_ACCESS_KEY_ID')
    secret_key = os.environ.get('AWS_SECRET_ACCESS_KEY')
    bucket = os.environ.get('AWS_STORAGE_BUCKET_NAME')
    region = os.environ.get('AWS_S3_REGION_NAME', 'eu-west-2')

    if not all([access_key, secret_key, bucket]):
        raise ImproperlyConfigured(
            'MEDIA_STORAGE_BACKEND=s3 requires AWS_ACCESS_KEY_ID, '
            'AWS_SECRET_ACCESS_KEY, and AWS_STORAGE_BUCKET_NAME.'
        )

    settings = {
        'AWS_ACCESS_KEY_ID': access_key,
        'AWS_SECRET_ACCESS_KEY': secret_key,
        'AWS_STORAGE_BUCKET_NAME': bucket,
        'AWS_S3_REGION_NAME': region,
        'AWS_QUERYSTRING_AUTH': False,
        **_s3_common_settings(),
    }

    custom_domain = os.environ.get('AWS_S3_CUSTOM_DOMAIN', '').strip()
    if custom_domain:
        settings['AWS_S3_CUSTOM_DOMAIN'] = custom_domain
        settings['MEDIA_URL'] = f'https://{custom_domain}/'
    else:
        settings['MEDIA_URL'] = f'https://{bucket}.s3.{region}.amazonaws.com/'

    return settings


def configure_media_storage(globals_dict: dict, *, allow_local: bool = True) -> str:
    """
    Apply media storage settings to a settings module namespace.

    Returns the resolved backend name.
    """
    backend = resolve_media_storage_backend(allow_local=allow_local)

    if backend == 'local':
        base_dir = globals_dict.get('BASE_DIR')
        globals_dict['MEDIA_URL'] = '/media/'
        globals_dict['MEDIA_ROOT'] = base_dir / 'media'
    elif backend == 'minio':
        globals_dict.update(_configure_minio())
    elif backend == 's3':
        globals_dict.update(_configure_aws_s3())

    globals_dict['MEDIA_STORAGE_BACKEND'] = backend
    globals_dict['USE_S3_MEDIA'] = backend in {'minio', 's3'}

    return backend
