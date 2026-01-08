from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import UserModel, Profile

@receiver(post_save, sender=UserModel)
def create_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
