from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Iterable

from docx import Document
from docx.document import Document as DocxDocument
from docx.table import Table
from docx.text.paragraph import Paragraph


QUESTION_START_RE = re.compile(r'^(?:Q(?:uestion)?\s*)?(\d+)[\).:-]\s*(.+)$', re.IGNORECASE)
OPTION_RE = re.compile(r'^(?:[-*•]\s*)?([A-D])[\).:-]\s*(.+)$', re.IGNORECASE)
ANSWER_RE = re.compile(r'^(?:Answer|Correct Answer|Correct)\s*[:\-]\s*([A-D])\b', re.IGNORECASE)
EXPLANATION_RE = re.compile(r'^(?:Explanation|Reason|Rationale)\s*[:\-]\s*(.+)$', re.IGNORECASE)
HEADING_RE = re.compile(r'^(?:Passage|Reading Passage|Questions?|Comprehension Questions)\s*[:\-]?\s*$', re.IGNORECASE)


@dataclass
class ParsedDocument:
    parsed_text: str
    questions: list[dict] = field(default_factory=list)
    raw_lines: list[str] = field(default_factory=list)


def iter_block_items(document: DocxDocument) -> Iterable[Paragraph | Table]:
    """Yield paragraphs and tables in the order they appear in the document."""

    for child in document.element.body.iterchildren():
        if child.tag.endswith('}p'):
            yield Paragraph(child, document)
        elif child.tag.endswith('}tbl'):
            yield Table(child, document)


def _clean_text(value: str) -> str:
    return ' '.join(value.replace('\xa0', ' ').split()).strip()


def _table_to_lines(table: Table) -> list[str]:
    lines: list[str] = []
    for row in table.rows:
        cell_texts = [_clean_text(cell.text) for cell in row.cells]
        row_text = [text for text in cell_texts if text]
        if row_text:
            lines.extend(row_text)
    return lines


def extract_lines(document: DocxDocument) -> list[str]:
    lines: list[str] = []

    for block in iter_block_items(document):
        if isinstance(block, Paragraph):
            text = _clean_text(block.text)
            if text:
                lines.append(text)
        else:
            lines.extend(_table_to_lines(block))

    return lines


def _split_combined_choices(line: str) -> list[tuple[str, str]]:
    matches = list(re.finditer(r'([A-D])[\).:-]\s*(.*?)(?=(?:\s+[A-D][\).:-]\s*)|$)', line, re.IGNORECASE))
    if len(matches) <= 1:
        return []

    choices: list[tuple[str, str]] = []
    for match in matches:
        letter = match.group(1).upper()
        text = _clean_text(match.group(2))
        if text:
            choices.append((letter, text))
    return choices


def _append_answer(answers: list[dict], letter: str, text: str) -> None:
    if not text:
        return
    answers.append({
        'choice_letter': letter,
        'choice_text': text,
        'is_correct': False,
    })


def parse_document(document: DocxDocument) -> ParsedDocument:
    """Parse a DOCX document into passage text and quiz question data."""

    lines = extract_lines(document)
    passage_lines: list[str] = []
    questions: list[dict] = []
    current_question: dict | None = None
    seen_question_section = False
    explanation_mode = False

    def flush_question() -> None:
        nonlocal current_question, explanation_mode
        if current_question:
            current_question['question_text'] = _clean_text(current_question['question_text'])
            current_question['explanation'] = _clean_text(current_question['explanation'])
            questions.append(current_question)
        current_question = None
        explanation_mode = False

    for line in lines:
        if HEADING_RE.match(line):
            if current_question and current_question['answers']:
                flush_question()
            seen_question_section = seen_question_section or 'question' in line.lower()
            continue

        question_match = QUESTION_START_RE.match(line)
        if question_match:
            flush_question()
            seen_question_section = True
            current_question = {
                'question_text': question_match.group(2).strip(),
                'answers': [],
                'correct_choice': None,
                'explanation': '',
            }
            explanation_mode = False
            continue

        if current_question is None:
            if not seen_question_section:
                passage_lines.append(line)
            continue

        answer_match = ANSWER_RE.match(line)
        if answer_match:
            correct_choice = answer_match.group(1).upper()
            current_question['correct_choice'] = correct_choice
            for answer in current_question['answers']:
                answer['is_correct'] = answer['choice_letter'] == correct_choice
            explanation_mode = False
            continue

        explanation_match = EXPLANATION_RE.match(line)
        if explanation_match:
            explanation_mode = True
            current_question['explanation'] = explanation_match.group(1).strip()
            continue

        combined_choices = _split_combined_choices(line)
        if combined_choices:
            for letter, text in combined_choices:
                _append_answer(current_question['answers'], letter, text)
            explanation_mode = False
            continue

        option_match = OPTION_RE.match(line)
        if option_match:
            _append_answer(current_question['answers'], option_match.group(1).upper(), option_match.group(2).strip())
            explanation_mode = False
            continue

        if explanation_mode:
            current_question['explanation'] = f"{current_question['explanation']} {line}".strip()
            continue

        if current_question['answers'] and len(current_question['answers']) < 4:
            last_answer = current_question['answers'][-1]
            last_answer['choice_text'] = f"{last_answer['choice_text']} {line}".strip()
            continue

        current_question['question_text'] = f"{current_question['question_text']} {line}".strip()

    flush_question()

    parsed_text = '\n'.join(passage_lines).strip() or '\n'.join(lines).strip()
    return ParsedDocument(parsed_text=parsed_text, questions=questions, raw_lines=lines)


def parse_uploaded_docx(file_obj) -> ParsedDocument:
    """Open a DOCX file-like object and parse it."""

    if hasattr(file_obj, 'seek'):
        file_obj.seek(0)

    document = Document(file_obj)
    return parse_document(document)
    return parse_document(document)