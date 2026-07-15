from django.test import SimpleTestCase

from .pye_parser import parse_pye, validate


class PYEParserTests(SimpleTestCase):
    def test_embedded_pdf_markers_parse_into_questions_choices_and_key(self):
        parsed = parse_pye([
            "Sample Title",
            "This is the passage.",
            (
                "Questions to Answer 1. What is tested? A. Reading B. Writing "
                "C. Math D. Science 2. What format is this? A. Docx B. PDF C. CSV D. JSON"
            ),
            (
                "Answer Key with Explanations: 1. A (The passage tests reading.) "
                "2. B (This upload is a PDF.)"
            ),
        ])

        self.assertEqual(len(parsed.questions), 2)
        self.assertEqual([choice.letter for choice in parsed.questions[0].choices], ["A", "B", "C", "D"])
        self.assertEqual(parsed.questions[0].correct_letter, "A")
        self.assertTrue(parsed.questions[0].choices[0].is_correct)
        self.assertEqual(validate(parsed), [])

    def test_empty_answer_choice_is_reported(self):
        parsed = parse_pye([
            "Sample Title",
            "This is the passage.",
            "Questions to Answer 1. What is missing? A. B. Present C. Also present D. Present too",
            "Answer Key with Explanations: 1. B (B has text.)",
        ])

        self.assertIn(
            "Q1: answer choice A is empty. Add answer text after 'A.'",
            validate(parsed),
        )
