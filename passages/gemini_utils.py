import os
import google.generativeai as genai
from dotenv import load_dotenv
import re
from django.db import transaction
from .models import QuizQuestion, QuizAnswer

# Load environment variables
load_dotenv()

# Configure Gemini with API key
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Primary and fallback models
PRIMARY_MODEL = "gemini-1.5-flash"
FALLBACK_MODEL = "gemini-1.5-pro"

def generate_questions(text):
    """
    Given a passage of text, generate 7 reading comprehension questions, using Gemini.
    Falls back to another model if the first one fails.
    """
    prompt = f"""Based on this passage, generate exactly 7 reading comprehension questions. 

IMPORTANT: Use EXACTLY this format for each question:

**1. Question text here?**
A) First choice text
B) Second choice text  
C) Third choice text
D) Fourth choice text
Answer: C
Explanation: short explanation of why C is correct

**2. Next question here?**
A) Choice A text
B) Choice B text
C) Choice C text
D) Choice D text
Answer: B
Explanation: short explanation of why B is correct

(Continue for all 7 questions)

Passage:
{text}"""

    
    for model_name in [PRIMARY_MODEL, FALLBACK_MODEL]:
        try:
            print(f"Trying Gemini model: {model_name}...")
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"Error with {model_name}: {e}")

    return "Failed to generate questions."

def parse_questions(raw_text):
    """
    Parse the raw Gemini output into structured data.

    Args:
        raw_text (str): The raw text output from Gemini.

    Returns:
        list[dict]: A list of question dicts with empty answers (for now).
    """
    questions = []
    current_question = None

    # Detect lines like "**1. What is X?**"
    question_pattern = re.compile(r'^\*\*\d+\.\s*(.+?)\*\*')
    choice_pattern = re.compile(r'^[A-D]\)\s*(.+)')
    answer_pattern = re.compile(r'^Answer:\s*([A-D])', re.IGNORECASE)
    explanation_pattern = re.compile(r'^(?:Explanation|Reason|Rationale):\s*(.+)$', re.IGNORECASE)

    for line in raw_text.splitlines():
        line = line.strip()
        if not line:
            continue

        if question_pattern.match(line):
            if current_question:
                questions.append(current_question)
            current_question = {"question_text": "", "answers": [], "correct_choice": None, "explanation": ""}
            current_question["question_text"] = question_pattern.match(line).group(1).strip()
        elif choice_pattern.match(line) and current_question:
            choice_text = choice_pattern.match(line).group(1).strip()
            choice_letter = line[0]  # 'A', 'B', 'C', or 'D'
            current_question["answers"].append({
                "choice_letter": choice_letter,
                "choice_text": choice_text,
                "is_correct": False
            })
        elif 'A)' in line and 'B)' in line and 'C)' in line and 'D)' in line and current_question:
            # Handle case where all choices are on one line
            choice_matches = re.findall(r'([A-D])\s*\)\s*([^A-D]+?)(?=\s*[A-D]\s*\)|$)', line)
            for choice_letter, choice_text in choice_matches:
                current_question["answers"].append({
                    "choice_letter": choice_letter,
                    "choice_text": choice_text.strip(),
                    "is_correct": False
                })
        elif answer_pattern.match(line) and current_question:
            correct_letter = answer_pattern.match(line).group(1).upper()
            current_question["correct_choice"] = correct_letter
            for ans in current_question["answers"]:
                ans["is_correct"] = (ans["choice_letter"] == correct_letter)
        elif explanation_pattern.match(line) and current_question:
            current_question["explanation"] = explanation_pattern.match(line).group(1).strip()
        elif current_question and current_question.get("explanation") and not line.startswith("**"):
            current_question["explanation"] = f"{current_question['explanation']} {line}".strip()

    if current_question:
        questions.append(current_question)

    return questions


def save_parsed_questions(document, parsed_questions):
    """
    Save parsed questions to the database with proper error handling.
    
    Args:
        document: UploadedDocument instance
        parsed_questions: List of parsed question dictionaries
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        print(f"Attempting to save {len(parsed_questions)} questions to database...")

        with transaction.atomic():
            for q in parsed_questions:
                print(f"Creating question: {q['question_text'][:50]}...")

                correct_choice = q.get("correct_choice")
                explanation = q.get("explanation", "")

                new_question = QuizQuestion.objects.create(
                    document=document,
                    question_text=q["question_text"],
                    explanation=explanation
                )

                print(f"Question created with ID: {new_question.id}")

                for ans in q["answers"]:
                    is_correct = ans.get("is_correct", False)
                    if correct_choice:
                        is_correct = is_correct or ans["choice_letter"] == correct_choice
                    QuizAnswer.objects.create(
                        question=new_question,
                        choice_letter=ans["choice_letter"],
                        choice_text=ans["choice_text"],
                        is_correct=is_correct
                    )
                    print(f"   Answer {ans['choice_letter']}: {ans['choice_text'][:30]}...")

                print(f"All answers saved for question {new_question.id}")

        print(f"Successfully saved {len(parsed_questions)} questions with all answers!")
        return True

    except Exception as e:
        print(f"Error saving questions to database: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return False
