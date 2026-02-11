from django.urls import path, include
from .views import (
    RegisterView, LoginView, ProfileUpdateView,
    BecomeServiceProviderView, ServiceProviderListView,
    BookingCreateView, BookingListView, BookingDetailView,
    ReviewCreateView, ProviderReviewsListView,
    ReportCreateView, UserReportsListView,
    ProductListView, ProductCreateView, ProductDetailView,
    ProductCommentCreateView, ProductCommentListView, ProductCommentDeleteView,
    UserProductsListView, UserProductCommentsListView, home
)

urlpatterns = [
    #landing
    path("", home, name="home"),
    # Authentication
    path('register/', RegisterView.as_view(), name="register"),
    path('login/', LoginView.as_view(), name="login"),

    # Profile Management
    path('profile/', ProfileUpdateView.as_view(), name="profile"),
    path('profile/become-provider/', BecomeServiceProviderView.as_view(), name="become-provider"),

    # Service Providers Listing
    path('providers/', ServiceProviderListView.as_view(), name="providers"),
    path('providers/<int:provider_id>/reviews/', ProviderReviewsListView.as_view(), name="provider-reviews"),

    # Bookings (Simplified Flow)
    path('bookings/', BookingListView.as_view(), name="bookings"),
    path('bookings/create/', BookingCreateView.as_view(), name="create-booking"),
    path('bookings/<int:pk>/', BookingDetailView.as_view(), name="booking-detail"),

    # Reviews
    path('reviews/create/', ReviewCreateView.as_view(), name="create-review"),

    # Reports System
    path('reports/create/', ReportCreateView.as_view(), name="create-report"),
    path('reports/my/', UserReportsListView.as_view(), name="my-reports"),

    # Marketplace (OLX-like)
    path('marketplace/', ProductListView.as_view(), name="marketplace"),
    path('marketplace/create/', ProductCreateView.as_view(), name="create-product"),
    path('marketplace/<int:pk>/', ProductDetailView.as_view(), name="product-detail"),
    path('marketplace/my-products/', UserProductsListView.as_view(), name="my-products"),

    # Product Comments
    path('marketplace/<int:product_id>/comments/', ProductCommentListView.as_view(), name="product-comments"),
    path('marketplace/comments/create/', ProductCommentCreateView.as_view(), name="create-comment"),
    path('marketplace/comments/<int:pk>/delete/', ProductCommentDeleteView.as_view(), name="delete-comment"),
    path('marketplace/my-product-comments/', UserProductCommentsListView.as_view(), name="my-product-comments"),
]