"""
Serve uploaded asset files through Django so the Next.js proxy (/api/media/) works
with both filesystem and S3/MinIO storage (browser and SSR never need to reach MinIO directly).
"""
from __future__ import annotations

import mimetypes

from django.core.files.storage import default_storage
from django.http import FileResponse, Http404


def serve_media(request, path: str):
    """
    Stream a file from default_storage by object key (e.g. assets/2026/01/photo.jpg).

    Path traversal is rejected. Works for FileSystemStorage and S3Boto3Storage.
    """
    normalized = path.replace('\\', '/').strip('/')
    if not normalized:
        raise Http404('Empty path')
    if any(part == '..' for part in normalized.split('/')):
        raise Http404('Invalid path')

    if not default_storage.exists(normalized):
        raise Http404('File not found')

    file_handle = default_storage.open(normalized, 'rb')
    content_type, _ = mimetypes.guess_type(normalized)
    return FileResponse(
        file_handle,
        content_type=content_type or 'application/octet-stream',
        as_attachment=False,
    )
