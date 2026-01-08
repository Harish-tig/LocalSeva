from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Profile, ServiceCategory, ServiceProvider, Booking, Review
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
        fields = ["id", "username", "email", "avatar", "role", "bio", "phone",
                  "location", "created_at", "is_service_provider"]


class ServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCategory
        fields = '__all__'


class ServiceProviderSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    categories = ServiceCategorySerializer(many=True, read_only=True)
    category_ids = serializers.PrimaryKeyRelatedField(
        queryset=ServiceCategory.objects.all(),
        many=True,
        write_only=True,
        source='categories'
    )
    profile = ProfileSerializer(source='user.profile', read_only=True)

    class Meta:
        model = ServiceProvider
        fields = [
            'id', 'user', 'username', 'email', 'profile', 'categories', 'category_ids',
            'description', 'experience_years', 'pricing_type', 'base_price',
            'hourly_rate', 'is_available', 'rating', 'total_reviews',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['rating', 'total_reviews', 'created_at', 'updated_at']


class BookingSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    provider_name = serializers.CharField(source='service_provider.user.username', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'user', 'user_name', 'service_provider', 'provider_name',
            'category', 'category_name', 'description', 'address',
            'scheduled_date', 'duration_hours', 'total_price', 'status',
            'provider_notes', 'user_notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, data):
        # Ensure booking is for a future date
        from django.utils import timezone
        if data.get('scheduled_date') and data['scheduled_date'] < timezone.now():
            raise serializers.ValidationError({"scheduled_date": "Booking date must be in the future"})

        # Ensure provider is available
        if data.get('service_provider') and not data['service_provider'].is_available:
            raise serializers.ValidationError({"service_provider": "This provider is not currently available"})

        return data


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    provider_name = serializers.CharField(source='provider.user.username', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'booking', 'user', 'user_name', 'provider', 'provider_name',
                  'rating', 'comment', 'created_at']
        read_only_fields = ['created_at']

    def validate(self, data):
        # Ensure user can only review completed bookings
        if data['booking'].status != 'COMPLETED':
            raise serializers.ValidationError({"booking": "Can only review completed bookings"})

        # Ensure user can only review their own bookings
        request = self.context.get('request')
        if request and data['booking'].user != request.user:
            raise serializers.ValidationError({"booking": "You can only review your own bookings"})

        return data