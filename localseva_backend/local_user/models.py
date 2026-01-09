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

    PRICING_TYPE_CHOICES = [
        ('FIXED', 'Fixed Price'),
        ('HOURLY', 'Hourly Rate'),
        ('PROJECT', 'Project Based'),
        ('FLEXIBLE', 'Flexible'),
    ]

    user = models.OneToOneField(UserModel, on_delete=models.CASCADE, related_name="profile")

    # Basic info for all users
    avatar = models.ImageField(upload_to="static/profiles/", blank=True, null=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="USER")
    bio = models.TextField(max_length=500, blank=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    location = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # Service provider specific fields (only filled when role = "SERVICE")
    experience_years = models.IntegerField(default=0)
    pricing_type = models.CharField(max_length=20, choices=PRICING_TYPE_CHOICES, blank=True)
    base_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    hourly_rate = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    is_available = models.BooleanField(default=True)
    rating = models.FloatField(default=0.0, validators=[MinValueValidator(0), MaxValueValidator(5)])
    total_reviews = models.IntegerField(default=0)

    # CATERGORIES AND OTHER DETAILS
    categories = models.JSONField(default=list, blank=True)
    availability = models.CharField(max_length=100, blank=True)
    description = models.TextField(max_length=200, blank=True)
    service_locations = models.JSONField(default=list , blank = True)

    def __str__(self):
        return self.user.username

    @property
    def is_service_provider(self):
        return self.role == "SERVICE"


class Booking(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ACCEPTED', 'Accepted'),
        ('REJECTED', 'Rejected'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    user = models.ForeignKey(UserModel, on_delete=models.CASCADE, related_name="bookings_made")
    service_provider = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="bookings_received",
                                         limit_choices_to={'role': 'SERVICE'})
    description = models.TextField()
    address = models.TextField()
    scheduled_date = models.DateTimeField()
    duration_hours = models.IntegerField(null=True, blank=True)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True)
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
    provider = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="reviews_received",
                                 limit_choices_to={'role': 'SERVICE'})

    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review by {self.user.username} - {self.rating} stars"


class Reports(models.Model):
    report_from_user = models.ManyToManyField(UserModel, related_name="report")
    pass