from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator


class UserModel(AbstractUser):
    username = models.CharField(max_length=50, blank=False, null=False, unique=True)
    email = models.EmailField(max_length=50, unique=True)
    is_service_provider = models.BooleanField(default=False)

    def __str__(self):
        return self.username


class Profile(models.Model):
    ROLE_CHOICES = [
        ("USER", "User"),
        ("SERVICE", "Service Provider"),
    ]
    user = models.OneToOneField(UserModel, on_delete=models.CASCADE, related_name="profile")
    avatar = models.ImageField(upload_to="static/profiles/", blank=True, null=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="USER")
    bio = models.TextField(max_length=500, blank=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    location = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.username


class ServiceCategory(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)  # For frontend icons

    def __str__(self):
        return self.name


class ServiceProvider(models.Model):
    PRICING_TYPE_CHOICES = [
        ('FIXED', 'Fixed Price'),
        ('HOURLY', 'Hourly Rate'),
        ('PROJECT', 'Project Based'),
        ('FLEXIBLE', 'Flexible'),
    ]

    user = models.OneToOneField(UserModel, on_delete=models.CASCADE, related_name="service_provider")
    categories = models.ManyToManyField(ServiceCategory, related_name="providers")
    description = models.TextField()
    experience_years = models.IntegerField(validators=[MinValueValidator(0)])
    pricing_type = models.CharField(max_length=20, choices=PRICING_TYPE_CHOICES)
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    hourly_rate = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    is_available = models.BooleanField(default=True)
    rating = models.FloatField(default=0.0, validators=[MinValueValidator(0), MaxValueValidator(5)])
    total_reviews = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - Service Provider"


class Booking(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ACCEPTED', 'Accepted'),
        ('REJECTED', 'Rejected'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    user = models.ForeignKey(UserModel, on_delete=models.CASCADE, related_name="bookings")
    service_provider = models.ForeignKey(ServiceProvider, on_delete=models.CASCADE, related_name="bookings")
    category = models.ForeignKey(ServiceCategory, on_delete=models.SET_NULL, null=True)
    description = models.TextField()
    address = models.TextField()
    scheduled_date = models.DateTimeField()
    duration_hours = models.IntegerField(null=True, blank=True)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    provider_notes = models.TextField(blank=True)
    user_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Booking #{self.id} - {self.user.username} to {self.service_provider.user.username}"


class Review(models.Model):
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name="review")
    user = models.ForeignKey(UserModel, on_delete=models.CASCADE, related_name="reviews_given")
    provider = models.ForeignKey(ServiceProvider, on_delete=models.CASCADE, related_name="reviews")
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review by {self.user.username} - {self.rating} stars"