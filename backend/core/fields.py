from django.db import models
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from cryptography.fernet import Fernet

class EncryptedCharField(models.TextField):
    description = "A field that encrypts data at rest using Fernet"

    def __init__(self, *args, **kwargs):
        # TextField doesn't need max_length parameter
        kwargs.pop('max_length', None)
        super().__init__(*args, **kwargs)

    @property
    def key(self):
        key = getattr(settings, 'FIELD_ENCRYPTION_KEY', None)
        if not key:
            raise ImproperlyConfigured("FIELD_ENCRYPTION_KEY must be defined in settings.")
        if isinstance(key, str):
            key = key.encode('utf-8')
        return key

    @property
    def cipher(self):
        return Fernet(self.key)

    def get_prep_value(self, value):
        value = super().get_prep_value(value)
        if value is None or value == '':
            return value
        if not isinstance(value, str):
            value = str(value)
        # Encrypt
        encrypted = self.cipher.encrypt(value.encode('utf-8'))
        return encrypted.decode('utf-8')

    def from_db_value(self, value, expression, connection):
        if value is None or value == '':
            return value
        try:
            # Decrypt
            decrypted = self.cipher.decrypt(value.encode('utf-8'))
            return decrypted.decode('utf-8')
        except Exception:
            # Fallback if decryption fails (e.g. plaintext)
            return value

    def to_python(self, value):
        if value is None or isinstance(value, str):
            return value
        return self.from_db_value(value, None, None)
