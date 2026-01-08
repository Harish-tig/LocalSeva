from django.contrib import admin
from django.urls import path, include
from .views import (
    RegisterView, LoginView, ProfileUpdateView,
    BecomeServiceProviderView, ServiceProviderProfileView,
    ServiceCategoryListView, ServiceProviderListView,
    BookingCreateView, BookingListView, BookingDetailView,
    ReviewCreateView, ProviderReviewsListView
)

urlpatterns = [
    # Authentication
    path('register/', RegisterView.as_view(), name="register"),
    path('login/', LoginView.as_view(), name="login"),

    # Profile
    path('profile/', ProfileUpdateView.as_view(), name="profile"),
    path('profile/become-provider/', BecomeServiceProviderView.as_view(), name="become-provider"),
    path('profile/service-provider/', ServiceProviderProfileView.as_view(), name="service-provider-profile"),

    # Service Categories
    path('categories/', ServiceCategoryListView.as_view(), name="categories"),

    # Service Providers
    path('providers/', ServiceProviderListView.as_view(), name="providers"),
    path('providers/<int:provider_id>/reviews/', ProviderReviewsListView.as_view(), name="provider-reviews"),

    # Bookings
    path('bookings/', BookingListView.as_view(), name="bookings"),
    path('bookings/create/', BookingCreateView.as_view(), name="create-booking"),
    path('bookings/<int:pk>/', BookingDetailView.as_view(), name="booking-detail"),

    # Reviews
    path('reviews/create/', ReviewCreateView.as_view(), name="create-review"),
]
