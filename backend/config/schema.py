import graphene
import graphql_jwt
from django.db.models import Q
from graphene_django import DjangoObjectType
from graphene_django.filter import DjangoFilterConnectionField

from classes.models import Stream, Subject
from exams.models import Exam, Mark
from students.models import Student


class StudentType(DjangoObjectType):
    class Meta:
        model = Student
        fields = (
            "id",
            "admission_number",
            "first_name",
            "last_name",
            "stream",
            "marks",
        )
        filter_fields = ["admission_number", "first_name", "last_name", "stream__name"]
        interfaces = (graphene.relay.Node,)


class ExamType(DjangoObjectType):
    class Meta:
        model = Exam
        fields = (
            "id",
            "name",
            "term",
            "academic_year",
            "start_date",
            "end_date",
            "marks",
        )
        filter_fields = ["name", "term", "academic_year"]
        interfaces = (graphene.relay.Node,)


class MarkType(DjangoObjectType):
    class Meta:
        model = Mark
        fields = ("id", "exam", "student", "subject", "score", "teacher_remarks")
        interfaces = (graphene.relay.Node,)


class StreamType(DjangoObjectType):
    class Meta:
        model = Stream
        fields = ("id", "name", "grade_level", "students", "teacher")
        interfaces = (graphene.relay.Node,)


class SubjectType(DjangoObjectType):
    class Meta:
        model = Subject
        fields = ("id", "name", "code")
        interfaces = (graphene.relay.Node,)


class StudentPerformanceType(graphene.ObjectType):
    subject = graphene.String()
    average_score = graphene.Float()
    exam_count = graphene.Int()


class Query(graphene.ObjectType):
    # Student queries
    student = graphene.Field(StudentType, id=graphene.Int())
    students = DjangoFilterConnectionField(StudentType)

    # Exam queries
    exam = graphene.Field(ExamType, id=graphene.Int())
    exams = DjangoFilterConnectionField(ExamType)

    # Mark queries
    marks = DjangoFilterConnectionField(MarkType)

    # Stream queries
    stream = graphene.Field(StreamType, id=graphene.Int())
    streams = DjangoFilterConnectionField(StreamType)

    # Subject queries
    subject = graphene.Field(SubjectType, id=graphene.Int())
    subjects = DjangoFilterConnectionField(SubjectType)

    # Advanced queries
    student_performance = graphene.List(
        StudentPerformanceType, student_id=graphene.Int(required=True)
    )

    def resolve_student(self, info, id):
        return Student.objects.get(id=id)

    def resolve_students(self, info, **kwargs):
        # Filter by user's school for multi-tenancy
        user = info.context.user
        if user.is_authenticated and hasattr(user, "school"):
            return Student.objects.filter(stream__grade_level__school=user.school)
        return Student.objects.none()

    def resolve_exam(self, info, id):
        return Exam.objects.get(id=id)

    def resolve_exams(self, info, **kwargs):
        user = info.context.user
        if user.is_authenticated and hasattr(user, "school"):
            return Exam.objects.filter(school=user.school)
        return Exam.objects.none()

    def resolve_marks(self, info, **kwargs):
        user = info.context.user
        if user.is_authenticated and hasattr(user, "school"):
            return Mark.objects.filter(exam__school=user.school)
        return Mark.objects.none()

    def resolve_stream(self, info, id):
        return Stream.objects.get(id=id)

    def resolve_streams(self, info, **kwargs):
        user = info.context.user
        if user.is_authenticated and hasattr(user, "school"):
            return Stream.objects.filter(grade_level__school=user.school)
        return Stream.objects.none()

    def resolve_subject(self, info, id):
        return Subject.objects.get(id=id)

    def resolve_subjects(self, info, **kwargs):
        user = info.context.user
        if user.is_authenticated and hasattr(user, "school"):
            return Subject.objects.filter(school=user.school)
        return Subject.objects.none()

    def resolve_student_performance(self, info, student_id):
        """Complex query for student performance analytics"""
        user = info.context.user
        if not (user.is_authenticated and hasattr(user, "school")):
            return []

        from django.db.models import Avg, Count

        marks = (
            Mark.objects.filter(student_id=student_id, exam__school=user.school)
            .values("subject__name")
            .annotate(average_score=Avg("score"), exam_count=Count("id"))
            .order_by("-average_score")
        )

        return [
            StudentPerformanceType(
                subject=mark["subject__name"],
                average_score=mark["average_score"],
                exam_count=mark["exam_count"],
            )
            for mark in marks
        ]


class CreateMark(graphene.Mutation):
    class Arguments:
        exam_id = graphene.Int(required=True)
        student_id = graphene.Int(required=True)
        subject_id = graphene.Int(required=True)
        score = graphene.Decimal(required=True)
        teacher_remarks = graphene.String()

    mark = graphene.Field(MarkType)
    success = graphene.Boolean()
    errors = graphene.List(graphene.String)

    @classmethod
    def mutate(
        cls, root, info, exam_id, student_id, subject_id, score, teacher_remarks=None
    ):
        user = info.context.user
        if not user.is_authenticated:
            return cls(success=False, errors=["Authentication required"])

        try:
            from classes.models import Subject
            from exams.models import Exam, Mark
            from students.models import Student

            exam = Exam.objects.get(id=exam_id, school=user.school)
            student = Student.objects.get(
                id=student_id, stream__grade_level__school=user.school
            )
            subject = Subject.objects.get(id=subject_id, school=user.school)

            mark, created = Mark.objects.update_or_create(
                exam=exam,
                student=student,
                subject=subject,
                defaults={"score": score, "teacher_remarks": teacher_remarks},
            )

            return cls(mark=mark, success=True, errors=[])

        except Exception as e:
            return cls(success=False, errors=[str(e)])


class Mutation(graphene.ObjectType):
    create_mark = CreateMark.Field()
    token_auth = graphql_jwt.ObtainJSONWebToken.Field()
    verify_token = graphql_jwt.Verify.Field()
    refresh_token = graphql_jwt.Refresh.Field()


schema = graphene.Schema(query=Query, mutation=Mutation)
