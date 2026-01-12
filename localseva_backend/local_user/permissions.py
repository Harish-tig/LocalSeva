# from rest_framework import permissions
#
#
# class IsOwnerOrReadOnly(permissions.BasePermission):
#     """
#     Custom permission to only allow owners of an object to edit it.
#     """
#
#     def has_object_permission(self, request, view, obj):
#         # Read permissions are allowed to any request
#         if request.method in permissions.SAFE_METHODS:
#             return True
#
#         # Write permissions are only allowed to the owner
#         return obj.user == request.user
#
#
# class IsProviderOrReadOnly(permissions.BasePermission):
#     """
#     Custom permission to only allow service providers to edit certain fields.
#     """
#
#     def has_object_permission(self, request, view, obj):
#         # Read permissions are allowed to any request
#         if request.method in permissions.SAFE_METHODS:
#             return True
#
#         # Write permissions for status updates are only allowed to the provider
#         if 'status' in request.data:
#             return request.user.is_service_provider and obj.service_provider.user == request.user
#
#         return True

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


class IsSellerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow product sellers to edit their products.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the seller
        return obj.seller == request.user


class IsCommentOwnerOrSeller(permissions.BasePermission):
    """
    Custom permission to allow comment owner or product seller to manage comments.
    """

    def has_object_permission(self, request, view, obj):
        # Comment owner can edit/delete their comment
        if obj.user == request.user:
            return True

        # Product seller can hide comments on their products
        if obj.product.seller == request.user:
            return True

        return False