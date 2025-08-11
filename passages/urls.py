from django.urls import path, include
from django.views.generic import TemplateView
from rest_framework import routers
from . import views
from .views import (
    UploadedDocumentViewSet, QuizQuestionViewSet, QuizAnswerViewSet,
    QuizResponseViewSet, SubmitQuizView, GradeLevelViewSet, SkillCategoryViewSet,
    UserRegistrationView, UserLoginView, UserLogoutView, UserProfileView
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
    path('generate-questions/<int:document_id>/', views.generate_questions_for_document, name='generate_questions_for_document'),
    
    # Template views for forms
    path('signup/', TemplateView.as_view(template_name='passages/signup.html'), name='signup_form'),
    path('login/', TemplateView.as_view(template_name='passages/login.html'), name='login_form'),
    
    # Authentication API URLs
    path('auth/register/', UserRegistrationView.as_view(), name='user_register'),
    path('auth/login/', UserLoginView.as_view(), name='user_login'),
    path('auth/logout/', UserLogoutView.as_view(), name='user_logout'),
    path('auth/profile/', UserProfileView.as_view(), name='user_profile'),
    
    path('api/', include(router.urls)),  # <-- don't forget to include this
]

