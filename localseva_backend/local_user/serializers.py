# from django.contrib.auth import get_user_model
# from rest_framework import serializers
# from .models import Profile, Booking, Review
# from rest_framework.validators import UniqueValidator
# from django.contrib.auth.password_validation import validate_password
#
# User = get_user_model()
#
#
# class RegisterSerializer(serializers.ModelSerializer):
#     email = serializers.EmailField(
#         required=True,
#         validators=[UniqueValidator(queryset=User.objects.all())]
#     )
#     username = serializers.CharField(
#         required=True,
#         validators=[UniqueValidator(queryset=User.objects.all())]
#     )
#     password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
#     password2 = serializers.CharField(write_only=True, required=True)
#
#     class Meta:
#         model = User
#         fields = ['username', 'email', 'password', 'password2']
#
#     def validate(self, attrs):
#         if attrs['password'] != attrs['password2']:
#             raise serializers.ValidationError({"password": "Password fields didn't match."})
#         return attrs
#
#     def create(self, validated_data):
#         user = User.objects.create_user(
#             username=validated_data['username'],
#             email=validated_data['email'],
#             password=validated_data['password']
#         )
#         return user
#
#
# class LoginSerializer(serializers.Serializer):
#     username = serializers.CharField()
#     password = serializers.CharField(write_only=True)
#
#
# class ProfileSerializer(serializers.ModelSerializer):
#     email = serializers.EmailField(source='user.email', read_only=True)
#     username = serializers.CharField(source='user.username', read_only=True)
#     is_service_provider = serializers.BooleanField(source='user.is_service_provider', read_only=True)
#
#     class Meta:
#         model = Profile
#         fields = [
#             "id", "username", "email", "avatar", "role", "bio", "phone", "location",
#             "experience_years", "pricing_type", "base_price", "hourly_rate",
#             "is_available", "rating", "total_reviews", "created_at", "is_service_provider",
#             "categories","availability","description","service_locations",
#         ]
#         read_only_fields = ["rating", "total_reviews", "created_at", "is_service_provider"]
#
#     def validate(self, data):
#         # If user is trying to become a service provider
#         if 'role' in data and data['role'] == 'SERVICE':
#             # Check if this is a new service provider (role is changing from USER to SERVICE)
#             if self.instance and self.instance.role != 'SERVICE':
#                 # Validate required service provider fields
#                 required_fields = ['experience_years', 'pricing_type']
#
#                 missing_fields = []
#                 for field in required_fields:
#                     if field not in data or data[field] in [None, '']:
#                         missing_fields.append(field)
#
#                 if missing_fields:
#                     raise serializers.ValidationError({
#                         "error": f"Missing required fields to become service provider: {', '.join(missing_fields)}"
#                     })
#
#                 # Validate pricing type specific fields
#                 if data.get('pricing_type') == 'FIXED' and not data.get('base_price'):
#                     raise serializers.ValidationError({
#                         "base_price": "base_price is required for FIXED pricing type"
#                     })
#
#                 if data.get('pricing_type') == 'HOURLY' and not data.get('hourly_rate'):
#                     raise serializers.ValidationError({
#                         "hourly_rate": "hourly_rate is required for HOURLY pricing type"
#                     })
#
#         return data
#
#
# class ServiceProviderSerializer(serializers.ModelSerializer):
#     """For listing service providers - uses Profile model"""
#     username = serializers.CharField(source='user.username', read_only=True)
#     email = serializers.EmailField(source='user.email', read_only=True)
#
#     class Meta:
#         model = Profile
#         fields = [
#             "id", "username", "email", "avatar", "role", "bio", "phone", "location",
#             "experience_years", "pricing_type", "base_price", "hourly_rate",
#             "is_available", "rating", "total_reviews", "created_at", "is_service_provider",
#             "categories", "availability", "description", "service_locations",
#         ]
#         read_only_fields = fields
#
#
#
# class BookingSerializer(serializers.ModelSerializer):
#     user = serializers.PrimaryKeyRelatedField(read_only=True)
#     user_name = serializers.CharField(source='user.username', read_only=True)
#     provider_name = serializers.CharField(source='service_provider.user.username', read_only=True)
#     provider_id = serializers.PrimaryKeyRelatedField(
#         queryset=Profile.objects.filter(role='SERVICE'),
#         source='service_provider'
#     )
#
#     class Meta:
#         model = Booking
#         fields = [
#             'id', 'user', 'user_name', 'service_provider', 'provider_id', 'provider_name',
#             'description', 'address', 'scheduled_date', 'duration_hours', 'total_price',
#             'status', 'provider_notes', 'user_notes', 'created_at', 'updated_at'
#         ]
#         read_only_fields = ['user', 'user_name', 'provider_name', 'created_at', 'updated_at']
#
#     def validate(self, data):
#         from django.utils import timezone
#
#         # Ensure booking is for a future date
#         if data.get('scheduled_date') and data['scheduled_date'] < timezone.now():
#             raise serializers.ValidationError(
#                 {"scheduled_date": "Booking date must be in the future"}
#             )
#
#         # Ensure service provider is available
#         service_provider = data.get('service_provider')
#         if service_provider and not service_provider.is_available:
#             raise serializers.ValidationError(
#                 {"service_provider": "This service provider is not currently available"}
#             )
#
#         # Ensure service provider has role=SERVICE
#         if service_provider and service_provider.role != 'SERVICE':
#             raise serializers.ValidationError(
#                 {"service_provider": "Selected user is not a service provider"}
#             )
#
#         return data
#
#
# class ReviewSerializer(serializers.ModelSerializer):
#     user_name = serializers.CharField(source='user.username', read_only=True)
#     provider_name = serializers.CharField(source='provider.user.username', read_only=True)
#     provider_id = serializers.PrimaryKeyRelatedField(
#         queryset=Profile.objects.filter(role='SERVICE'),
#         source='provider'
#     )
#
#     class Meta:
#         model = Review
#         fields = [
#             'id', 'booking', 'user', 'user_name', 'provider', 'provider_id',
#             'provider_name', 'rating', 'comment', 'created_at'
#         ]
#         read_only_fields = ['user', 'user_name', 'provider_name', 'created_at']
#
#     def validate(self, data):
#         # Ensure booking is completed before reviewing
#         booking = data.get('booking')
#         if booking and booking.status != 'COMPLETED':
#             raise serializers.ValidationError(
#                 {"booking": "Can only review completed bookings"}
#             )
#
#         # Ensure user is reviewing their own booking
#         request = self.context.get('request')
#         if request and booking and booking.user != request.user:
#             raise serializers.ValidationError(
#                 {"booking": "You can only review your own bookings"}
#             )
#
#         # Ensure provider matches booking's provider
#         provider = data.get('provider')
#         if booking and provider and booking.service_provider != provider:
#             raise serializers.ValidationError(
#                 {"provider": "Provider must match the booking's service provider"}
#             )
#
#         return data


from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Profile, Booking, Review, Report, Product, ProductComment
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
            "experience_years", "pricing_type", "base_price", "is_available",
            "rating", "total_reviews", "created_at", "is_service_provider",
            "categories", "availability", "description", "service_locations",
            "is_marketplace_seller", "marketplace_rating", "marketplace_reviews"
        ]
        read_only_fields = [
            "rating", "total_reviews", "created_at", "is_service_provider",
            "marketplace_rating", "marketplace_reviews"
        ]

    def validate(self, data):
        # If user is trying to become a service provider
        if 'role' in data and data['role'] == 'SERVICE':
            # Check if this is a new service provider (role is changing from USER to SERVICE)
            if self.instance and self.instance.role != 'SERVICE':
                # Validate required service provider fields
                required_fields = ['experience_years', 'pricing_type', 'base_price']

                missing_fields = []
                for field in required_fields:
                    if field not in data or data[field] in [None, '']:
                        missing_fields.append(field)

                if missing_fields:
                    raise serializers.ValidationError({
                        "error": f"Missing required fields to become service provider: {', '.join(missing_fields)}"
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
            "experience_years", "pricing_type", "base_price", "is_available",
            "rating", "total_reviews", "created_at", "is_service_provider",
            "categories", "availability", "description", "service_locations"
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
            'id', 'user', 'user_name', 'provider_id', 'provider_name',
            'service_category', 'description', 'address', 'scheduled_date',
            'quote_price', 'final_price', 'status', 'provider_notes', 'user_notes',
            'created_at', 'updated_at', 'quoted_at', 'accepted_at', 'started_at',
            'completed_at'
        ]
        read_only_fields = [
            'user', 'user_name', 'provider_name', 'created_at', 'updated_at',
            'quoted_at', 'accepted_at', 'started_at', 'completed_at'
        ]

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

        # Ensure user has selected a category that the provider offers
        if 'service_category' in data and service_provider:
            # Get provider's categories (stored as JSONField/list)
            provider_categories = service_provider.categories or []

            # If provider has specified categories, validate against them
            if provider_categories:
                if data['service_category'] not in provider_categories:
                    raise serializers.ValidationError({
                        "service_category": f"Service provider does not offer this category. "
                                            f"Available categories: {', '.join(provider_categories)}"
                    })

        # Additional validation for service_category if not checking against provider
        if 'service_category' in data and not data.get('service_category'):
            raise serializers.ValidationError({
                "service_category": "Service category is required"
            })

        return data


class BookingUpdateSerializer(serializers.ModelSerializer):
    """Separate serializer for updating bookings (provider gives quote, user accepts, etc.)"""

    class Meta:
        model = Booking
        fields = ['quote_price', 'provider_notes', 'status', "final_price"]
        extra_kwargs = {
            'quote_price': {'required': False},
            'provider_notes': {'required': False},
        }

    def validate(self, data):
        request = self.context.get('request')
        instance = self.instance

        if not request:
            return data

        # Provider can only give quote or update status
        if request.user.profile == instance.service_provider:
            if 'quote_price' in data:
                if data['quote_price'] and data['quote_price'] <= 0:
                    raise serializers.ValidationError(
                        {"quote_price": "Quote price must be positive"}
                    )
                data['status'] = 'QUOTE_GIVEN'

            if 'status' in data and data['status'] in ['REJECTED', 'IN_PROGRESS', 'COMPLETED']:
                # Validate state transitions
                if instance.status == 'PENDING' and data['status'] == 'REJECTED':
                    pass  # Valid
                elif instance.status == 'ACCEPTED' and data['status'] == 'IN_PROGRESS':
                    pass #valid coz user has accepted and provider is working on it.
                elif instance.status == 'IN_PROGRESS' and data['status'] == 'COMPLETED':
                    pass  # Valid
                else:
                    raise serializers.ValidationError(
                        {"status": f"Cannot change status from {instance.status} to {data['status']}"}
                    )

        # User can accept quote
        if request.user == instance.user:
            if 'status' in data and data['status'] == 'ACCEPTED':
                if instance.status != 'QUOTE_GIVEN':
                    raise serializers.ValidationError(
                        {"status": "Can only accept a booking that has a quote"}
                    )
                if not instance.quote_price:
                    raise serializers.ValidationError(
                        {"status": "Cannot accept booking without a quote price"}
                    )

        return data

    def update(self, instance, validated_data):
        from django.utils import timezone

        # Update timestamps based on status changes
        if 'status' in validated_data:
            if validated_data['status'] == 'QUOTE_GIVEN' and not instance.quoted_at:
                instance.quoted_at = timezone.now()
            elif validated_data['status'] == 'ACCEPTED' and not instance.accepted_at:
                instance.accepted_at = timezone.now()
            elif validated_data['status'] == 'IN_PROGRESS' and not instance.started_at:
                instance.started_at = timezone.now()
            elif validated_data['status'] == 'COMPLETED' and not instance.completed_at:
                instance.completed_at = timezone.now()
                if 'final_price' in validated_data:
                    print(validated_data['final_price'])
                    instance.final_price = validated_data['final_price']
                else:
                    instance.final_price = instance.quote_price #Default final price same as quote


        return super().update(instance, validated_data)


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
            'id', 'booking', 'user', 'user_name', 'provider_id',
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


class ReportSerializer(serializers.ModelSerializer):
    reporter_name = serializers.CharField(source='reporter.username', read_only=True)
    reported_user_name = serializers.CharField(source='reported_user.username', read_only=True)
    reported_profile_id = serializers.PrimaryKeyRelatedField(
        queryset=Profile.objects.filter(role='SERVICE'),
        source='reported_profile',
        required=False,
        allow_null=True
    )

    class Meta:
        model = Report
        fields = [
            'id', 'reporter', 'reporter_name', 'reported_user', 'reported_user_name',
            'reported_profile', 'reported_profile_id', 'booking', 'report_type',
            'description', 'evidence_image', 'status', 'admin_notes', 'created_at',
            'resolved_at'
        ]
        read_only_fields = [
            'reporter', 'reporter_name', 'reported_user_name', 'status',
            'admin_notes', 'created_at', 'resolved_at'
        ]

    def validate(self, data):
        request = self.context.get('request')

        if request:
            # Ensure user can't report themselves
            reported_user = data.get('reported_user')
            if reported_user and reported_user == request.user:
                raise serializers.ValidationError(
                    {"reported_user": "You cannot report yourself"}
                )

            # If reporting a service provider, ensure reported_profile is set
            reported_profile = data.get('reported_profile')
            if reported_profile and reported_profile.role != 'SERVICE':
                raise serializers.ValidationError(
                    {"reported_profile": "Can only report service providers"}
                )

        return data


class ProductSerializer(serializers.ModelSerializer):
    seller_name = serializers.CharField(source='seller.username', read_only=True)
    seller_avatar = serializers.ImageField(source='seller.profile.avatar', read_only=True)
    seller_rating = serializers.FloatField(source='seller.profile.marketplace_rating', read_only=True)
    comment_count = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'seller', 'seller_name', 'seller_avatar', 'seller_rating',
            'title', 'description', 'category', 'condition', 'price',
            'address', 'city', 'main_image', 'image_2', 'image_3',
            'contact_phone', 'contact_whatsapp', 'contact_email',
            'is_sold', 'is_active', 'created_at', 'updated_at', 'views',
            'comment_count'
        ]
        read_only_fields = [
            'seller', 'seller_name', 'seller_avatar', 'seller_rating',
            'created_at', 'updated_at', 'views', 'comment_count'
        ]

    def get_comment_count(self, obj):
        return obj.comments.filter(is_visible=True).count()


class ProductCommentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_avatar = serializers.ImageField(source='user.profile.avatar', read_only=True)

    class Meta:
        model = ProductComment
        fields = [
            'id', 'product', 'user', 'user_name', 'user_avatar',
            'comment', 'contact_info', 'is_visible', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'user_name', 'user_avatar', 'created_at', 'updated_at']