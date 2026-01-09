from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Profile, Booking, Review
from rest_framework.validators import UniqueValidator
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    username = serializers.CharField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class ProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    is_service_provider = serializers.BooleanField(source='user.is_service_provider', read_only=True)

    class Meta:
        model = Profile
        fields = [
            "id", "username", "email", "avatar", "role", "bio", "phone", "location",
            "experience_years", "pricing_type", "base_price", "hourly_rate",
            "is_available", "rating", "total_reviews", "created_at", "is_service_provider",
            "categories","availability","description","service_locations",
        ]
        read_only_fields = ["rating", "total_reviews", "created_at", "is_service_provider"]

    def validate(self, data):
        # If user is trying to become a service provider
        if 'role' in data and data['role'] == 'SERVICE':
            # Check if this is a new service provider (role is changing from USER to SERVICE)
            if self.instance and self.instance.role != 'SERVICE':
                # Validate required service provider fields
                required_fields = ['experience_years', 'pricing_type']

                missing_fields = []
                for field in required_fields:
                    if field not in data or data[field] in [None, '']:
                        missing_fields.append(field)

                if missing_fields:
                    raise serializers.ValidationError({
                        "error": f"Missing required fields to become service provider: {', '.join(missing_fields)}"
                    })

                # Validate pricing type specific fields
                if data.get('pricing_type') == 'FIXED' and not data.get('base_price'):
                    raise serializers.ValidationError({
                        "base_price": "base_price is required for FIXED pricing type"
                    })

                if data.get('pricing_type') == 'HOURLY' and not data.get('hourly_rate'):
                    raise serializers.ValidationError({
                        "hourly_rate": "hourly_rate is required for HOURLY pricing type"
                    })

        return data


class ServiceProviderSerializer(serializers.ModelSerializer):
    """For listing service providers - uses Profile model"""
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Profile
        fields = [
            "id", "username", "email", "avatar", "role", "bio", "phone", "location",
            "experience_years", "pricing_type", "base_price", "hourly_rate",
            "is_available", "rating", "total_reviews", "created_at", "is_service_provider",
            "categories", "availability", "description", "service_locations",
        ]
        read_only_fields = fields



class BookingSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    provider_name = serializers.CharField(source='service_provider.user.username', read_only=True)
    provider_id = serializers.PrimaryKeyRelatedField(
        queryset=Profile.objects.filter(role='SERVICE'),
        source='service_provider'
    )

    class Meta:
        model = Booking
        fields = [
            'id', 'user', 'user_name', 'service_provider', 'provider_id', 'provider_name',
            'description', 'address', 'scheduled_date', 'duration_hours', 'total_price',
            'status', 'provider_notes', 'user_notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'user_name', 'provider_name', 'created_at', 'updated_at']

    def validate(self, data):
        from django.utils import timezone

        # Ensure booking is for a future date
        if data.get('scheduled_date') and data['scheduled_date'] < timezone.now():
            raise serializers.ValidationError(
                {"scheduled_date": "Booking date must be in the future"}
            )

        # Ensure service provider is available
        service_provider = data.get('service_provider')
        if service_provider and not service_provider.is_available:
            raise serializers.ValidationError(
                {"service_provider": "This service provider is not currently available"}
            )

        # Ensure service provider has role=SERVICE
        if service_provider and service_provider.role != 'SERVICE':
            raise serializers.ValidationError(
                {"service_provider": "Selected user is not a service provider"}
            )

        return data


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    provider_name = serializers.CharField(source='provider.user.username', read_only=True)
    provider_id = serializers.PrimaryKeyRelatedField(
        queryset=Profile.objects.filter(role='SERVICE'),
        source='provider'
    )

    class Meta:
        model = Review
        fields = [
            'id', 'booking', 'user', 'user_name', 'provider', 'provider_id',
            'provider_name', 'rating', 'comment', 'created_at'
        ]
        read_only_fields = ['user', 'user_name', 'provider_name', 'created_at']

    def validate(self, data):
        # Ensure booking is completed before reviewing
        booking = data.get('booking')
        if booking and booking.status != 'COMPLETED':
            raise serializers.ValidationError(
                {"booking": "Can only review completed bookings"}
            )

        # Ensure user is reviewing their own booking
        request = self.context.get('request')
        if request and booking and booking.user != request.user:
            raise serializers.ValidationError(
                {"booking": "You can only review your own bookings"}
            )

        # Ensure provider matches booking's provider
        provider = data.get('provider')
        if booking and provider and booking.service_provider != provider:
            raise serializers.ValidationError(
                {"provider": "Provider must match the booking's service provider"}
            )

        return data