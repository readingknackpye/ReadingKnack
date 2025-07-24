import os
import google.generativeai as genai
from dotenv import load_dotenv

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
        raw_text (str): The raw text output from the Gemini model.

    Returns:
        list[dict]: A list of dictionaries, each representing a question and its answers.
    """
    questions = []
    current_question = None

    for line in raw_text.splitlines():
        line = line.strip()
        if not line:
            continue  # skip empty lines

        # Detect question start
        if line.lower().startswith("q:") or line.lower().startswith("question"):
            # Save previous question
            if current_question:
                questions.append(current_question)

            # Strip prefix like "Q: " or "Question 1: "
            if ":" in line:
                question_text = line.split(":", 1)[1].strip()
            else:
                question_text = line

            current_question = {
                "question_text": question_text,
                "answers": []
            }

        # Detect answers start
        elif line.lower().startswith("a:") or line[0].upper() in ["A", "B", "C", "D"]:
            if current_question is None:
                continue  # Ignore answers if no question started

            # Strip "A:", "B.", or similar prefixes
            if ":" in line:
                answer_part = line.split(":", 1)[1].strip()
                choice_letter = line[0].upper()
            elif "." in line:
                # Format like "A. answer text"
                choice_letter = line[0].upper()
                answer_part = line[2:].strip()
            else:
                choice_letter = line[0].upper()
                answer_part = line[1:].strip()

            # Check if marked correct
            is_correct = "(correct)" in answer_part.lower()
            answer_text = answer_part.replace("(correct)", "").strip()

            current_question["answers"].append({
                "choice_letter": choice_letter,
                "choice_text": answer_text,
                "is_correct": is_correct
            })

        else:
            # If continuing text for question or last answer
            if current_question:
                if current_question["answers"]:
                    # Append to last answer text
                    current_question["answers"][-1]["choice_text"] += " " + line
                else:
                    # Append to question text
                    current_question["question_text"] += " " + line

    # Add last question if exists
    if current_question:
        questions.append(current_question)

    return questions

# def save_parsed_questions(document, parsed_questions):
#     for q in parsed_questions:

# def save_parsed_questions(document, parsed_questions):
#     for q in parsed_questions:
#         new_question = QuizQuestion.objects.create(
#             document=document,
#             question_text=q["question_text"],
#             explanation=""  # or fill if you get explanation
#         )
#         for ans in q["answers"]:
#             QuizAnswer.objects.create(
#                 question=new_question,
#                 choice_letter=ans["choice_letter"],
#                 choice_text=ans["choice_text"],
#                 is_correct=ans["is_correct"]
#             )
