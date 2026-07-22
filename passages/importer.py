from django.db import transaction
from .models import UploadedDocument, QuizQuestion, QuizAnswer
from .pye_parser import extract_paragraphs, format_validation_errors, parse_pye, validate, PYEParseError

@transaction.atomic
def import_parsed_doc(document: UploadedDocument, parsed) -> None:
    document.parsed_text = parsed.parsed_text
        
    document.save(update_fields=["parsed_text", "title"])

    # wipe old questions (cascades to their answers)
    document.questions.all().delete()

    # recreate questions + choices + explanations
    for q in parsed.questions:
        question = QuizQuestion.objects.create(
            document=document,
            question_text=q.get('question_text', ''),
            explanation=q.get('explanation', ''),
        )
        
        # stores choices in a answers list
        QuizAnswer.objects.bulk_create([
            QuizAnswer(
                question=question,
                choice_letter=a.get('choice_letter', ''),
                choice_text=a.get('choice_text', ''),
                is_correct=a.get('is_correct', False),
            )
            for a in q.get('answers', [])
        ])

def import_document(document: UploadedDocument, *, strict: bool = True):
    """Parse the document's file and write it. Returns (parsed, problems)."""
    document.file.seek(0)                       # rewind in case it was read already
    parsed = parse_pye(extract_paragraphs(document.file, file_name=document.file.name))
    problems = validate(parsed)
    if problems and strict:
        raise PYEParseError(format_validation_errors(problems))
    import_parsed_doc(document, parsed)
    return parsed, problems
