from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.generics import ListAPIView, RetrieveAPIView, CreateAPIView, UpdateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.db import models



from .serializers import (
    RegisterSerializer, LoginSerializer, ProfileSerializer,
    ServiceProviderSerializer, BookingSerializer, ReviewSerializer
)
from .models import Profile, Booking, Review

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
        print(data)
        # If user is becoming a service provider
        if data.get('role') == 'SERVICE' and profile.role != 'SERVICE':
            #set role to service
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
                "pricing_type": "Required (FIXED, HOURLY, PROJECT, or FLEXIBLE)",
                "base_price": "Required if pricing_type is FIXED",
                "hourly_rate": "Required if pricing_type is HOURLY",
                "bio": "Recommended to describe your services",
                "phone": "Recommended for clients to contact you",
                "location": "Recommended to show where you provide services"
            }
        }, status=status.HTTP_200_OK)


class ServiceProviderListView(ListAPIView):
    """List all service providers (profiles with role=SERVICE)"""
    permission_classes = [permissions.AllowAny]
    serializer_class = ServiceProviderSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['pricing_type', 'is_available']
    search_fields = ['user__username', 'bio', 'location']
    ordering_fields = ['rating', 'experience_years', 'base_price']


    def get_queryset(self):
        queryset = Profile.objects.filter(role='SERVICE')

        #if id
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


class BookingDetailView(RetrieveAPIView, UpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BookingSerializer

    def get_queryset(self):
        user = self.request.user
        # Users can see bookings they made OR bookings they received as service providers
        return Booking.objects.filter(
            models.Q(user=user) |
            models.Q(service_provider=user.profile)
        )

    def put(self, request, *args, **kwargs):
        booking = self.get_object()
        user = request.user

        # Service provider can update status and provider_notes
        if user.profile == booking.service_provider:
            allowed_fields = ['status', 'provider_notes']
            update_data = {k: v for k, v in request.data.items() if k in allowed_fields}

            for field, value in update_data.items():
                setattr(booking, field, value)

            booking.save()
            serializer = self.get_serializer(booking)
            return Response(serializer.data)

        # Regular user can only update their notes
        elif user == booking.user:
            if 'user_notes' in request.data:
                booking.user_notes = request.data['user_notes']
                booking.save()
                serializer = self.get_serializer(booking)
                return Response(serializer.data)

        return Response(
            {"error": "You don't have permission to update this booking"},
            status=status.HTTP_403_FORBIDDEN
        )


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