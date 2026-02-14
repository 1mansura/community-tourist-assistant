"""
Test settings: SQLite in-memory so pytest runs without PostgreSQL.
"""
from .dev import *

SECRET_KEY = 'cta-test-secret-key-64-characters-minimum-for-jwt-hmac-safety'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}
