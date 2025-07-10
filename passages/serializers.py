from rest_framework import serializers
from .models import (
    UploadedDocument, GradeLevel, SkillCategory, 
    QuizQuestion, QuizAnswer, QuizResponse, UserAnswer
)

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