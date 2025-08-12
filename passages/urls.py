from django.urls import path, include
from django.views.generic import TemplateView
from .views import (
    SubmitQuizView, UserRegistrationView, UserLoginView, UserLogoutView, UserProfileView,
    UploadedDocumentViewSet, QuizQuestionViewSet, QuizAnswerViewSet,
    QuizResponseViewSet, GradeLevelViewSet, SkillCategoryViewSet
)
from rest_framework import routers
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse

@ensure_csrf_cookie
def csrf_ping(request):
    return JsonResponse({"detail": "CSRF cookie set"})

router = routers.DefaultRouter()
router.register(r'documents', UploadedDocumentViewSet, basename='documents')
router.register(r'questions', QuizQuestionViewSet, basename='questions')
router.register(r'answers', QuizAnswerViewSet, basename='answers')
router.register(r'responses', QuizResponseViewSet, basename='responses')
router.register(r'grade-levels', GradeLevelViewSet, basename='grade-levels')
router.register(r'skill-categories', SkillCategoryViewSet, basename='skill-categories')

urlpatterns = [
    # template pages (optional)
    path('signup/', TemplateView.as_view(template_name='passages/signup.html'), name='signup_form'),
    path('login/', TemplateView.as_view(template_name='passages/login.html'), name='login_form'),

    # API
    path('api/', include(router.urls)),
    path('api/auth/register/', UserRegistrationView.as_view(), name='user_register'),
    path('api/auth/login/',    UserLoginView.as_view(),       name='user_login'),
    path('api/auth/logout/',   UserLogoutView.as_view(),      name='user_logout'),
    path('api/auth/profile/',  UserProfileView.as_view(),     name='user_profile'),
    path('api/auth/csrf/',     csrf_ping,                     name='csrf_ping'),
]
