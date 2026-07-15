import re
from docx import Document

def parse_pye_document(file_path):
    doc = Document(file_path)

    data = {
        "title": "",
        "passage_paragraphs": [],
        "questions": []
    }
    # each paragraph gets handled differently depending on the section value
    current_section = "title"

    question_pattern = re.compile(r'^\s*(\d+)[\.\s:]+(.*)')
    choice_pattern = re.compile(r'^\s*([A-Da-d])[\.\)\s:]+(.*)')
    answer_key_pattern = re.compile(r'^\s*([A-Da-d])\s*\((.*)\)?')

    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            continue

        if current_section == "title":
            # first non empty paragraph we can assume is always the title 
            data["title"] = text
            current_section = "passage"
            continue
            
        # these are section dividers that can occur in the middle of the loop
        if "Questions to Answer" in text:
            current_section = "questions"
            continue
        elif "Answer Key with Explanations" in text:
            current_section = "answers"
            continue
            
        # this checks for the passage
        if current_section == "passage":
            data["passage_paragraphs"].append(text)
            continue

        if current_section == "questions":
            question_match = question_pattern.match(text)
            if question_match:
                data["questions"].append({
                    "number": int(question_match.group(1)),
                    "question_text": question_match.group(2),
                    "choices": {},
                    "explanation": "",
                    "correct_choice": ""
                })
                continue

            choice_match = choice_pattern.match(text)
            # want to make sure we can group the choice and length of the question 
            if choice_match and len(data["questions"]) > 0:
                letter = choice_match.group(1).upper()
                data["questions"][-1]["choices"][letter] = choice_match.group(2)
                continue
            
        if current_section == "answers":
            answer_match = answer_key_pattern.match(text)
            if answer_match:
                letter = answer_match.group(1).upper()
                explanation = answer_match.group(2).strip().rstrip(')')
                # the answer key is not numbered in the doc, so we match by order
                # if first question doesnt have a correct choice, keep going
                # so far this works for the 2 source docs, but worth modifying with another parse checker
                for q in data["questions"]:
                    if not q["correct_choice"]:
                        q["correct_choice"] = letter
                        q["explanation"] = explanation
                        break

    return data


