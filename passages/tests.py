from django.test import TestCase
from passages.gemini_utils import parse_questions

sample_text = """
Q: What is the capital of France?
A: A. Paris (correct)
B: B. London
C: C. Rome
D: D. Berlin

Q: Which planet is known as the Red Planet?
A: A. Venus
B: B. Mars (correct)
C: C. Jupiter
D: D. Saturn
"""

questions = parse_questions(sample_text)
for q in questions:
    print(q)

