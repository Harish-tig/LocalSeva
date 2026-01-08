from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner
        return obj.user == request.user


class IsProviderOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow service providers to edit certain fields.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions for status updates are only allowed to the provider
        if 'status' in request.data:
            return request.user.is_service_provider and obj.service_provider.user == request.user

        return True