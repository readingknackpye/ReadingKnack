from django.db import transaction
from .models import UploadedDocument, QuizQuestion, QuizAnswer
from .pye_parser import extract_paragraphs, format_validation_errors, parse_pye, validate, PYEParseError

@transaction.atomic
def import_parsed_doc(document: UploadedDocument, parsed) -> None:
    document.parsed_text = parsed.passage

    # make sure title is saved if it exists
    if hasattr(parsed, 'title') and parsed.title:
        if not document.title or document.title.strip() == '':
            document.title = parsed.title
        
    document.save(update_fields=["parsed_text", "title"])

    # wipe old questions (cascades to their answers)
    document.questions.all().delete()

    # recreate questions + choices + explanations
    for q in parsed.questions:
        question = QuizQuestion.objects.create(
            document=document,
            question_text=q.text,
            explanation=q.explanation,
        )
        
        # correctly creates answers from dataclass objects
        QuizAnswer.objects.bulk_create([
            QuizAnswer(
                question=question,
                choice_letter=c.letter,
                choice_text=c.text,
                is_correct=c.is_correct,
            )
            for c in q.choices
        ])

def import_document(document: UploadedDocument, *, strict: bool = False):
    """Parse the document's file and write it. Returns (parsed, problems)."""
    document.file.seek(0)                       # rewind in case it was read already

    parsed = parse_pye(extract_paragraphs(document.file, file_name=document.file.name))
    
    problems = validate(parsed)
    if problems and strict:
        raise PYEParseError(format_validation_errors(problems))
    
    import_parsed_doc(document, parsed)
    return parsed, problems