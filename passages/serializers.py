from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import (
    UploadedDocument, GradeLevel, SkillCategory,
    QuizQuestion, QuizAnswer, QuizResponse, UserAnswer, Profile, Classroom, Topic
)

class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'date_joined', 'role')
        read_only_fields = ('id', 'date_joined', 'role')

    def get_role(self, obj):
        if obj.is_staff or obj.is_superuser:
            return Profile.ROLE_TEACHER
        profile = getattr(obj, 'profile', None)
        return profile.role if profile else Profile.ROLE_STUDENT

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True, required=False)
    
    # Accept the new dynamic fields from React
    role = serializers.CharField(write_only=True, required=False)
    grade = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    class_size = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    relationship = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2', 'first_name', 'last_name', 'role', 'grade', 'class_size', 'relationship')

    def create(self, validated_data):
        # Extract the custom profile data before creating the base Django User
        role = validated_data.pop('role', 'student')
        grade = validated_data.pop('grade', None)
        class_size = validated_data.pop('class_size', None)
        relationship = validated_data.pop('relationship', '')
        
        validated_data.pop('password2', None)

        # Create the base Django User
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        
        # Update or Create their connected Profile
        profile, created = Profile.objects.get_or_create(user=user)
        profile.role = role
        profile.grade = grade if grade else None
        profile.class_size = class_size if class_size else None
        profile.relationship = relationship
        
        # Apply the new strict security rules
        profile.email_verified = False
        profile.teacher_approved = False
        
        profile.save()
        
        return user

class ClassroomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Classroom
        fields = ['id', 'name', 'teacher', 'created_at']
        read_only_fields = ['id', 'teacher', 'created_at']

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
    topic = serializers.PrimaryKeyRelatedField(
        queryset=Topic.objects.all(), required=False, allow_null=True
    )
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    program_display = serializers.CharField(source='get_program_display', read_only=True)
    difficulty_display = serializers.CharField(source='get_difficulty_display', read_only=True)

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
            'duration_seconds',
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