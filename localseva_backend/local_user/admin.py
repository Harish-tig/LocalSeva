from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import UserModel, Profile


# Inline admin to show Profile inside User admin
class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = 'Profile'

# Custom User admin
class CustomUserAdmin(UserAdmin):
    model = UserModel
    list_display = ('username', 'email', 'is_service_provider', 'is_staff', 'is_active')
    list_filter = ('is_service_provider', 'is_staff', 'is_active')
    inlines = [ProfileInline]
    fieldsets = (
        (None, {'fields': ('username', 'email', 'password')}),
        ('Permissions', {'fields': ('is_staff', 'is_active', 'is_service_provider', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'is_staff', 'is_active', 'is_service_provider')}
        ),
    )
    search_fields = ('username', 'email')
    ordering = ('username',)

# Register the custom user
admin.site.register(UserModel, CustomUserAdmin)


from django.contrib import admin
from .models import *
admin.site.register(ServiceCategory)
admin.site.register(ServiceProvider)
admin.site.register(Booking)
admin.site.register(Review)