from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.generics import ListAPIView, RetrieveAPIView, CreateAPIView, UpdateAPIView, DestroyAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.db import models
from django.utils import timezone

from .serializers import (
    RegisterSerializer, LoginSerializer, ProfileSerializer,
    ServiceProviderSerializer, BookingSerializer, BookingUpdateSerializer,
    ReviewSerializer, ReportSerializer, ProductSerializer, ProductCommentSerializer
)
from .models import Profile, Booking, Review, Report, Product, ProductComment

User = get_user_model()


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                "message": "User registered successfully",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user_id": user.id,
                "username": user.username
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            user = authenticate(username=data["username"], password=data["password"])

            if user is None:
                return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

            refresh = RefreshToken.for_user(user)

            return Response({
                "message": "Login successful",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user_id": user.id,
                "username": user.username,
                "is_service_provider": user.is_service_provider
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileUpdateView(APIView):
    """
    Single profile endpoint for all users
    Regular users can upgrade to service providers by setting role=SERVICE
    and providing required service provider details
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get user's profile"""
        profile = request.user.profile
        serializer = ProfileSerializer(profile)
        return Response(serializer.data)

    def put(self, request):
        """Update profile - can upgrade to service provider"""
        profile = request.user.profile
        data = request.data.copy()

        # If user is becoming a service provider
        if data.get('role') == 'SERVICE' and profile.role != 'SERVICE':
            # Set role to service
            profile.role = "SERVICE"
            profile.save()
            # Update user model flag
            request.user.is_service_provider = True
            request.user.save()

        serializer = ProfileSerializer(profile, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()

            # Update user's is_service_provider flag based on role
            if 'role' in data:
                request.user.is_service_provider = (data['role'] == 'SERVICE')
                request.user.save()

            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BecomeServiceProviderView(APIView):
    """
    Quick endpoint to mark user as service provider
    User still needs to fill service provider details via ProfileUpdateView
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        profile = request.user.profile

        if profile.role == "SERVICE":
            return Response({
                "message": "You are already a service provider",
                "next_step": "Update your profile to add service provider details"
            }, status=status.HTTP_400_BAD_REQUEST)

        request.user.is_service_provider = True
        request.user.save()

        return Response({
            "message": "You are now marked as a service provider!",
            "next_step": "Please update your profile to add service provider details:",
            "required_fields": {
                "experience_years": "Required",
                "pricing_type": "Required (FIXED or FLEXIBLE)",
                "base_price": "Required (Average base/visiting charge)",
                "bio": "Recommended to describe your services",
                "phone": "Recommended for clients to contact you",
                "location": "Recommended to show where you provide services",
                "categories": "List of services you provide (JSON array)",
                "service_locations": "Areas you serve (JSON array)"
            }
        }, status=status.HTTP_200_OK)


class ServiceProviderListView(ListAPIView):
    """List all service providers (profiles with role=SERVICE)"""
    permission_classes = [permissions.AllowAny]
    serializer_class = ServiceProviderSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['pricing_type', 'is_available']
    search_fields = ['user__username', 'bio', 'location', 'description']
    ordering_fields = ['rating', 'experience_years', 'base_price']

    def get_queryset(self):
        queryset = Profile.objects.filter(role='SERVICE')

        # Filter by ID if provided
        provider_id = self.request.query_params.get('id')
        if provider_id:
            queryset = queryset.filter(id=provider_id)

        # Filter by location if provided
        location = self.request.query_params.get('location', None)
        if location:
            queryset = queryset.filter(location__icontains=location)

        # Filter by min experience if provided
        min_experience = self.request.query_params.get('min_experience', None)
        if min_experience:
            queryset = queryset.filter(experience_years__gte=int(min_experience))

        # Filter by max price if provided
        max_price = self.request.query_params.get('max_price', None)
        if max_price:
            queryset = queryset.filter(base_price__lte=float(max_price))

        # Filter by category if provided (checking JSON array)
        category = self.request.query_params.get('category', None)
        if category:
            # This is a basic filter for JSON array - might need adjustment based on exact JSON structure
            queryset = queryset.filter(categories__contains=[category])

        return queryset


class BookingCreateView(CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BookingSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class BookingListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BookingSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status']

    def get_queryset(self):
        user = self.request.user
        user_type = self.request.query_params.get('type', 'user')

        if user_type == 'provider' and user.is_service_provider:
            # Return bookings where user is the service provider
            return Booking.objects.filter(service_provider=user.profile)
        else:
            # Return bookings where user is the customer
            return Booking.objects.filter(user=user)



#changes in update
class BookingDetailView(RetrieveAPIView, UpdateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return BookingUpdateSerializer
        return BookingSerializer

    def get_queryset(self):
        user = self.request.user
        # Users can see bookings they made OR bookings they received as service providers
        return Booking.objects.filter(
            models.Q(user=user) |
            models.Q(service_provider=user.profile)
        )

    def update(self, request, *args, **kwargs):
        booking = self.get_object()
        user = request.user

        # Use appropriate serializer
        if user.profile == booking.service_provider:
            # Provider can give quote or update status
            serializer = BookingUpdateSerializer(booking, data=request.data, partial=True, context={'request': request})
        elif user == booking.user:
            # User can accept/reject quote or update notes
            data = request.data.copy()
            # User can accept quote, reject quote, or update notes
            if 'status' in data and data['status'] in ['ACCEPTED', 'REJECTED']:
                serializer = BookingUpdateSerializer(booking, data=data, partial=True, context={'request': request})
            else:
                # User updating notes only
                booking.user_notes = data.get('user_notes', booking.user_notes)
                booking.save()
                serializer = BookingSerializer(booking)
                return Response(serializer.data)
        else:
            return Response(
                {"error": "You don't have permission to update this booking"},
                status=status.HTTP_403_FORBIDDEN
            )

        if serializer.is_valid():
            serializer.save()

            # If provider is giving quote, set quoted_at timestamp
            if 'quote_price' in request.data and booking.quoted_at is None:
                booking.quoted_at = timezone.now()
                booking.save()

            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ReviewCreateView(CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ReviewSerializer

    def perform_create(self, serializer):
        review = serializer.save(user=self.request.user)

        # Update provider's rating
        provider = review.provider
        provider.total_reviews += 1
        provider.rating = (
                                  (provider.rating * (provider.total_reviews - 1)) + review.rating
                          ) / provider.total_reviews
        provider.save()


class ProviderReviewsListView(ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ReviewSerializer

    def get_queryset(self):
        provider_id = self.kwargs['provider_id']
        return Review.objects.filter(provider_id=provider_id).order_by('-created_at')


# ============= REPORT SYSTEM =============
class ReportCreateView(CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ReportSerializer

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)


class UserReportsListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ReportSerializer

    def get_queryset(self):
        user = self.request.user
        # Users can see reports they made
        return Report.objects.filter(reporter=user).order_by('-created_at')


# ============= MARKETPLACE =============
class ProductListView(ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'condition', 'city', 'is_sold']
    search_fields = ['title', 'description', 'seller__username']
    ordering_fields = ['price', 'created_at', 'views']

    def get_queryset(self):
        queryset = Product.objects.filter(is_active=True)

        # Filter by price range
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')

        if min_price:
            queryset = queryset.filter(price__gte=float(min_price))
        if max_price:
            queryset = queryset.filter(price__lte=float(max_price))

        return queryset


#changes here
class ProductCreateView(CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ProductSerializer

    def perform_create(self, serializer):
        # Update user's profile to mark as marketplace seller
        profile = self.request.user.profile
        if not profile.is_marketplace_seller:
            profile.is_marketplace_seller = True
            profile.save()

        serializer.save(seller=self.request.user,is_active = True)


class ProductDetailView(RetrieveAPIView, UpdateAPIView, DestroyAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ProductSerializer

    def get_queryset(self):
        return Product.objects.all()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Increment view count
        instance.views += 1
        instance.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        # Only seller can update their product
        if request.user != instance.seller:
            return Response(
                {"error": "You can only update your own products"},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Only seller can delete their product
        if request.user != instance.seller:
            return Response(
                {"error": "You can only delete your own products"},
                status=status.HTTP_403_FORBIDDEN
            )
        instance.is_active = False  # Soft delete
        instance.save()
        return Response({"message": "Product deactivated successfully"}, status=status.HTTP_200_OK)


class ProductCommentCreateView(CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ProductCommentSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ProductCommentListView(ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ProductCommentSerializer

    def get_queryset(self):
        product_id = self.kwargs['product_id']
        return ProductComment.objects.filter(product_id=product_id, is_visible=True).order_by('-created_at')


class ProductCommentDeleteView(DestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = ProductComment.objects.all()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        # Only comment owner or product owner can delete/hide comments
        if request.user != instance.user and request.user != instance.product.seller:
            return Response(
                {"error": "You don't have permission to delete this comment"},
                status=status.HTTP_403_FORBIDDEN
            )

        if request.user == instance.product.seller:
            # Seller can hide inappropriate comments (soft delete)
            instance.is_visible = False
            instance.save()
            return Response({"message": "Comment hidden successfully"}, status=status.HTTP_200_OK)
        else:
            # Comment owner can delete their comment
            instance.delete()
            return Response({"message": "Comment deleted successfully"}, status=status.HTTP_200_OK)


class UserProductsListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ProductSerializer

    def get_queryset(self):
        return Product.objects.filter(seller=self.request.user)


class UserProductCommentsListView(ListAPIView):
    """Get comments on user's products"""
    permission_classes = [IsAuthenticated]
    serializer_class = ProductCommentSerializer

    def get_queryset(self):
        # Get comments on all products owned by the user
        return ProductComment.objects.filter(
            product__seller=self.request.user
        ).order_by('-created_at')