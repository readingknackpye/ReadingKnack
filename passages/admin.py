from django.contrib import admin
from .models import (
    UploadedDocument, GradeLevel, SkillCategory, 
    QuizQuestion, QuizAnswer, QuizResponse, UserAnswer
)

@admin.register(GradeLevel)
class GradeLevelAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']

@admin.register(SkillCategory)
class SkillCategoryAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']

@admin.register(UploadedDocument)
class UploadedDocumentAdmin(admin.ModelAdmin):
    list_display = ['title', 'uploaded_at', 'grade_level', 'skill_category']
    list_filter = ['uploaded_at', 'grade_level', 'skill_category']
    search_fields = ['title', 'parsed_text']
    readonly_fields = ['uploaded_at']

@admin.register(QuizQuestion)
class QuizQuestionAdmin(admin.ModelAdmin):
    list_display = ['question_text', 'document', 'created_at']
    list_filter = ['created_at', 'document']
    search_fields = ['question_text', 'document__title']
    readonly_fields = ['created_at']

@admin.register(QuizAnswer)
class QuizAnswerAdmin(admin.ModelAdmin):
    list_display = ['choice_letter', 'choice_text', 'question', 'is_correct']
    list_filter = ['is_correct', 'question__document']
    search_fields = ['choice_text', 'question__question_text']

@admin.register(QuizResponse)
class QuizResponseAdmin(admin.ModelAdmin):
    list_display = ['document', 'user_name', 'score', 'total_questions', 'submitted_at']
    list_filter = ['submitted_at', 'document']
    search_fields = ['user_name', 'document__title']
    readonly_fields = ['submitted_at']

@admin.register(UserAnswer)
class UserAnswerAdmin(admin.ModelAdmin):
    list_display = ['response', 'question', 'selected_answer', 'is_correct']
    list_filter = ['is_correct', 'response__document']
    search_fields = ['response__user_name', 'question__question_text']
