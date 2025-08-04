import os
import google.generativeai as genai
from dotenv import load_dotenv
import re

# Load environment variables
load_dotenv()

# Configure Gemini with API key
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Primary and fallback models
PRIMARY_MODEL = "gemini-1.5-flash"
FALLBACK_MODEL = "gemini-1.5-pro"

def generate_questions(text):
    """
    Given a passage of text, generate 7 reading comprehension questions using Gemini.
    Falls back to another model if the first one fails.
    """
    prompt = f"Generate 7 reading comprehension questions based on this passage:\n\n{text}"
    
    for model_name in [PRIMARY_MODEL, FALLBACK_MODEL]:
        try:
            print(f"Trying Gemini model: {model_name}...")
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"⚠️ Error with {model_name}: {e}")
    
    return "❌ Failed to generate questions."

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

    # Detect lines like "1. **What is X?**"
    question_pattern = re.compile(r'^\d+\.\s*\*\*(.+?)\*\*')

    for line in raw_text.splitlines():
        line = line.strip()
        if not line:
            continue

        match = question_pattern.match(line)
        if match:
            # Save previous question if it exists
            if current_question:
                questions.append(current_question)

            question_text = match.group(1).strip()
            current_question = {
                "question_text": question_text,
                "answers": []  # We can add answer parsing later if Gemini outputs them
            }
        else:
            # Append extra explanation text to the current question
            if current_question:
                current_question["question_text"] += " " + line

    # Add the last question
    if current_question:
        questions.append(current_question)

    return questions

def save_parsed_questions(document, parsed_questions):
    for q in parsed_questions:
        new_question = QuizQuestion.objects.create(
            document=document,
            question_text=q["question_text"],
            explanation=""  # or fill if you get explanation
        )
        for ans in q["answers"]:
            QuizAnswer.objects.create(
                question=new_question,
                choice_letter=ans["choice_letter"],
                choice_text=ans["choice_text"],
                is_correct=ans["is_correct"]
            )
