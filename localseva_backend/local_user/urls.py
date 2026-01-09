from django.contrib import admin
from django.urls import path, include
from .views import (
    RegisterView, LoginView, ProfileUpdateView,
    BecomeServiceProviderView, ServiceProviderListView,
    BookingCreateView, BookingListView, BookingDetailView,
    ReviewCreateView, ProviderReviewsListView
)

urlpatterns = [
    # Authentication
    path('register/', RegisterView.as_view(), name="register"),
    path('login/', LoginView.as_view(), name="login"),

    # Profile Management (single profile for all users)
    path('profile/', ProfileUpdateView.as_view(), name="profile"),
    path('profile/become-provider/', BecomeServiceProviderView.as_view(), name="become-provider"),

    # Service Providers Listing
    path('providers/', ServiceProviderListView.as_view(), name="providers"),
    # path('providers/<int:id>/', ServiceProviderListView.as_view(), name="providers"),
    path('providers/<int:provider_id>/reviews/', ProviderReviewsListView.as_view(), name="provider-reviews"),

    # Bookings
    path('bookings/', BookingListView.as_view(), name="bookings"),
    path('bookings/create/', BookingCreateView.as_view(), name="create-booking"),
    path('bookings/<int:pk>/', BookingDetailView.as_view(), name="booking-detail"),

    # Reviews
    path('reviews/create/', ReviewCreateView.as_view(), name="create-review"),
]