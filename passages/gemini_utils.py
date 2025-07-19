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

