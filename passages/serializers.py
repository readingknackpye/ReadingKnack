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
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'date_joined')
        read_only_fields = ('id', 'date_joined')

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ('username', 'password', 'password2', 'email', 'first_name', 'last_name')
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
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
        fields = ['id', 'choice_letter', 'choice_text', 'is_correct']

class QuizQuestionSerializer(serializers.ModelSerializer):
    answers = QuizAnswerSerializer(many=True, read_only=True)
    
    class Meta:
        model = QuizQuestion
        fields = ['id', 'question_text', 'explanation', 'answers', 'created_at']

class QuizResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizResponse
        fields = ['id', 'document', 'user_name', 'score', 'total_questions', 'submitted_at']

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