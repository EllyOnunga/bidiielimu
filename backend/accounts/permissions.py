from rest_framework import permissions

class IsSuperAdmin(permissions.BasePermission):
    """
    Allows access only to Platform Super Admins.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'SUPER_ADMIN')

class IsSchoolAdmin(permissions.BasePermission):
    """
    Allows access only to School Admins.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'ADMIN')

class IsPrincipal(permissions.BasePermission):
    """
    Allows access to Principals, School Admins, and Super Admins.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL']
        )

class IsHOD(permissions.BasePermission):
    """
    Allows access to HODs and above.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'HOD']
        )

class IsTeacher(permissions.BasePermission):
    """
    Allows access to Teachers and above.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'HOD', 'TEACHER']
        )

class IsParent(permissions.BasePermission):
    """
    Allows access to Parents.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'PARENT')

class IsStudent(permissions.BasePermission):
    """
    Allows access to Students.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'STUDENT')
