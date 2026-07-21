from django.db import transaction
from .models import UploadedDocument, QuizQuestion, QuizAnswer
from .docx_parser import parse_uploaded_docx  # <-- Switched to the new parser!

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

def import_document(document: UploadedDocument, *, strict: bool = False):
    """Parse the document's file and write it to the database."""
    document.file.seek(0)
    
    # call the new parser
    parsed = parse_uploaded_docx(document.file)
    
    import_parsed_doc(document, parsed)
    return parsed