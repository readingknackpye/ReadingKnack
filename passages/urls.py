from django.urls import path, include
from rest_framework import routers
from . import views
from .views import (
    UploadedDocumentViewSet, QuizQuestionViewSet, QuizAnswerViewSet,
    QuizResponseViewSet, SubmitQuizView, GradeLevelViewSet, SkillCategoryViewSet
)

router = routers.DefaultRouter()
router.register(r'documents', UploadedDocumentViewSet, basename='documents')
router.register(r'questions', QuizQuestionViewSet, basename='questions')
router.register(r'answers', QuizAnswerViewSet, basename='answers')
router.register(r'responses', QuizResponseViewSet, basename='responses')
router.register(r'grade-levels', GradeLevelViewSet, basename='grade-levels')
router.register(r'skill-categories', SkillCategoryViewSet, basename='skill-categories')

urlpatterns = [
    path('', views.passage_list, name='passage_list'),
    path('upload/', views.upload_document, name='upload_document'),
    path('documents/', views.uploaded_documents_list, name='uploaded_documents_list'),
    path('submit-quiz/', SubmitQuizView.as_view(), name='submit_quiz'),
    path('api/', include(router.urls)),  # <-- don't forget to include this
]

