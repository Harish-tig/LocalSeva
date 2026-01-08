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

from .serializers import (
    RegisterSerializer, LoginSerializer, ProfileSerializer,
    ServiceProviderSerializer, ServiceCategorySerializer,
    BookingSerializer, ReviewSerializer
)
from .models import Profile, ServiceCategory, ServiceProvider, Booking, Review
from .permissions import IsOwnerOrReadOnly, IsProviderOrReadOnly

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
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        serializer = ProfileSerializer(profile)
        return Response(serializer.data)

    def put(self, request):
        profile = request.user.profile
        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BecomeServiceProviderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        # Check if already a service provider
        if hasattr(user, 'service_provider'):
            return Response(
                {"message": "You are already a service provider"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update user profile
        profile = user.profile
        profile.role = "SERVICE"
        profile.save()

        # Update user model
        user.is_service_provider = True
        user.save()

        return Response({
            "message": "Profile updated to service provider",
            "is_service_provider": True
        }, status=status.HTTP_200_OK)


class ServiceProviderProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            provider = ServiceProvider.objects.get(user=request.user)
            serializer = ServiceProviderSerializer(provider)
            return Response(serializer.data)
        except ServiceProvider.DoesNotExist:
            return Response(
                {"error": "Service provider profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    def post(self, request):
        if not request.user.is_service_provider:
            return Response(
                {"error": "User is not a service provider"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if profile already exists
        if hasattr(request.user, 'service_provider'):
            return Response(
                {"error": "Service provider profile already exists"},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ServiceProviderSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        try:
            provider = ServiceProvider.objects.get(user=request.user)
            serializer = ServiceProviderSerializer(provider, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except ServiceProvider.DoesNotExist:
            return Response(
                {"error": "Service provider profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )


class ServiceCategoryListView(ListAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = ServiceCategory.objects.all()
    serializer_class = ServiceCategorySerializer


class ServiceProviderListView(ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ServiceProviderSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['categories', 'pricing_type', 'is_available']
    search_fields = ['user__username', 'description', 'user__profile__location']
    ordering_fields = ['rating', 'experience_years', 'base_price']

    def get_queryset(self):
        queryset = ServiceProvider.objects.all()

        # Filter by location if provided
        location = self.request.query_params.get('location', None)
        if location:
            queryset = queryset.filter(user__profile__location__icontains=location)

        # Filter by category if provided
        category_id = self.request.query_params.get('category', None)
        if category_id:
            queryset = queryset.filter(categories__id=category_id)

        return queryset.distinct()


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
            try:
                provider = ServiceProvider.objects.get(user=user)
                return Booking.objects.filter(service_provider=provider)
            except ServiceProvider.DoesNotExist:
                return Booking.objects.none()
        else:
            return Booking.objects.filter(user=user)


class BookingDetailView(RetrieveAPIView, UpdateAPIView):
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    serializer_class = BookingSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_service_provider:
            try:
                provider = ServiceProvider.objects.get(user=user)
                return Booking.objects.filter(service_provider=provider)
            except ServiceProvider.DoesNotExist:
                return Booking.objects.none()
        return Booking.objects.filter(user=user)

    def put(self, request, *args, **kwargs):
        booking = self.get_object()
        user = request.user

        # Only providers can accept/reject bookings
        if user.is_service_provider and 'status' in request.data:
            new_status = request.data['status']
            if new_status in ['ACCEPTED', 'REJECTED']:
                booking.status = new_status

                # Add provider notes if provided
                if 'provider_notes' in request.data:
                    booking.provider_notes = request.data['provider_notes']

                booking.save()
                serializer = self.get_serializer(booking)
                return Response(serializer.data)

        # Users can only update their notes
        if 'user_notes' in request.data:
            booking.user_notes = request.data['user_notes']
            booking.save()
            serializer = self.get_serializer(booking)
            return Response(serializer.data)

        return Response(
            {"error": "You can only update status if you are the provider"},
            status=status.HTTP_403_FORBIDDEN
        )


class ReviewCreateView(CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ReviewSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

        # Update provider rating
        provider = serializer.validated_data['provider']
        provider.total_reviews += 1
        provider.rating = (provider.rating * (provider.total_reviews - 1) +
                           serializer.validated_data['rating']) / provider.total_reviews
        provider.save()


class ProviderReviewsListView(ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ReviewSerializer

    def get_queryset(self):
        provider_id = self.kwargs['provider_id']
        return Review.objects.filter(provider_id=provider_id).order_by('-created_at')