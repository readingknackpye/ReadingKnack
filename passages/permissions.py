from rest_framework.permissions import BasePermission


class IsTeacher(BasePermission):
    message = "Only teacher accounts can perform this action."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        profile = getattr(user, 'profile', None)
        return bool(profile and profile.role == 'teacher')
