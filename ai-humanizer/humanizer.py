"""
SENTIC — BERT Pragmatic Marker Injector (Stage 3)
─────────────────────────────────────────────────
Replaces the old BERT MLM synonym-swap loop.

Why the old approach was wrong:
  BERT Masked LM fills masked positions with the most *probable* token —
  which is exactly what AI detectors look for (low perplexity).
  Token-level synonym replacement creates a "Frankenstein" text that
  raises, not lowers, detection scores.

New role:
  After Groq's Stages 1 & 2, this module walks the sentence list and
  probabilistically prepends natural human pragmatic markers to sentences
  that lack any discourse signal. Pragmatic markers carry near-zero
  semantic weight but high stylistic fingerprint — making text appear
  more human without distorting meaning.
"""

import re
import random
import torch
from transformers import BertTokenizer, BertModel

# ── Marker pools ────────────────────────────────────────────────────────────
MARKERS_HEDGING     = ["Admittedly,", "To be fair,", "That said,", "In fairness,"]
MARKERS_EMPHASIS    = ["Frankly,", "Honestly,", "Put simply,", "In plain terms,"]
MARKERS_TRANSITION  = ["In practice,", "The catch is,", "What this means —"]
MARKERS_CONTRAST    = ["Oddly enough,", "Against expectations,", "Counterintuitively,"]
MARKERS_CONSEQUENCE = ["As a result,", "The consequence is clear:", "So it follows that"]

ALL_MARKERS = (
    MARKERS_HEDGING + MARKERS_EMPHASIS +
    MARKERS_TRANSITION + MARKERS_CONTRAST + MARKERS_CONSEQUENCE
)

# Signals that a sentence already has a human marker — skip it
EXISTING_SIGNALS = [
    "admittedly", "frankly", "honestly", "in practice", "oddly",
    "that said", "to be fair", "in fact", "interestingly", "notably",
    "but here", "the catch", "which leads", "as a result", "therefore",
    "however", "although", "while ", "despite", "because", "since ",
    "—", ";"
]

# ── Load BERT (lightweight — only the encoder, no MLM head needed) ──────────
try:
    _tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
    _model = BertModel.from_pretrained("bert-base-uncased")
    _model.eval()
    print("BERT Pragmatic Marker Injector: model loaded ✓")
    BERT_AVAILABLE = True
except Exception as e:
    print(f"BERT load warning: {e} — rule-only mode active.")
    BERT_AVAILABLE = False


def _needs_marker(sentence: str) -> bool:
    """
    True if the sentence qualifies for marker injection:
    - More than 6 words (fragments look fine without markers)
    - First 60 chars contain none of the existing signal strings
    """
    s = sentence.strip().lower()
    if len(s.split()) < 7:
        return False
    prefix = s[:60]
    return not any(sig in prefix for sig in EXISTING_SIGNALS)


def inject_pragmatic_markers(text: str, injection_rate: float = 0.28) -> str:
    """
    Walk sentences. For each eligible sentence, with probability
    `injection_rate`, prepend a randomly chosen pragmatic marker.
    Caps injections at ~25% of total sentences to avoid over-engineering.
    """
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    cap = max(1, len(sentences) // 4)
    injected = 0
    result = []

    for s in sentences:
        s = s.strip()
        if not s:
            continue
        if injected < cap and _needs_marker(s) and random.random() < injection_rate:
            marker = random.choice(ALL_MARKERS)
            # Lowercase the first letter of the original sentence
            s = marker + " " + s[0].lower() + s[1:]
            injected += 1
        result.append(s)

    return " ".join(result)


# ── Legacy shim — keeps fastapi_app.py import working ───────────────────────
def humanize_text_bert(text: str) -> str:
    return inject_pragmatic_markers(text)
