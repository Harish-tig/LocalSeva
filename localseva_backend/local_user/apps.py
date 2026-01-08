from django.apps import AppConfig

class LocalUserConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'local_user'

    def ready(self):
        from . import signals
