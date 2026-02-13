from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator


class UserModel(AbstractUser):
    username = models.CharField(max_length=50, blank=False, null=False, unique=True)
    email = models.EmailField(max_length=50, unique=True)
    is_service_provider = models.BooleanField(default=False)

    def __str__(self):
        return self.username

#changes here
class Profile(models.Model):
    ROLE_CHOICES = [
        ("USER", "User"),
        ("SERVICE", "Service Provider"),
    ]

    PRICING_TYPE_CHOICES = [
        ('FIXED', 'Fixed Price'),  # Base price is fixed, may have additional charges
        ('FLEXIBLE', 'Flexible'),  # Price varies based on location/service description
    ]

    user = models.OneToOneField(UserModel, on_delete=models.CASCADE, related_name="profile")

    # Basic info for all users
    avatar = models.ImageField(upload_to="profiles/", blank=True, null=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="USER")
    bio = models.TextField(max_length=500, blank=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    location = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # Service provider specific fields (only filled when role = "SERVICE")
    experience_years = models.IntegerField(default=0)
    pricing_type = models.CharField(max_length=20, choices=PRICING_TYPE_CHOICES, blank=True)
    base_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True,
                                     help_text="Average base/visiting charge")
    is_available = models.BooleanField(default=True)
    rating = models.FloatField(default=0.0, validators=[MinValueValidator(0), MaxValueValidator(5)])
    total_reviews = models.IntegerField(default=0)

    # Categories and other details
    categories = models.JSONField(default=list, blank=True)
    availability = models.CharField(max_length=100, blank=True)
    description = models.TextField(max_length=200, blank=True)
    service_locations = models.JSONField(default=list, blank=True)

    # Marketplace fields (for all users)
    is_marketplace_seller = models.BooleanField(default=False)
    marketplace_rating = models.FloatField(default=0.0, validators=[MinValueValidator(0), MaxValueValidator(5)])
    marketplace_reviews = models.IntegerField(default=0)

    def __str__(self):
        return self.user.username

    @property
    def is_service_provider(self):
        return self.role == "SERVICE"

    @property
    def completed_bookings_count(self):
        """Get the number of completed bookings for this service provider"""
        if self.role != "SERVICE":
            return 0
        return self.bookings_received.filter(status='COMPLETED').count()


class Booking(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),  # User created booking, waiting for provider response
        ('QUOTE_GIVEN', 'Quote Given'),  # Provider has given a quote with base_price
        ('ACCEPTED', 'Accepted'),  # User accepted the quote
        ('REJECTED', 'Rejected'),  # Provider rejected or user cancelled before quote
        ('IN_PROGRESS', 'In Progress'),  # Service has started
        ('COMPLETED', 'Completed'),  # Service completed, waiting for payment/review
        ('CANCELLED', 'Cancelled'),  # Cancelled after quote acceptance
    ]

    user = models.ForeignKey(UserModel, on_delete=models.CASCADE, related_name="bookings_made")
    service_provider = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="bookings_received",
                                         limit_choices_to={'role': 'SERVICE'})
    service_category = models.TextField()
    description = models.TextField()
    address = models.TextField()
    scheduled_date = models.DateTimeField()

    # Price tracking
    quote_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True,
                                      help_text="Price quoted by provider")
    final_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True,
                                      help_text="Final price paid by user")

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    provider_notes = models.TextField(blank=True)
    user_notes = models.TextField(blank=True)
    price_distribution_note = models.TextField(blank=True)

    # Timestamps for different stages
    created_at = models.DateTimeField(auto_now_add=True)
    quoted_at = models.DateTimeField(null=True, blank=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
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


class Report(models.Model):
    REPORT_TYPE_CHOICES = [
        ('FRAUD', 'Fraud/Scam'),
        ('BAD_SERVICE', 'Poor Service Quality'),
        ('UNPROFESSIONAL', 'Unprofessional Behavior'),
        ('HARASSMENT', 'Harassment'),
        ('SAFETY', 'Safety Concern'),
        ('OTHER', 'Other'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('UNDER_REVIEW', 'Under Review'),
        ('RESOLVED', 'Resolved'),
        ('DISMISSED', 'Dismissed'),
    ]

    reporter = models.ForeignKey(UserModel, on_delete=models.CASCADE, related_name="reports_made")
    reported_user = models.ForeignKey(UserModel, on_delete=models.CASCADE, related_name="reports_received")
    reported_profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="reported_as_provider",
                                         null=True, blank=True)
    booking = models.ForeignKey(Booking, on_delete=models.SET_NULL, null=True, blank=True,
                                help_text="Related booking if applicable")
    report_type = models.CharField(max_length=50, choices=REPORT_TYPE_CHOICES)
    description = models.TextField()
    evidence_image = models.ImageField(upload_to="reports/", blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    admin_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Report #{self.id} - {self.reporter.username} vs {self.reported_user.username}"


class Product(models.Model):
    PRODUCT_CATEGORY_CHOICES = [
        ('FURNITURE', 'Furniture'),
        ('ELECTRONICS', 'Electronics'),
        ('VEHICLES', 'Vehicles'),
        ('REAL_ESTATE', 'Real Estate'),
        ('HOME_APPLIANCES', 'Home Appliances'),
        ('CLOTHING', 'Clothing & Accessories'),
        ('BOOKS', 'Books & Media'),
        ('SPORTS', 'Sports Equipment'),
        ('OTHER', 'Other'),
    ]

    CONDITION_CHOICES = [
        ('NEW', 'New'),
        ('LIKE_NEW', 'Like New'),
        ('GOOD', 'Good'),
        ('FAIR', 'Fair'),
        ('POOR', 'Poor'),
    ]

    seller = models.ForeignKey(UserModel, on_delete=models.CASCADE, related_name="products")
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=PRODUCT_CATEGORY_CHOICES)
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES)
    price = models.DecimalField(max_digits=12, decimal_places=2)

    # Location for pickup/delivery
    address = models.TextField()
    city = models.CharField(max_length=100)

    # Images
    main_image = models.ImageField(upload_to="products/", blank=True, null=True)
    image_2 = models.ImageField(upload_to="products/", blank=True, null=True)
    image_3 = models.ImageField(upload_to="products/", blank=True, null=True)

    # Contact preferences
    contact_phone = models.CharField(max_length=15, blank=True)
    contact_whatsapp = models.CharField(max_length=15, blank=True)
    contact_email = models.BooleanField(default=True)

    # Status
    is_sold = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    views = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.title} - {self.seller.username}"


class ProductComment(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="comments")
    user = models.ForeignKey(UserModel, on_delete=models.CASCADE, related_name="product_comments")
    comment = models.TextField()
    contact_info = models.CharField(max_length=255, blank=True,
                                    help_text="e.g., WhatsApp: 1234567890, Call me at...")
    is_visible = models.BooleanField(default=True,
                                     help_text="Seller can hide inappropriate comments")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Comment on {self.product.title} by {self.user.username}"