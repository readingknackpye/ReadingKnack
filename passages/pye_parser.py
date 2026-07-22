"""
Deterministic parser for the PYE reading-comprehension .docx format.

No Django / no HTTP imports -> pure + unit-testable.
Returns plain dataclasses that a separate DB-writer maps onto
UploadedDocument / QuizQuestion / QuizAnswer.
"""
from __future__ import annotations
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import docx  # python-docx (already in requirements.txt)
from pypdf import PdfReader


# ---- data shapes -----------------------------------------------------------

@dataclass
class Choice:
    letter: str          # 'A'..'D'
    text: str
    is_correct: bool = False


@dataclass
class Question:
    number: int
    text: str
    choices: list[Choice] = field(default_factory=list)
    correct_letter: Optional[str] = None
    explanation: str = ""


@dataclass
class ParsedDoc:
    title: str
    passage: str
    questions: list[Question] = field(default_factory=list)


class PYEParseError(Exception):
    pass


SUPPORTED_EXTENSIONS = {".docx", ".pdf"}


EXPECTED_FORMAT_HELP = (
    "Expected format: title paragraph, passage paragraphs, a 'Questions to Answer' "
    "header, numbered questions like '1. What is the main idea?', choices A-D "
    "like 'A. choice text', an 'Answer Key' header, and answer-key lines like "
    "'B (explanation)'."
)


# ---- section markers -------------------------------------------------------

QUESTIONS_HEADER = re.compile(r"^questions?\s+to\s+answer\b", re.I)
ANSWER_KEY_HEADER = re.compile(r"^answer\s+key", re.I)
QUESTIONS_HEADER_TEXT = re.compile(r"\bquestions?\s+to\s+answer\b", re.I)
ANSWER_KEY_HEADER_TEXT = re.compile(r"\banswer\s+key(?:\s+with\s+explanations?)?:?", re.I)

# "1. Question text"  /  "1) Question text"
QUESTION_RE = re.compile(r"^(\d+)\s*[.)]\s*(.+)$", re.S)
QUESTION_MARKER_RE = re.compile(r"(?<!\w)(\d{1,2})\s*[.)]\s+", re.S)
# "A. choice" / "A) choice" / "A.choice" (spacing is inconsistent in PYE docs)
CHOICE_RE = re.compile(r'^([A-D])\s*[.)]\s*["\u201c\u201d]?\s*(.+)$', re.S)
CHOICE_MARKER_RE = re.compile(r'(?<!\w)([A-D])\s*[.)]\s*["\u201c\u201d]?\s+', re.S)
# answer-key line: "A (explanation ...)"  -- letter, then explanation in parens
KEY_RE = re.compile(r'^([A-D])\s*\((.*)\)\s*$', re.S)
NUMBERED_KEY_MARKER_RE = re.compile(r"(?<!\w)(\d{1,2})\s*[.)]\s*([A-D])\s*(?:\(\s*)?", re.S)
# fallback: bare "A" with no explanation
KEY_BARE_RE = re.compile(r"^([A-D])\s*$")


def _clean(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def _paragraph_ref(lines: list[str], index: int) -> str:
    text = _clean(lines[index])
    if len(text) > 100:
        text = text[:97] + "..."
    return f"paragraph {index + 1} ('{text}')"


def _preview_readable_paragraphs(lines: list[str], limit: int = 5) -> str:
    readable = [_clean(ln) for ln in lines if ln.strip()]
    if not readable:
        return "No readable paragraph text was found in the uploaded file."

    preview = "; ".join(f"'{ln[:80]}'" for ln in readable[:limit])
    if len(readable) > limit:
        preview += "; ..."
    return f"First readable paragraphs: {preview}."


def _format_error(problem: str, *, hint: str | None = None, context: str | None = None) -> str:
    parts = [problem]
    if context:
        parts.append(context)
    if hint:
        parts.append(f"Fix: {hint}")
    parts.append(EXPECTED_FORMAT_HELP)
    return " ".join(parts)


def _source_name(source, file_name: str | None = None) -> str:
    if file_name:
        return file_name
    if isinstance(source, (str, Path)):
        return str(source)
    return getattr(source, "name", "") or ""


def _source_extension(source, file_name: str | None = None) -> str:
    return Path(_source_name(source, file_name)).suffix.lower()


def extract_docx_paragraphs(source) -> list[str]:
    """source: path str or a file-like object. Returns non-normalized paragraph texts."""
    doc = docx.Document(source)
    return [p.text for p in doc.paragraphs]


def extract_pdf_paragraphs(source) -> list[str]:
    """Extract readable text blocks from a PDF for the PYE parser."""
    try:
        reader = PdfReader(source)
    except Exception as exc:
        raise PYEParseError(_format_error(
            "Could not read the uploaded PDF.",
            hint="Upload a readable, uncorrupted PDF or export the source document again.",
        )) from exc

    if reader.is_encrypted:
        try:
            reader.decrypt("")
        except Exception as exc:
            raise PYEParseError(_format_error(
                "The uploaded PDF is encrypted or password protected.",
                hint="Remove the password/encryption and upload the PDF again.",
            )) from exc

    paragraphs: list[str] = []
    for page_number, page in enumerate(reader.pages, start=1):
        try:
            text = page.extract_text() or ""
        except Exception as exc:
            raise PYEParseError(_format_error(
                f"Could not extract text from page {page_number} of the PDF.",
                hint="Use a text-based PDF instead of a scanned/image-only PDF.",
            )) from exc

        # Preserve page-level reading order while giving the parser paragraph-ish blocks.
        paragraphs.extend(line.strip() for line in text.splitlines() if line.strip())

    if not paragraphs:
        raise PYEParseError(_format_error(
            "No readable text was found in the uploaded PDF.",
            hint="Upload a text-based PDF. Scanned PDFs need OCR before this app can parse them.",
        ))

    return paragraphs


def extract_paragraphs(source, file_name: str | None = None) -> list[str]:
    """Extract parser input paragraphs from a supported upload."""
    extension = _source_extension(source, file_name)
    if extension == ".pdf":
        return extract_pdf_paragraphs(source)
    if extension in {"", ".docx"}:
        return extract_docx_paragraphs(source)

    supported = ", ".join(sorted(SUPPORTED_EXTENSIONS))
    raise PYEParseError(_format_error(
        f"Unsupported file type '{extension or 'unknown'}'.",
        hint=f"Upload one of these formats: {supported}.",
    ))


def _document_text(paragraphs: list[str]) -> str:
    return "\n".join(p.rstrip() for p in paragraphs if p and p.strip())


def _split_marker_chunks(text: str, marker_re: re.Pattern) -> list[tuple[re.Match, str]]:
    matches = list(marker_re.finditer(text))
    chunks: list[tuple[re.Match, str]] = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        chunks.append((match, text[match.end():end].strip()))
    return chunks


def _parse_questions_block(text: str) -> list[Question]:
    normalized = _clean(text)
    questions: list[Question] = []

    for question_match, question_chunk in _split_marker_chunks(normalized, QUESTION_MARKER_RE):
        choice_chunks = _split_marker_chunks(question_chunk, CHOICE_MARKER_RE)
        if choice_chunks:
            question_text = _clean(question_chunk[:choice_chunks[0][0].start()])
        else:
            question_text = _clean(question_chunk)

        question = Question(number=int(question_match.group(1)), text=question_text)
        for choice_match, choice_text in choice_chunks:
            question.choices.append(
                Choice(letter=choice_match.group(1).upper(), text=_clean(choice_text))
            )
        questions.append(question)

    return questions


def _strip_wrapping_parens(text: str) -> str:
    text = text.strip()
    if text.endswith(")"):
        text = text[:-1]
    return text.strip()


def _parse_answer_key_block(text: str) -> dict[int, tuple[str, str]]:
    normalized = _clean(text)
    keyed_answers: dict[int, tuple[str, str]] = {}

    for key_match, explanation in _split_marker_chunks(normalized, NUMBERED_KEY_MARKER_RE):
        keyed_answers[int(key_match.group(1))] = (
            key_match.group(2).upper(),
            _strip_wrapping_parens(explanation),
        )

    return keyed_answers


def _parse_legacy_answer_key(lines: list[str]) -> list[tuple[str, str]]:
    key_entries: list[tuple[str, str]] = []
    for ln in lines:
        t = ln.strip()
        if not t:
            continue
        mk = KEY_RE.match(t)
        mb = KEY_BARE_RE.match(t)
        if mk:
            key_entries.append((mk.group(1), _clean(mk.group(2))))
        elif mb:
            key_entries.append((mb.group(1), ""))
        elif key_entries:
            letter, expl = key_entries[-1]
            key_entries[-1] = (letter, _clean(expl + " " + t))
    return key_entries


def parse_pye(paragraphs: list[str]) -> ParsedDoc:
    text = _document_text(paragraphs)
    lines = [p.rstrip() for p in paragraphs]

    q_match = QUESTIONS_HEADER_TEXT.search(text)
    
    if q_match is None:
        non_empty = [_clean(ln) for ln in lines if ln.strip()]
        if not non_empty:
            raise PYEParseError("Document is completely empty.")
        title = _clean(non_empty[0])
        passage = _clean(" ".join(non_empty[1:]))
        # Return immediately with NO questions
        return ParsedDoc(title=title, passage=passage, questions=[])

    a_match = ANSWER_KEY_HEADER_TEXT.search(text, q_match.end())
    
    if a_match is None:
        a_match_start = len(text)
        answer_text = ""
    else:
        a_match_start = a_match.start()
        answer_text = text[a_match.end():]

    if not q_match.start() < a_match.start():
        raise PYEParseError(_format_error(
            "The section headers are out of order.",
            hint="Put the title and passage first, then 'Questions to Answer', then questions, then 'Answer Key'.",
        ))

    # --- title + passage ---
    head_text = text[:q_match.start()]
    non_empty_head = [_clean(ln) for ln in head_text.splitlines() if ln.strip()]
    if not non_empty_head:
        raise PYEParseError(_format_error(
            "No title or passage text was found before the questions.",
            hint="Add a title paragraph and at least one passage paragraph before the 'Questions to Answer' header.",
        ))
    title = _clean(non_empty_head[0])
    passage = _clean(" ".join(non_empty_head[1:]))

    # --- questions block ---
    questions = _parse_questions_block(text[q_match.end():a_match.start()])

    # --- answer key (matched positionally to questions) ---
    answer_text = text[a_match.end():]
    keyed_answers = _parse_answer_key_block(answer_text)
    if keyed_answers:
        for q in questions:
            if q.number not in keyed_answers:
                continue
            letter, explanation = keyed_answers[q.number]
            q.correct_letter = letter
            q.explanation = explanation
            for c in q.choices:
                c.is_correct = (c.letter == letter)
        return ParsedDoc(title=title, passage=passage, questions=questions)

    key_entries = _parse_legacy_answer_key(answer_text.splitlines())
    for q, (letter, explanation) in zip(questions, key_entries):
        q.correct_letter = letter
        q.explanation = explanation
        for c in q.choices:
            c.is_correct = (c.letter == letter)

    return ParsedDoc(title=title, passage=passage, questions=questions)


def validate(doc: ParsedDoc) -> list[str]:
    """Return a list of human-readable problems (empty == clean)."""
    problems: list[str] = []
    if not doc.passage.strip():
        problems.append(
            "Passage is empty. Add at least one passage paragraph between the title and the 'Questions to Answer' header."
        )
    if not doc.questions:
        problems.append(
            "No questions were found. Add numbered questions after the 'Questions to Answer' header, such as '1. What is the main idea?'."
        )
    for q in doc.questions:
        letters = [c.letter for c in q.choices]
        if letters != ["A", "B", "C", "D"]:
            found = ", ".join(letters) if letters else "no choices"
            problems.append(
                f"Q{q.number}: expected exactly four answer choices labeled A, B, C, and D; found {found}. "
                "Put each choice in its own paragraph, for example 'A. choice text'."
            )
        for choice in q.choices:
            if not choice.text.strip():
                problems.append(
                    f"Q{q.number}: answer choice {choice.letter} is empty. "
                    f"Add answer text after '{choice.letter}.'"
                )
        if q.correct_letter is None:
            problems.append(
                f"Q{q.number}: missing answer key entry. Add one answer-key line for each question, in order, "
                "after the 'Answer Key' header, for example 'B (explanation)'."
            )
        elif q.correct_letter not in letters:
            problems.append(
                f"Q{q.number}: answer key says {q.correct_letter}, but that choice does not exist for the question."
            )
        if not q.explanation:
            problems.append(
                f"Q{q.number}: missing answer explanation. Use an answer-key line like '{q.correct_letter or 'B'} (explanation)'."
            )
    return problems


def format_validation_errors(problems: list[str], limit: int = 5) -> str:
    """Format parser validation problems for display in upload forms."""
    if not problems:
        return ""

    shown = problems[:limit]
    if len(problems) > limit:
        shown.append(f"...and {len(problems) - limit} more issue(s).")

    return _format_error(
        "The document was uploaded, but its quiz format is incomplete.",
        hint=" ".join(shown),
    )
