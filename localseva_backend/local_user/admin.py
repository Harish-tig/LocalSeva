# from django.contrib import admin
# from django.contrib.auth.admin import UserAdmin
# from .models import UserModel, Profile, Booking, Review
#
#
# # Inline admin for Profile
# class ProfileInline(admin.StackedInline):
#     model = Profile
#     can_delete = False
#     verbose_name_plural = 'Profile'
#     fields = (
#         'avatar', 'role', 'bio', 'phone', 'location',
#         'experience_years', 'pricing_type', 'base_price', 'hourly_rate',
#         'is_available', 'rating', 'total_reviews'
#     )
#
#
# # Custom User Admin
# class CustomUserAdmin(UserAdmin):
#     model = UserModel
#     list_display = ('username', 'email', 'is_service_provider', 'is_staff', 'is_active')
#     list_filter = ('is_service_provider', 'is_staff', 'is_active')
#     inlines = [ProfileInline]
#
#     fieldsets = (
#         (None, {'fields': ('username', 'email', 'password')}),
#         ('Permissions', {
#             'fields': ('is_staff', 'is_active', 'is_service_provider', 'groups', 'user_permissions')
#         }),
#         ('Important dates', {'fields': ('last_login', 'date_joined')}),
#     )
#
#     add_fieldsets = (
#         (None, {
#             'classes': ('wide',),
#             'fields': ('username', 'email', 'password1', 'password2', 'is_staff', 'is_active', 'is_service_provider')
#         }),
#     )
#
#     search_fields = ('username', 'email')
#     ordering = ('username',)
#
#
# # Profile Admin
# @admin.register(Profile)
# class ProfileAdmin(admin.ModelAdmin):
#     list_display = ('user', 'role', 'location', 'is_available', 'rating', 'experience_years')
#     list_filter = ('role', 'is_available', 'pricing_type')
#     search_fields = ('user__username', 'user__email', 'bio', 'location')
#     list_editable = ('is_available',)
#
#     fieldsets = (
#         ('User Information', {'fields': ('user', 'role')}),
#         ('Personal Details', {'fields': ('avatar', 'bio', 'phone', 'location')}),
#         ('Service Provider Details', {
#             'fields': ('experience_years', 'pricing_type', 'base_price', 'hourly_rate', 'is_available'),
#             'classes': ('collapse',)
#         }),
#         ('Ratings', {
#             'fields': ('rating', 'total_reviews'),
#             'classes': ('collapse',)
#         }),
#         ('Timestamps', {'fields': ('created_at',)}),
#     )
#
#     readonly_fields = ('rating', 'total_reviews', 'created_at')
#
#
# # Booking Admin
# @admin.register(Booking)
# class BookingAdmin(admin.ModelAdmin):
#     list_display = ('id', 'user', 'service_provider', 'status', 'total_price', 'scheduled_date')
#     list_filter = ('status', 'scheduled_date')
#     search_fields = ('user__username', 'service_provider__user__username', 'description', 'address')
#     list_editable = ('status',)
#
#     fieldsets = (
#         ('Booking Information', {'fields': ('user', 'service_provider', 'description', 'address')}),
#         ('Schedule & Pricing', {'fields': ('scheduled_date', 'duration_hours', 'total_price')}),
#         ('Status & Notes', {'fields': ('status', 'provider_notes', 'user_notes')}),
#         ('Timestamps', {'fields': ('created_at', 'updated_at')}),
#     )
#
#     readonly_fields = ('created_at', 'updated_at')
#
#
# # Review Admin
# @admin.register(Review)
# class ReviewAdmin(admin.ModelAdmin):
#     list_display = ('id', 'user', 'provider', 'rating', 'created_at')
#     list_filter = ('rating', 'created_at')
#     search_fields = ('user__username', 'provider__user__username', 'comment')
#
#     fieldsets = (
#         ('Review Details', {'fields': ('booking', 'user', 'provider')}),
#         ('Rating & Feedback', {'fields': ('rating', 'comment')}),
#         ('Timestamp', {'fields': ('created_at',)}),
#     )
#
#     readonly_fields = ('created_at',)
#
#
# # Register models
# admin.site.register(UserModel, CustomUserAdmin)
#
# # Optional: Custom admin site header
# admin.site.site_header = "Service Booking Platform Admin"
# admin.site.site_title = "Service Booking Admin Portal"
# admin.site.index_title = "Welcome to Service Booking Platform Administration"




from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django import forms
from .models import UserModel, Profile, Booking, Review

# Fixed choice lists for dropdowns
CATEGORY_CHOICES = [
    ('CLEANING', 'Cleaning'),
    ('CARPENTER', 'Carpenter'),
    ('ELECTRICAL', 'Electrical'),
    ('PLUMBING', 'Plumbing'),
    ('CERAMIC', 'Ceramic / Tiling'),
    ('FITNESS', 'Fitness'),
    ('DELIVERY_MOVING', 'Delivery & Moving'),
    ('TUTOR_EDUCATION', 'Tutor & Education'),
]

LOCATION_CHOICES = [
    ('Kandivali', 'Kandivali'),
    ('Borivali', 'Borivali'),
    ('Mira Road', 'Mira Road'),
    ('Bhayander', 'Bhayander'),
    ('Malad', 'Malad'),
    ('Andheri', 'Andheri'),
]

# Profile Form with checkbox widgets
class ProfileForm(forms.ModelForm):
    categories = forms.MultipleChoiceField(
        choices=CATEGORY_CHOICES,
        required=False,
        widget=forms.CheckboxSelectMultiple(attrs={'class': 'checkbox-select'}),
        help_text="Select applicable service categories"
    )

    service_locations = forms.MultipleChoiceField(
        choices=LOCATION_CHOICES,
        required=False,
        widget=forms.CheckboxSelectMultiple(attrs={'class': 'checkbox-select'}),
        help_text="Select service locations"
    )

    class Meta:
        model = Profile
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Set initial values from JSONField
        if self.instance and self.instance.pk:
            if self.instance.categories:
                self.initial['categories'] = self.instance.categories
            if self.instance.service_locations:
                self.initial['service_locations'] = self.instance.service_locations

    def save(self, commit=True):
        instance = super().save(commit=False)
        # Save categories and service_locations as JSON lists
        if 'categories' in self.cleaned_data:
            instance.categories = self.cleaned_data['categories']
        if 'service_locations' in self.cleaned_data:
            instance.service_locations = self.cleaned_data['service_locations']

        if commit:
            instance.save()
        return instance


# Profile Inline for User Admin
class ProfileInline(admin.StackedInline):
    form = ProfileForm
    model = Profile
    can_delete = False
    verbose_name_plural = 'Profile'
    classes = ('collapse',)  # Make inline collapsible by default

    fieldsets = (
        ('Basic Information', {
            'fields': ('avatar', 'role', 'bio', 'phone', 'location')
        }),
        ('Service Details', {
            'fields': (
                'experience_years', 'pricing_type',
                'base_price', 'hourly_rate', 'is_available',
                'categories', 'service_locations',
                'availability', 'description'
            ),
            'classes': ('wide',)
        }),
        ('Performance', {
            'fields': ('rating', 'total_reviews'),
        }),
    )

    readonly_fields = ('rating', 'total_reviews')


# User Admin with Profile Inline
@admin.register(UserModel)
class CustomUserAdmin(UserAdmin):
    inlines = [ProfileInline]

    list_display = ('username', 'email', 'is_service_provider', 'is_staff', 'date_joined')
    list_filter = ('is_service_provider', 'is_staff', 'is_active')
    search_fields = ('username', 'email')
    ordering = ('-date_joined',)

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

    # Override to handle categories in inline
    def save_formset(self, request, form, formset, change):
        instances = formset.save(commit=False)
        for instance in instances:
            if isinstance(instance, Profile):
                # Get the categories and locations from the form
                for form in formset.forms:
                    if 'categories' in form.cleaned_data:
                        instance.categories = form.cleaned_data['categories']
                    if 'service_locations' in form.cleaned_data:
                        instance.service_locations = form.cleaned_data['service_locations']
                    break
            instance.save()
        formset.save_m2m()


# Standalone Profile Admin for direct access
@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    form = ProfileForm
    list_display = ('user', 'role', 'location', 'is_available', 'rating', 'categories_display', 'locations_display')
    list_filter = ('role', 'is_available', 'pricing_type')
    search_fields = ('user__username', 'user__email', 'location')
    list_editable = ('is_available',)
    list_per_page = 20

    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'avatar', 'role', 'bio', 'phone', 'location')
        }),
        ('Service Details', {
            'fields': (
                'experience_years', 'pricing_type',
                'base_price', 'hourly_rate', 'is_available',
                'availability', 'description'
            ),
            'classes': ('collapse',)
        }),
        ('Categories & Locations', {
            'fields': ('categories', 'service_locations'),
            'description': 'Select multiple categories and locations using checkboxes'
        }),
        ('Performance', {
            'fields': ('rating', 'total_reviews'),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = ('rating', 'total_reviews')

    def categories_display(self, obj):
        if obj.categories:
            return ', '.join(obj.categories[:3]) + ('...' if len(obj.categories) > 3 else '')
        return '-'
    categories_display.short_description = 'Categories'

    def locations_display(self, obj):
        if obj.service_locations:
            return ', '.join(obj.service_locations[:2]) + ('...' if len(obj.service_locations) > 2 else '')
        return '-'
    locations_display.short_description = 'Locations'

    class Media:
        css = {
            'all': ('admin/css/profile_checkboxes.css',)
        }


# Simplified Booking Admin
@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'service_provider', 'status', 'total_price', 'scheduled_date')
    list_filter = ('status', 'scheduled_date')
    search_fields = ('user__username', 'service_provider__user__username', 'description', 'address')
    list_editable = ('status',)
    list_per_page = 30

    fieldsets = (
        ('Booking Details', {
            'fields': ('user', 'service_provider', 'description', 'address')
        }),
        ('Timing & Cost', {
            'fields': ('scheduled_date', 'duration_hours', 'total_price')
        }),
        ('Status', {
            'fields': ('status', 'provider_notes', 'user_notes')
        }),
    )

    readonly_fields = ('created_at', 'updated_at')


# Simplified Review Admin
@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'provider', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('user__username', 'provider__user__username', 'comment')
    list_per_page = 30

    fieldsets = (
        ('Review Details', {
            'fields': ('booking', 'user', 'provider', 'rating', 'comment')
        }),
    )

    readonly_fields = ('created_at',)


# Custom admin site configuration
admin.site.site_header = "Service Booking Platform Admin"
admin.site.site_title = "Service Booking Admin Portal"
admin.site.index_title = "Welcome to Service Booking Platform Administration"