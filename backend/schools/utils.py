from rest_framework import serializers

class TenantSerializerMixin:
    """
    A mixin for serializers to automatically restrict all PrimaryKeyRelatedField 
    querysets to the user's school.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if 'request' not in self.context:
            return
            
        user = self.context['request'].user
        if not hasattr(user, 'school') or not user.school:
            return

        school = user.school
        
        # Loop through all fields and restrict querysets for related fields
        for field_name, field in self.fields.items():
            if isinstance(field, serializers.PrimaryKeyRelatedField):
                if field.queryset is None:
                    continue
                if hasattr(field.queryset.model, 'school'):
                    field.queryset = field.queryset.filter(school=school)
                elif hasattr(field.queryset.model, 'grade_level') and hasattr(field.queryset.model.grade_level.field.related_model, 'school'):
                    # Handle cases like Stream which link to GradeLevel
                    field.queryset = field.queryset.filter(grade_level__school=school)
                elif hasattr(field.queryset.model, 'exam') and hasattr(field.queryset.model.exam.field.related_model, 'school'):
                    # Handle Marks which link to Exams
                    field.queryset = field.queryset.filter(exam__school=school)
