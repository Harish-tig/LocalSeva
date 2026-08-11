from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.generics import ListAPIView, RetrieveAPIView, CreateAPIView, UpdateAPIView, DestroyAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.throttling import ScopedRateThrottle
from django.core.cache import cache
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.db import models


from .serializers import (
    RegisterSerializer, LoginSerializer, ProfileSerializer,
    ServiceProviderSerializer, BookingSerializer, BookingUpdateSerializer,
    ReviewSerializer, ReportSerializer, ProductSerializer, ProductCommentSerializer, ResetPasswordSerializer, ForgotPasswordSerializer
)
from .models import Profile, Booking, Review, Report, Product, ProductComment, UserModel

# User = get_user_model()

from django.shortcuts import render

def home(request):
    return render(request, "home.html")

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'register'

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
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

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



class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'otp'

    def post(self, request):
        serializer = ForgotPasswordSerializer(data = request.data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(
                data={
                    "message":"otp sent successfully"
                }
            )
        return Response(
            data={
                "message":"something went wrong!"
            }
        )



class ResetpasswordView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'reset'

    def post(self, request):
        user = UserModel.objects.filter(email=request.data.get('email')).first()
        serializer = ResetPasswordSerializer(instance=user,data=request.data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(
                {"message": "Password reset successful"},
                status=status.HTTP_200_OK
            )
        return Response(
            data={
                "message": "something went wrong!"
            }
        )

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

            # Invalidate providers cache so updated data shows immediately
            try:
                cache.delete("all_service_providers_list")
            except Exception:
                pass

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

        # Set both the user flag AND the profile role so provider appears in listings
        profile.role = "SERVICE"
        profile.save()
        request.user.is_service_provider = True
        request.user.save()

        # Invalidate the providers cache so new provider shows up immediately
        try:
            cache.delete("all_service_providers_list")
        except Exception:
            pass

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

        return queryset

    def filter_cached_data(self, data, params):
        """Apply query param filters directly on cached JSON data — no DB hit"""
        result = list(data)

        # Filter by location (partial match)
        location = params.get('location')
        if location:
            loc = location.lower()
            result = [d for d in result if loc in (d.get('location') or '').lower()]

        # Filter by minimum experience years
        min_experience = params.get('min_experience')
        if min_experience:
            try:
                min_exp = int(min_experience)
                result = [d for d in result if (d.get('experience_years') or 0) >= min_exp]
            except (ValueError, TypeError):
                pass

        # Filter by max base price
        max_price = params.get('max_price')
        if max_price:
            try:
                max_p = float(max_price)
                result = [d for d in result if d.get('base_price') is not None and float(d['base_price']) <= max_p]
            except (ValueError, TypeError):
                pass

        # Filter by category (checks inside the categories JSON array)
        category = params.get('category')
        if category:
            result = [d for d in result if category in (d.get('categories') or [])]

        # Filter by pricing_type (FIXED / FLEXIBLE)
        pricing_type = params.get('pricing_type')
        if pricing_type:
            result = [d for d in result if d.get('pricing_type') == pricing_type]

        # Filter by availability
        is_available = params.get('is_available')
        if is_available is not None:
            val = is_available.lower() in ('true', '1', 'yes')
            result = [d for d in result if bool(d.get('is_available')) == val]

        # Apply ordering (default: -rating)
        ordering = params.get('ordering', '-rating')
        reverse = ordering.startswith('-')
        order_field = ordering.lstrip('-')
        if order_field in ('rating', 'experience_years', 'base_price'):
            result.sort(
                key=lambda d: float(d.get(order_field) or 0),
                reverse=reverse
            )

        return result

    def list(self, request, *args, **kwargs):
        # id lookups go straight to DB, no caching
        if request.query_params.get('id'):
            return super().list(request, *args, **kwargs)

        cache_key = "all_service_providers_list"
        try:
            cached_data = cache.get(cache_key)
        except Exception:
            cached_data = None

        if cached_data is None:
            queryset = Profile.objects.filter(role='SERVICE')
            serializer = self.get_serializer(queryset, many=True)
            cached_data = serializer.data
            try:
                cache.set(cache_key, cached_data, 60)
            except Exception:
                pass

        # No filters — return everything (sorted by rating by default)
        query_params = request.query_params
        has_filters = any(
            query_params.get(k) for k in ('location', 'min_experience', 'max_price', 'category', 'pricing_type', 'is_available', 'ordering')
        )
        if not has_filters:
            return Response(cached_data)

        # Filters present — apply them on the cached data instead of hitting DB
        filtered_data = self.filter_cached_data(cached_data, query_params)
        return Response(filtered_data)


class BookingCreateView(CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BookingSerializer

    def perform_create(self, serializer):
        provider = serializer.validated_data.get('service_provider')
        agreed_price = provider.base_price if provider else None
        serializer.save(user=self.request.user, agreed_price=agreed_price)


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

class BookingCancelView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk, user=request.user)
        except Booking.DoesNotExist:
            return Response({"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)
        
        if booking.status not in ['PENDING', 'ACCEPTED']:
            return Response({"error": "Cannot cancel booking in current status"}, status=status.HTTP_400_BAD_REQUEST)
            
        booking.status = 'CANCELLED'
        booking.save()
        return Response({"message": "Booking cancelled successfully"})



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

    def get_queryset(self):
        # Only used as fallback if cache misses completely
        return Product.objects.filter(is_active=True)

    def filter_cached_data(self, data, params):
        """Apply query param filters directly on cached products — no DB hit"""
        result = list(data)

        # Filter by category
        category = params.get('category')
        if category:
            result = [d for d in result if d.get('category') == category]

        # Filter by condition
        condition = params.get('condition')
        if condition:
            result = [d for d in result if d.get('condition') == condition]

        # Filter by city (partial match)
        city = params.get('city')
        if city:
            result = [d for d in result if city.lower() in (d.get('city') or '').lower()]

        # Filter sold/unsold
        is_sold = params.get('is_sold')
        if is_sold is not None:
            val = is_sold.lower() in ('true', '1', 'yes')
            result = [d for d in result if bool(d.get('is_sold')) == val]

        # Filter by price range
        min_price = params.get('min_price')
        if min_price:
            try:
                result = [d for d in result if float(d.get('price') or 0) >= float(min_price)]
            except (ValueError, TypeError):
                pass

        max_price = params.get('max_price')
        if max_price:
            try:
                result = [d for d in result if float(d.get('price') or 0) <= float(max_price)]
            except (ValueError, TypeError):
                pass

        # Search across title, description, seller name
        search = params.get('search')
        if search:
            s = search.lower()
            result = [
                d for d in result
                if s in (d.get('title') or '').lower()
                or s in (d.get('description') or '').lower()
                or s in (d.get('seller_name') or '').lower()
            ]

        # Apply ordering
        ordering = params.get('ordering', '-created_at')
        reverse = ordering.startswith('-')
        order_field = ordering.lstrip('-')
        if order_field in ('price', 'views', 'created_at'):
            result.sort(
                key=lambda d: d.get(order_field) or 0,
                reverse=reverse
            )

        return result

    def list(self, request, *args, **kwargs):
        cache_key = "all_products_list"
        try:
            cached_data = cache.get(cache_key)
        except Exception:
            cached_data = None

        if cached_data is None:
            queryset = Product.objects.filter(is_active=True)
            serializer = self.get_serializer(queryset, many=True)
            cached_data = serializer.data
            try:
                cache.set(cache_key, cached_data, 60 * 5)
            except Exception:
                pass

        # No filters — return full cached list
        query_params = request.query_params
        has_filters = any(
            query_params.get(k) for k in ('category', 'condition', 'city', 'is_sold', 'min_price', 'max_price', 'search', 'ordering')
        )
        if not has_filters:
            return Response(cached_data)

        # Apply filters on cached data — no DB hit
        filtered_data = self.filter_cached_data(cached_data, query_params)
        return Response(filtered_data)


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
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    serializer_class = ProductSerializer

    def get_queryset(self):
        return Product.objects.all()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Increment view count only if not owner
        if not request.user.is_authenticated or request.user != instance.seller:
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