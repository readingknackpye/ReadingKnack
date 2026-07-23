from django.urls import path, include
from django.views.generic import TemplateView
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse
from rest_framework import routers
from django.contrib.auth import views as auth_views

from .views import (
    SubmitQuizView, UserRegistrationView, UserLoginView, UserLogoutView, UserProfileView,
    UploadedDocumentViewSet, QuizQuestionViewSet, QuizAnswerViewSet,
    QuizResponseViewSet, GradeLevelViewSet, SkillCategoryViewSet, DocumentDetailView,
    ClassroomViewSet, StudentDashboardView, VerifyEmailConfirmView, LinkChildAPIView, ParentDashboardAPIView
)

# CSRF ping for frontend
@ensure_csrf_cookie
def csrf_ping(request):
    return JsonResponse({"detail": "CSRF cookie set"})

# DRF router
router = routers.DefaultRouter()
router.register(r'documents', UploadedDocumentViewSet, basename='documents')
router.register(r'questions', QuizQuestionViewSet, basename='questions')
router.register(r'answers', QuizAnswerViewSet, basename='answers')
router.register(r'responses', QuizResponseViewSet, basename='responses')
router.register(r'grade-levels', GradeLevelViewSet, basename='grade-levels')
router.register(r'skill-categories', SkillCategoryViewSet, basename='skill-categories')
router.register(r'classrooms', ClassroomViewSet, basename='classrooms')

urlpatterns = [
    # Template pages
    path('signup/', TemplateView.as_view(template_name='passages/signup.html'), name='signup_form'),
    path('login/', TemplateView.as_view(template_name='passages/login.html'), name='login_form'),
    path('upload/', TemplateView.as_view(template_name='passages/upload_form.html'), name='upload_form'),

    # API endpoints
    path('api/', include(router.urls)),  
    path('api/documents/<int:pk>/detail/', DocumentDetailView.as_view(), name='document_detail'),
    path('api/submit-quiz/', SubmitQuizView.as_view(), name='submit_quiz'),
    path('api/auth/register/', UserRegistrationView.as_view(), name='user_register'),
    path('api/auth/login/',    UserLoginView.as_view(),       name='user_login'),
    path('api/auth/logout/',   UserLogoutView.as_view(),      name='user_logout'),
    path('api/auth/profile/',  UserProfileView.as_view(),     name='user_profile'),
    path('api/auth/csrf/',     csrf_ping,                     name='csrf_ping'),
    path('api/student-dashboard/', StudentDashboardView.as_view(), name='student_dashboard'),
    path('api/auth/verify-email/<uidb64>/<token>/', VerifyEmailConfirmView.as_view(), name='verify_email_confirm'),
    path('api/auth/link-child/', LinkChildAPIView.as_view(), name='api_link_child'),
    path('api/parent-dashboard/', ParentDashboardAPIView.as_view(), name='api_parent_dashboard'),
    path(
        "password-reset/",
        auth_views.PasswordResetView.as_view(
            template_name="passages/password_reset_form.html",
            email_template_name="passages/password_reset_email.txt",
            html_email_template_name="passages/password_reset_email.html",
            subject_template_name="passages/password_reset_subject.txt",
        ),
        name="password_reset",
    ),
    path(
        "password-reset/done/",
        auth_views.PasswordResetDoneView.as_view(template_name="passages/password_reset_done.html"),
        name="password_reset_done",
    ),
    path(
        "reset/<uidb64>/<token>/",
        auth_views.PasswordResetConfirmView.as_view(
            template_name="passages/password_reset_confirm.html",
            success_url="/reset/done/",
        ),
        name="password_reset_confirm",
    ),
    path(
        "reset/done/",
        auth_views.PasswordResetCompleteView.as_view(
            template_name="passages/password_reset_complete.html",
        ),
        name="password_reset_complete",
    ),
]

