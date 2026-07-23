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
    QuizResponse, UserAnswer, GradeLevel, SkillCategory, Classroom, Profile, Assignment
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
    ClassroomSerializer, AssignmentSerializer
)
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

        profile = getattr(request.user, 'profile', None)
        if not (profile and profile.role == 'teacher'):
            return Response(
                {"detail": "Only teacher accounts can upload documents."},
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

    def get_permissions(self):
        # Students need to join a class without being teachers themselves.
        if self.action == 'join':
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsTeacher()]

    def get_queryset(self):
        return (
            Classroom.objects.filter(teacher=self.request.user)
            .order_by('-created_at')
            .prefetch_related('students')
        )

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user)

    @drf_action(detail=False, methods=['post'])
    def join(self, request):
        """Student joins a classroom using the teacher-shared class code."""
        profile = getattr(request.user, 'profile', None)
        if not (profile and profile.role == Profile.ROLE_STUDENT):
            return Response(
                {"detail": "Only student accounts can join a class."},
                status=status.HTTP_403_FORBIDDEN,
            )

        code = (request.data.get('code') or '').strip().upper()
        if not code:
            return Response({"detail": "A class code is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            classroom = Classroom.objects.get(join_code=code)
        except Classroom.DoesNotExist:
            return Response({"detail": "That class code doesn't match any class."}, status=status.HTTP_404_NOT_FOUND)

        if classroom.students.filter(id=request.user.id).exists():
            return Response({"detail": f"You're already enrolled in {classroom.name}."}, status=status.HTTP_400_BAD_REQUEST)

        classroom.students.add(request.user)
        return Response(ClassroomSerializer(classroom).data, status=status.HTTP_200_OK)

    @drf_action(detail=True, methods=['post'], url_path='remove-student')
    def remove_student(self, request, pk=None):
        classroom = self.get_object()
        student_id = request.data.get('student_id')
        if not student_id:
            return Response({"detail": "student_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        classroom.students.remove(student_id)
        return Response(ClassroomSerializer(classroom).data)

    @drf_action(detail=True, methods=['post'], url_path='regenerate-code')
    def regenerate_code(self, request, pk=None):
        classroom = self.get_object()
        classroom.join_code = ''
        classroom.save()
        return Response(ClassroomSerializer(classroom).data)

    @drf_action(detail=True, methods=['get', 'post'], url_path='assignments')
    def assignments(self, request, pk=None):
        """Teacher: list or create passage assignments for one of their own classes."""
        classroom = self.get_object()

        if request.method == 'GET':
            qs = classroom.assignments.select_related('document')
            return Response(AssignmentSerializer(qs, many=True).data)

        serializer = AssignmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(classroom=classroom, assigned_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MyAssignmentsView(APIView):
    """Student: passages assigned across every class they've joined."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        assignments = (
            Assignment.objects
            .filter(classroom__students=request.user)
            .select_related('document', 'classroom')
        )
        return Response(AssignmentSerializer(assignments, many=True).data)


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
                # Handle form data - Django UserCreationForm uses password1 and password2
                data = {
                    'username': request.POST.get('username'),
                    'password': request.POST.get('password1'),  # Django sends password1
                    'password2': request.POST.get('password2'),
                    'email': request.POST.get('email'),
                    'first_name': request.POST.get('first_name'),
                    'last_name': request.POST.get('last_name'),
                }
            
            # Validate required fields
            required_fields = ['username', 'password', 'password2', 'email', 'first_name', 'last_name']
            missing_fields = [field for field in required_fields if not data.get(field)]
            
            if missing_fields:
                return Response({
                    'success': False,
                    'error': f'Missing required fields: {", ".join(missing_fields)}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Debug: Log the data being sent to serializer
            print(f"Registration data: {data}")
            
            serializer = UserRegistrationSerializer(data=data)
            if serializer.is_valid():
                user = serializer.save()
                
                # Log the user in after successful registration
                login(request, user)
                
                return Response({
                    'success': True,
                    'message': 'User registered successfully!',
                    'user': UserSerializer(user).data
                }, status=status.HTTP_201_CREATED)
            else:
                print(f"Serializer errors: {serializer.errors}")
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