from django.shortcuts import render, get_object_or_404
from django.contrib.auth import login, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from django.middleware.csrf import get_token
from django.http import JsonResponse
from passages.models import (
    UploadedDocument, QuizQuestion, QuizAnswer,
    QuizResponse, UserAnswer, GradeLevel, SkillCategory, Classroom
)
from django import forms
from docx import Document
from .forms import UploadedDocumentForm
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action as drf_action
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from .serializers import (
    UploadedDocumentSerializer, QuizQuestionSerializer, QuizAnswerSerializer,
    QuizResponseSerializer, DocumentDetailSerializer, GradeLevelSerializer,
    SkillCategorySerializer, UserRegistrationSerializer, UserSerializer,StudentDashboardSerializer,
    ClassroomSerializer
)
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.conf import settings
from django.urls import reverse
from django.shortcuts import redirect
from django.contrib.auth.models import User
from django.http import JsonResponse
import json
from .authentication import CsrfExemptSessionAuthentication
from .permissions import IsTeacher
import os
from .docx_parser import parse_uploaded_docx
from passages.gemini_utils import generate_questions, parse_questions, save_parsed_questions
from passages import serializers
from django.db import transaction
from .importer import import_document
from .pye_parser import PYEParseError
from .models import ParentLink

def upload_document(request):
    parsed_content = None

    if request.method == 'POST':
        form = UploadedDocumentForm(request.POST, request.FILES)
        if form.is_valid():
            uploaded_doc = form.save()

            doc = Document(uploaded_doc.file)
            parsed_content = "\n".join([p.text for p in doc.paragraphs])
            uploaded_doc.parsed_text = parsed_content

            try:
                print("Generating quiz questions with Gemini...")
                questions_text = generate_questions(parsed_content[:3000])
                print("Raw Gemini output:\n", questions_text)

                parsed_questions = parse_questions(questions_text)
                print("Parsed questions list:\n", parsed_questions)

                save_parsed_questions(uploaded_doc, parsed_questions)
                print("Quiz Questions saved to DB.")

            except Exception as e:
                print("Quiz generation failed:", str(e))

            uploaded_doc.save()

            return render(request, 'passages/upload_success.html', {
                'document': uploaded_doc,
                'parsed_content': parsed_content
            })
    else:
        form = UploadedDocumentForm()

    return render(request, 'passages/upload_form.html', {'form': form})

# --- EMAIL HELPER FUNCTIONS ---
def send_verification_email(request, user):
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    
    # Generate the verification URL targeting our new API endpoint
    verification_path = reverse('verify_email_confirm', args=[uid, token])
    verification_url = request.build_absolute_uri(verification_path)

    context = {
        'user': user,
        'verification_url': verification_url
    }

    # Uses the templates you already moved to the passages folder
    subject = "Verify your ReadingKnack account"
    text_body = render_to_string("passages/email_verification_email.txt", context)
    html_body = render_to_string("passages/email_verification_email.html", context)

    send_mail(
        subject=subject,
        message=text_body,
        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@readingknack.com'),
        recipient_list=[user.email],
        html_message=html_body,
        fail_silently=True,
    )

def send_admin_teacher_approval_email(request, user):
    subject = "Teacher account approval needed"
    message = f"A new teacher account ({user.username} - {user.email}) is waiting for approval.\n\nPlease log in to the Django admin panel to approve them by checking 'Teacher Approved' in their Profile."

    send_mail(
        subject=subject,
        message=message,
        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@readingknack.com'),
        recipient_list=[getattr(settings, 'TEACHER_APPROVAL_EMAIL', 'admin@readingknack.com')],
        fail_silently=True,
    )

# --- VERIFICATION ENDPOINT ---
class VerifyEmailConfirmView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, uidb64, token):
        try:
            user_id = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=user_id)
            
            if default_token_generator.check_token(user, token):
                profile = user.profile
                profile.email_verified = True
                profile.save()
                
                # Redirect back to the React login page with a success flag
                # Note: Change localhost:3000 to your real domain in production
                return redirect('http://localhost:3000/login?email_verified=1')
            else:
                return redirect('http://localhost:3000/login?error=invalid_token')
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return redirect('http://localhost:3000/login?error=invalid_token')


def clean_file(self):
    file = self.cleaned_data.get('file')
    if not file.name.endswith(('.docx', '.pdf')):
        raise forms.ValidationError('Only .docx and .pdf files are supported.')
    return file


def uploaded_documents_list(request):
    documents = UploadedDocument.objects.all()
    return render(request, 'passages/document_list.html', {'documents': documents})

class UploadedDocumentViewSet(viewsets.ModelViewSet):
    authentication_classes = [CsrfExemptSessionAuthentication]
    queryset = UploadedDocument.objects.all().order_by('-uploaded_at')
    serializer_class = UploadedDocumentSerializer

    def get_queryset(self):
        """Filter by ?grade_level=&program=&difficulty=&topic=&skill_category=&search="""
        queryset = super().get_queryset()
        params = self.request.query_params

        for field in ('grade_level', 'skill_category', 'topic'):
            value = params.get(field)
            if value:
                queryset = queryset.filter(**{f'{field}_id': value})

        for field in ('program', 'difficulty'):
            value = params.get(field)
            if value:
                queryset = queryset.filter(**{field: value})

        topic_name = params.get('topic_name')
        if topic_name:
            queryset = queryset.filter(topic__name__iexact=topic_name)

        search = params.get('search')
        if search:
            queryset = queryset.filter(title__icontains=search)

        return queryset
    
    def create(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(
                {"detail": "You must be logged in to upload documents."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        is_admin = request.user.is_staff or request.user.is_superuser
        profile = getattr(request.user, 'profile', None)
        is_teacher = profile and profile.role == 'teacher'

        if not (is_admin or is_teacher):
            return Response(
                {"detail": "Only teacher accounts and admins can upload documents."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        file_obj = self.request.FILES.get('file')

        if not file_obj or not file_obj.name.endswith(('.docx', '.pdf')):
            raise ValidationError("Invalid file format. Only .docx and .pdf files are permitted.")

        with transaction.atomic():
            instance = serializer.save(uploader=user)

            if instance.file:
                try:
                    print(f"Running PYE Parser on {instance.file.name}")
                    import_document(instance)  # parse, validate, and save in one call
                    print("Successfully parsed and saved document data.")
                except PYEParseError as e:
                    print(f"Parser failed: {e}")
                    raise ValidationError(f"Document Error: {str(e)}")
                except Exception as e:
                    print(f"Unexpected parser error: {e}")
                    import traceback
                    traceback.print_exc()
                    raise ValidationError(f"Document Error: {str(e)}")

class DocumentDetailView(APIView):
    def get(self, request, pk):
        document = get_object_or_404(UploadedDocument, pk=pk)
        serializer = DocumentDetailSerializer(document)
        return Response(serializer.data)


class QuizQuestionViewSet(viewsets.ModelViewSet):
    queryset = QuizQuestion.objects.all()
    serializer_class = QuizQuestionSerializer

    def get_queryset(self):
        document_id = self.request.query_params.get('document_id', None)
        if document_id:
            return QuizQuestion.objects.filter(document_id=document_id)
        return QuizQuestion.objects.all()


class QuizAnswerViewSet(viewsets.ModelViewSet):
    queryset = QuizAnswer.objects.all()
    serializer_class = QuizAnswerSerializer


class QuizResponseViewSet(viewsets.ModelViewSet):
    queryset = QuizResponse.objects.all()
    serializer_class = QuizResponseSerializer

class StudentDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        responses = (
            QuizResponse.objects
            .filter(user=request.user)
            .select_related(
                'document',
                'document__grade_level',
                'document__skill_category',
            )
            .order_by('-submitted_at')
        )

        serializer = StudentDashboardSerializer(
            responses,
            many=True
        )

        return Response(serializer.data)


class SubmitQuizView(APIView):
    def post(self, request):
        try:
            data = request.data
            document_id = data.get('document_id')
            user_name = data.get('user_name', 'Anonymous')
            answers = data.get('answers', [])
            time_spent = data.get('time_spent', 0)

            authenticated_user = (
                request.user
                if request.user.is_authenticated
                else None
            )

            document = get_object_or_404(UploadedDocument, id=document_id)
            questions = QuizQuestion.objects.filter(document=document)

            if not questions.exists():
                return Response(
                    {'error': 'No questions found for this document'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Calculate score
            score = 0
            total_questions = questions.count()
            user_answers = []

            for answer_data in answers:
                question_id = answer_data.get('question_id')
                selected_answer_id = answer_data.get('selected_answer_id')

                question = get_object_or_404(QuizQuestion, id=question_id)
                selected_answer = get_object_or_404(QuizAnswer, id=selected_answer_id)

                is_correct = selected_answer.is_correct
                if is_correct:
                    score += 1

                user_answers.append({
                    'question': question,
                    'selected_answer': selected_answer,
                    'is_correct': is_correct
                })

            # Create quiz response
            quiz_response = QuizResponse.objects.create(
                document=document,
                user=authenticated_user,
                user_name=(
                    authenticated_user.username
                     if authenticated_user
                     else user_name
                ),
                duration_seconds=time_spent,
                score=score,
                total_questions=total_questions
            )

            # Create user answers
            for user_answer_data in user_answers:
                UserAnswer.objects.create(
                    response=quiz_response,
                    question=user_answer_data['question'],
                    selected_answer=user_answer_data['selected_answer'],
                    is_correct=user_answer_data['is_correct']
                )

            return Response({
                'response_id': quiz_response.id,
                'score': score,
                'total_questions': total_questions,
                'percentage': round((score / total_questions) * 100, 2)
            })

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class GradeLevelViewSet(viewsets.ModelViewSet):
    queryset = GradeLevel.objects.all()
    serializer_class = GradeLevelSerializer


class SkillCategoryViewSet(viewsets.ModelViewSet):
    queryset = SkillCategory.objects.all()
    serializer_class = SkillCategorySerializer


class ClassroomViewSet(viewsets.ModelViewSet):
    authentication_classes = [CsrfExemptSessionAuthentication]
    serializer_class = ClassroomSerializer
    permission_classes = [IsAuthenticated, IsTeacher]

    def get_queryset(self):
        return Classroom.objects.filter(teacher=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user)


def generate_questions_for_document(request, document_id):
    # Get the UploadedDocument object by ID
    document = get_object_or_404(UploadedDocument, id=document_id)

    # Use the parsed text stored in the document (make sure you saved it on upload)
    parsed_text = document.parsed_text

    if not parsed_text:
        return JsonResponse({'error': 'No parsed text found in document.'}, status=400)

    # Generate questions from the parsed text
    questions = generate_questions(parsed_text)

    return JsonResponse({'questions': questions})


class UserRegistrationView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []  # No authentication required for registration
    
    @method_decorator(ensure_csrf_cookie)
    def get(self, request):
        """Get CSRF token for the registration form"""
        return JsonResponse({'csrfToken': get_token(request)})
    
    def post(self, request):
        """Handle user registration"""
        try:
            # Handle both form data and JSON data
            if request.content_type == 'application/json':
                data = request.data
            else:
                data = {
                    'username': request.POST.get('username'),
                    'password': request.POST.get('password'),
                    'password2': request.POST.get('password2'),
                    'email': request.POST.get('email'),
                    'first_name': request.POST.get('first_name'),
                    'last_name': request.POST.get('last_name'),
                    # Catch the new fields from React
                    'role': request.POST.get('role', 'student'),
                    'grade': request.POST.get('grade'),
                    'class_size': request.POST.get('class_size'),
                    'relationship': request.POST.get('relationship'),
                }
            
            # Validate required fields
            required_fields = ['username', 'password', 'password2', 'email', 'first_name', 'last_name', 'role']
            missing_fields = [field for field in required_fields if not data.get(field)]
            
            if missing_fields:
                return Response({
                    'success': False,
                    'error': f'Missing required fields: {", ".join(missing_fields)}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            serializer = UserRegistrationSerializer(data=data)
            if serializer.is_valid():
                user = serializer.save()

                send_verification_email(request, user)
                
                return Response({
                    'success': True,
                    'message': 'User registered successfully!',
                    'user': UserSerializer(user).data
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'success': False,
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            print(f"Registration exception: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserLoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    
    @method_decorator(ensure_csrf_cookie)
    def get(self, request):
        """Get CSRF token for the login form"""
        return JsonResponse({'csrfToken': get_token(request)})
    
    def post(self, request):
        """Handle user login"""
        try:
            # Handle both form data and JSON data
            if request.content_type == 'application/json':
                username = request.data.get('username')
                password = request.data.get('password')
            else:
                # Handle form data
                username = request.POST.get('username')
                password = request.POST.get('password')
            
            if not username or not password:
                return Response({
                    'success': False,
                    'error': 'Username and password are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user = authenticate(username=username, password=password)
            
            if user is not None:
                login(request, user)
                return Response({
                    'success': True,
                    'message': 'Login successful!',
                    'user': UserSerializer(user).data
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': False,
                    'error': 'Invalid credentials'
                }, status=status.HTTP_401_UNAUTHORIZED)
                
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserLogoutView(APIView):
    def post(self, request):
        """Handle user logout"""
        try:
            from django.contrib.auth import logout
            logout(request)
            return Response({
                'success': True,
                'message': 'Logout successful!'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserProfileView(APIView):
    def get(self, request):
        """Get current user profile"""
        if request.user.is_authenticated:
            return Response({
                'success': True,
                'user': UserSerializer(request.user).data
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'error': 'User not authenticated'
            }, status=status.HTTP_401_UNAUTHORIZED)

class LinkChildAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.profile.role != 'parent':
            return Response({'error': 'Only parents can link to students.'}, status=status.HTTP_403_FORBIDDEN)

        student_username = request.data.get('student_username', '').strip()
        relationship = request.data.get('relationship', '').strip()

        # Find the student
        student = User.objects.filter(username=student_username, profile__role='student').first()
        
        if not student:
            return Response({'error': 'No student found with that username.'}, status=status.HTTP_404_NOT_FOUND)

        # Create the link
        ParentLink.objects.get_or_create(
            parent=request.user,
            student=student,
            defaults={'relationship': relationship[:50]}
        )

        return Response({'success': True, 'message': f'Successfully linked to student: {student.username}'})

class ParentDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.profile.role != 'parent':
            return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        # Find all students linked to this parent
        links = ParentLink.objects.filter(parent=request.user).select_related('student')
        
        children_data = []
        for link in links:
            student = link.student
            # Get the child's latest 5 quiz responses
            recent_quizzes = QuizResponse.objects.filter(user=student).order_by('-submitted_at')[:5]
            
            quiz_data = [{
                'test_name': q.document.title,
                'score': q.score,
                'total': q.total_questions,
                'percentage': round((q.score / q.total_questions) * 100) if q.total_questions else 0,
                'date': q.submitted_at.strftime('%b %d, %Y')
            } for q in recent_quizzes]

            children_data.append({
                'id': student.id,
                'username': student.username,
                'first_name': student.first_name,
                'relationship': link.relationship,
                'recent_activity': quiz_data
            })

        return Response({'children': children_data})