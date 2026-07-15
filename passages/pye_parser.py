"""
Deterministic parser for the PYE reading-comprehension .docx format.

No Django / no HTTP imports -> pure + unit-testable.
Returns plain dataclasses that a separate DB-writer maps onto
UploadedDocument / QuizQuestion / QuizAnswer.
"""
from __future__ import annotations
import re
from dataclasses import dataclass, field
from typing import Optional

import docx  # python-docx (already in requirements.txt)


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


# ---- section markers -------------------------------------------------------

QUESTIONS_HEADER = re.compile(r"^questions?\s+to\s+answer\b", re.I)
ANSWER_KEY_HEADER = re.compile(r"^answer\s+key", re.I)

# "1. Question text"  /  "1) Question text"
QUESTION_RE = re.compile(r"^(\d+)\s*[.)]\s*(.+)$", re.S)
# "A. choice" / "A) choice" / "A.choice" (spacing is inconsistent in PYE docs)
CHOICE_RE = re.compile(r'^([A-D])\s*[.)]\s*["\u201c\u201d]?\s*(.+)$', re.S)
# answer-key line: "A (explanation ...)"  -- letter, then explanation in parens
KEY_RE = re.compile(r'^([A-D])\s*\((.*)\)\s*$', re.S)
# fallback: bare "A" with no explanation
KEY_BARE_RE = re.compile(r"^([A-D])\s*$")


def _clean(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def extract_paragraphs(source) -> list[str]:
    """source: path str or a file-like object. Returns non-normalized paragraph texts."""
    doc = docx.Document(source)
    return [p.text for p in doc.paragraphs]


def parse_pye(paragraphs: list[str]) -> ParsedDoc:
    # strip empties but remember order
    lines = [p.rstrip() for p in paragraphs]

    # locate the two section headers
    q_start = a_start = None
    for i, ln in enumerate(lines):
        t = ln.strip()
        if q_start is None and QUESTIONS_HEADER.match(t):
            q_start = i
        elif a_start is None and ANSWER_KEY_HEADER.match(t):
            a_start = i
    if q_start is None:
        raise PYEParseError("Could not find a 'Questions to Answer' header.")
    if a_start is None:
        raise PYEParseError("Could not find an 'Answer Key' header.")
    if not (0 < q_start < a_start):
        raise PYEParseError("Section headers are out of order.")

    # --- title + passage ---
    non_empty_head = [ln for ln in lines[:q_start] if ln.strip()]
    if not non_empty_head:
        raise PYEParseError("No title/passage found before the questions.")
    title = _clean(non_empty_head[0])
    passage = "\n\n".join(_clean(ln) for ln in non_empty_head[1:])

    # --- questions block ---
    questions: list[Question] = []
    current: Optional[Question] = None
    for ln in lines[q_start + 1:a_start]:
        t = ln.strip()
        if not t:
            continue
        mq = QUESTION_RE.match(t)
        mc = CHOICE_RE.match(t)
        # A choice like "A. ..." must be tested before question, but question
        # numbers are digits so they never collide with A-D letters.
        if mq:
            current = Question(number=int(mq.group(1)), text=_clean(mq.group(2)))
            questions.append(current)
        elif mc and current is not None:
            current.choices.append(Choice(letter=mc.group(1), text=_clean(mc.group(2))))
        elif current is not None and current.choices:
            # continuation of the previous choice (wrapped line)
            current.choices[-1].text = _clean(current.choices[-1].text + " " + t)
        elif current is not None:
            current.text = _clean(current.text + " " + t)

    # --- answer key (matched positionally to questions) ---
    key_entries: list[tuple[str, str]] = []
    for ln in lines[a_start + 1:]:
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
            # wrapped explanation line
            letter, expl = key_entries[-1]
            key_entries[-1] = (letter, _clean(expl + " " + t))

    for q, (letter, expl) in zip(questions, key_entries):
        q.correct_letter = letter
        q.explanation = expl
        for c in q.choices:
            c.is_correct = (c.letter == letter)

    return ParsedDoc(title=title, passage=passage, questions=questions)


def validate(doc: ParsedDoc) -> list[str]:
    """Return a list of human-readable problems (empty == clean)."""
    problems: list[str] = []
    if not doc.passage.strip():
        problems.append("Passage is empty.")
    if not doc.questions:
        problems.append("No questions were found.")
    for q in doc.questions:
        letters = [c.letter for c in q.choices]
        if letters != ["A", "B", "C", "D"]:
            problems.append(f"Q{q.number}: expected choices A-D, got {letters}.")
        if q.correct_letter is None:
            problems.append(f"Q{q.number}: no answer key entry (positional mismatch?).")
        elif q.correct_letter not in letters:
            problems.append(f"Q{q.number}: answer key letter {q.correct_letter} not among choices.")
        if not q.explanation:
            problems.append(f"Q{q.number}: missing explanation.")
    return problems
