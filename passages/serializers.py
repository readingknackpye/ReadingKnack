from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import (
    UploadedDocument, GradeLevel, SkillCategory, 
    QuizQuestion, QuizAnswer, QuizResponse, UserAnswer
)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'date_joined', 'is_staff')
        read_only_fields = ('id', 'date_joined', 'is_staff')

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    access_code = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = User
        fields = ('username', 'password', 'password2', 'email', 'first_name', 'last_name', 'access_code')
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        access_code = validated_data.pop('access_code', '')
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        # this is only for teachers to get access to more features compared to students
        if access_code == "TEACHERS2026":
            user.is_staff = True
            user.save()
        return user

class GradeLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = GradeLevel
        fields = '__all__'

class SkillCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SkillCategory
        fields = '__all__'

class UploadedDocumentSerializer(serializers.ModelSerializer):
    grade_level = serializers.PrimaryKeyRelatedField(
        queryset=GradeLevel.objects.all(), required=False, allow_null=True
    )
    skill_category = serializers.PrimaryKeyRelatedField(
        queryset=SkillCategory.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = UploadedDocument
        fields = '__all__'


class QuizAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAnswer
        fields = ['id', 'question', 'choice_letter', 'choice_text', 'is_correct']

class QuizQuestionSerializer(serializers.ModelSerializer):
    answers = QuizAnswerSerializer(many=True, read_only=True)
    
    class Meta:
        model = QuizQuestion
        fields = ['id', 'document', 'question_text', 'explanation', 'answers', 'created_at']

class QuizResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizResponse
        fields = ['id', 'document', 'user_name', 'score', 'total_questions', 'submitted_at']

class StudentDashboardSerializer(serializers.ModelSerializer):
    test_name = serializers.CharField(
        source='document.title',
        read_only=True
    )

    grade_level = serializers.SerializerMethodField()
    skill = serializers.SerializerMethodField()
    percentage = serializers.SerializerMethodField()
    duration = serializers.SerializerMethodField()

    class Meta:
        model = QuizResponse
        fields = [
            'id',
            'test_name',
            'grade_level',
            'skill',
            'score',
            'total_questions',
            'percentage',
            'duration',
            'submitted_at',
        ]

    def get_grade_level(self, obj):
        if obj.document.grade_level:
            return obj.document.grade_level.name
        return 'N/A'

    def get_skill(self, obj):
        if obj.document.skill_category:
            return obj.document.skill_category.name
        return 'N/A'

    def get_percentage(self, obj):
        if not obj.total_questions:
            return 0

        return round(
            (obj.score / obj.total_questions) * 100,
            1
        )

    def get_duration(self, obj):
        if not obj.duration_seconds:
            return "N/A"
        mins = obj.duration_seconds // 60
        secs = obj.duration_seconds % 60
        return f"{mins}:{secs:02d}"


class UserAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAnswer
        fields = ['id', 'question', 'selected_answer', 'is_correct']

class DocumentDetailSerializer(serializers.ModelSerializer):
    questions = QuizQuestionSerializer(many=True, read_only=True)
    grade_level = GradeLevelSerializer(read_only=True)
    skill_category = SkillCategorySerializer(read_only=True)
    
    class Meta:
        model = UploadedDocument
        fields = ['id', 'title', 'parsed_text', 'uploaded_at', 'questions', 'grade_level', 'skill_category'] 