from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import UserModel, Profile, Booking, Review, Report, Product, ProductComment


class ProfileInline(admin.StackedInline):
    """Inline admin for Profile - checks if profile exists"""
    model = Profile
    can_delete = False
    verbose_name_plural = 'Profile'
    fields = ('avatar', 'role', 'bio', 'phone', 'location', 'is_available')
    readonly_fields = ('rating', 'total_reviews', 'created_at')

    # Don't show the form if profile already exists (created by signal)
    def has_add_permission(self, request, obj=None):
        if obj and hasattr(obj, 'profile'):
            return False  # Don't show add button if profile exists
        return True

    # Don't show delete option
    def has_delete_permission(self, request, obj=None):
        return False


# ============= MODIFIED USER ADMIN =============
@admin.register(UserModel)
class CustomUserAdmin(UserAdmin):
    """User admin with profile inline that prevents duplicates"""
    list_display = ('username', 'email', 'is_service_provider', 'is_staff', 'date_joined')
    list_filter = ('is_service_provider', 'is_staff', 'is_active')
    search_fields = ('username', 'email')
    ordering = ('-date_joined',)

    # Only add inline for existing users, not new ones
    def get_inline_instances(self, request, obj=None):
        if obj and hasattr(obj, 'profile'):
            # If user already has profile, show inline to edit it
            return [ProfileInline(self.model, self.admin_site)]
        return []

    fieldsets = (
        ('Basic Info', {'fields': ('username', 'email', 'password')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_service_provider')}),
        ('Important Dates', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2',
                       'is_staff', 'is_active', 'is_service_provider'),
        }),
    )

    # Override save to handle profile creation properly
    def save_model(self, request, obj, form, change):
        # Save the user first
        super().save_model(request, obj, form, change)

        # If it's a new user and doesn't have a profile, create one
        if not change and not hasattr(obj, 'profile'):
            Profile.objects.create(user=obj)


# ============= OTHER ADMINS (UNCHANGED) =============
@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    """Profile admin for standalone access"""
    list_display = ('user', 'role', 'location', 'is_available', 'rating', 'experience_years')
    list_filter = ('role', 'is_available', 'pricing_type')
    search_fields = ('user__username', 'user__email', 'location', 'bio')
    list_editable = ('is_available',)


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    """Booking admin"""
    list_display = ('id', 'user', 'get_provider', 'status', 'service_category', 'quote_price', 'scheduled_date')
    list_filter = ('status', 'scheduled_date', 'service_category')
    search_fields = ('user__username', 'service_provider__user__username', 'description', 'address')
    list_editable = ('status',)

    def get_provider(self, obj):
        return obj.service_provider.user.username

    get_provider.short_description = 'Provider'


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    """Review admin"""
    list_display = ('id', 'user', 'get_provider', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('user__username', 'provider__user__username', 'comment')

    def get_provider(self, obj):
        return obj.provider.user.username

    get_provider.short_description = 'Provider'


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    """Report admin"""
    list_display = ('id', 'reporter', 'reported_user', 'report_type', 'status', 'created_at')
    list_filter = ('report_type', 'status', 'created_at')
    search_fields = ('reporter__username', 'reported_user__username', 'description')
    list_editable = ('status',)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """Product admin"""
    list_display = ('title', 'seller', 'category', 'price', 'is_sold', 'is_active', 'created_at')
    list_filter = ('category', 'condition', 'is_sold', 'is_active')
    search_fields = ('title', 'description', 'seller__username', 'city')
    list_editable = ('is_sold', 'is_active')


@admin.register(ProductComment)
class ProductCommentAdmin(admin.ModelAdmin):
    """Product comment admin"""
    list_display = ('id', 'product', 'user', 'is_visible', 'created_at')
    list_filter = ('is_visible', 'created_at')
    search_fields = ('product__title', 'user__username', 'comment')
    list_editable = ('is_visible',)


# ============= ADMIN SITE CONFIGURATION =============
admin.site.site_header = "Service Booking Platform Admin"
admin.site.site_title = "Service Booking Admin"
admin.site.index_title = "Dashboard"
admin.site.index_title = "Dashboard"