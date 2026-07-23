from rest_framework.permissions import BasePermission


class IsTeacher(BasePermission):
    message = "Only teacher accounts or admins can perform this action."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
            
        # allow admins and staff to bypass the profile check
        if user.is_staff or user.is_superuser:
            return True
            
        profile = getattr(user, 'profile', None)
        return bool(profile and profile.role == 'teacher')
