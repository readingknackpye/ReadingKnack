from django.shortcuts import render, get_object_or_404
from passages.models import Passage, UploadedDocument, QuizQuestion, QuizAnswer, QuizResponse, UserAnswer, GradeLevel, SkillCategory
from django import forms
from docx import Document
from .forms import UploadedDocumentForm
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from .serializers import (
    UploadedDocumentSerializer, QuizQuestionSerializer, QuizAnswerSerializer,
    QuizResponseSerializer, DocumentDetailSerializer, GradeLevelSerializer, SkillCategorySerializer
)
from django.http import JsonResponse
import json
from .authentication import CsrfExemptSessionAuthentication
from django.views.decorators.csrf import csrf_exempt
import os
from passages.gemini_utils import generate_questions


def passage_list(request):
    passages = Passage.objects.all()
    return render(request, 'passages/passage_list.html', {'passages': passages})


def upload_document(request):
    parsed_content = None

    if request.method == 'POST':
        form = UploadedDocumentForm(request.POST, request.FILES)
        if form.is_valid():
            uploaded_doc = form.save()

            doc = Document(uploaded_doc.file)
            parsed_content = "\n".join([p.text for p in doc.paragraphs])

            return render(request, 'passages/upload_success.html', {
                'document': uploaded_doc,
                'parsed_content': parsed_content
            })
    else:
        form = UploadedDocumentForm()

    return render(request, 'passages/upload_form.html', {'form': form})


def clean_file(self):
    file = self.cleaned_data.get('file')
    if not file.name.endswith('.docx'):
        raise forms.ValidationError('Only .docx files are supported.')
    return file


def uploaded_documents_list(request):
    documents = UploadedDocument.objects.all()
    return render(request, 'passages/document_list.html', {'documents': documents})


class UploadedDocumentViewSet(viewsets.ModelViewSet):
    authentication_classes = [CsrfExemptSessionAuthentication]
    queryset = UploadedDocument.objects.all().order_by('-uploaded_at')
    serializer_class = UploadedDocumentSerializer

    def perform_create(self, serializer):
        instance = serializer.save(uploader=self.request.user)
        # Parse .docx file
        if instance.file.name.endswith('.docx'):
            doc = Document(instance.file)
            full_text = [para.text for para in doc.paragraphs]
            instance.parsed_text = '\n'.join(full_text)

        try:
            parsed_text = instance.parsed_text[:3000]  # Limit to 3K chars
            print("Generating quiz questions with Gemini...")

            # Use Gemini API
            questions_text = generate_questions(parsed_text)

            # Optionally save this to the DB
            # instance.generated_questions = questions_text

            print("Quiz Questions:\n", questions_text)

        except Exception as e:
            print("Quiz generation failed:", str(e))

        instance.save()

    @action(detail=True, methods=['get'])
    def detail(self, request, pk=None):
        document = self.get_object()
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


class SubmitQuizView(APIView):
    def post(self, request):
        try:
            data = request.data
            document_id = data.get('document_id')
            user_name = data.get('user_name', 'Anonymous')
            answers = data.get('answers', [])

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
                user_name=user_name,
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


#print("🔑 GEMINI KEY:", os.getenv("GEMINI_API_KEY"))


    
