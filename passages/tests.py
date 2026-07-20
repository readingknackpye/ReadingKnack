import tempfile
from pathlib import Path

from django.test import TestCase
from docx import Document

from passages.docx_parser import parse_uploaded_docx
from passages.gemini_utils import save_parsed_questions
from passages.models import GradeLevel, SkillCategory, UploadedDocument, QuizQuestion, QuizAnswer


class DocxParserTests(TestCase):
    def _build_docx(self, lines):
        temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(temp_dir.cleanup)
        path = Path(temp_dir.name) / 'sample.docx'

        doc = Document()
        for line in lines:
            doc.add_paragraph(line)
        doc.save(path)
        return path

    def test_parse_uploaded_docx_extracts_passage_questions_and_explanations(self):
        path = self._build_docx([
            'The fox ran through the forest. The forest was quiet and dark.',
            'Questions',
            '1. Where did the fox run?',
            'A) Through the forest',
            'B) Into the river',
            'C) Into the cave',
            'D) Across the field',
            'Answer: A',
            'Explanation: The passage says the fox ran through the forest.',
        ])

        parsed = parse_uploaded_docx(path)

        self.assertEqual(parsed.parsed_text, 'The fox ran through the forest. The forest was quiet and dark.')
        self.assertEqual(len(parsed.questions), 1)
        self.assertEqual(parsed.questions[0]['question_text'], 'Where did the fox run?')
        self.assertEqual(parsed.questions[0]['correct_choice'], 'A')
        self.assertEqual(parsed.questions[0]['explanation'], 'The passage says the fox ran through the forest.')
        self.assertEqual([a['choice_letter'] for a in parsed.questions[0]['answers']], ['A', 'B', 'C', 'D'])

    def test_save_parsed_questions_persists_answers_and_explanation(self):
        grade_level = GradeLevel.objects.create(name='Grade 3')
        skill_category = SkillCategory.objects.create(name='Main Idea')
        document = UploadedDocument.objects.create(
            title='Sample Passage',
            file='documents/sample.docx',
            parsed_text='Sample passage text',
            grade_level=grade_level,
            skill_category=skill_category,
        )

        save_parsed_questions(document, [{
            'question_text': 'What happened?',
            'correct_choice': 'C',
            'explanation': 'Choice C matches the passage.',
            'answers': [
                {'choice_letter': 'A', 'choice_text': 'Option A', 'is_correct': False},
                {'choice_letter': 'B', 'choice_text': 'Option B', 'is_correct': False},
                {'choice_letter': 'C', 'choice_text': 'Option C', 'is_correct': True},
                {'choice_letter': 'D', 'choice_text': 'Option D', 'is_correct': False},
            ],
        }])

        question = QuizQuestion.objects.get(document=document)
        answers = QuizAnswer.objects.filter(question=question).order_by('choice_letter')

        self.assertEqual(question.explanation, 'Choice C matches the passage.')
        self.assertEqual(answers.count(), 4)
        self.assertTrue(answers.get(choice_letter='C').is_correct)
        self.assertFalse(answers.get(choice_letter='A').is_correct)

