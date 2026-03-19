"""
SENTIC — Stage 2: Linguistic Overdrive Engine (v2.0)
─────────────────────────────────────────────────────
Reverse-engineered countermeasures against all 8 AI detector signals:

Signal 1 — Perplexity:         Vocabulary perturbation via synonym rotation
Signal 2 — Burstiness (CV):    Aggressive sentence merge/split → CV > 0.75
Signal 3 — Sentence-Start:     Diversity enforcer → <15% repeated starters
Signal 4 — Cosine Continuity:  Micro-pivot injector every 3-4 sentences
Signal 5 — Passive Voice:      Regex-based passive → active converter
Signal 6 — TTR (Lexical Div.): Synonym deduplication for repeated adjectives/adverbs
Signal 7 — Phrase Fingerprint: Connector bigram deduplicator
Signal 8 — Punctuation:        Rich punctuation injector (—, (), ;, ?, ...)
"""

import re
import random

# ══════════════════════════════════════════════════════════════════════════════

# SIGNAL DATA POOLS
# ══════════════════════════════════════════════════════════════════════════════

# ─── Discourse Markers (Signal 1, 4, 7) ──────────────────────────────────────
MARKERS_HEDGING     = ["Admittedly,", "To be fair,", "That said,", "In fairness,", "Granted,"]
MARKERS_EMPHASIS    = ["Frankly,", "Honestly,", "Put simply,", "In plain terms,", "Bluntly,"]
MARKERS_TRANSITION  = ["In practice,", "The catch is,", "What this means —", "The implication:"]
MARKERS_CONTRAST    = ["Oddly enough,", "Against expectations,", "Counterintuitively,", "Strangely,"]
MARKERS_CONSEQUENCE = ["As a result,", "The consequence is clear:", "Which means,", "And so,"]
MARKERS_MICRO_PIVOT = [
    "That said, the picture shifts when you zoom out.",
    "Worth noting, briefly, is the broader tension here.",
    "Stepping back for a moment —",
    "There's a deeper thread worth pulling on.",
    "The stranger implication sits just beneath the surface.",
    "Here's where it gets interesting:",
    "Pull the lens back and a different pattern emerges.",
    "The adjacent question is worth asking, briefly:",
]
HUMAN_FILLERS = [
    "Essentially,", "If we're being honest,", "The thing is,", "As it happens,",
    "In a sense,", "By and large,", "Strictly speaking,", "Mind you,",
    "For what it's worth,", "More often than not,", "Curious as it sounds,",
    "And yet,", "Still,", "Here's the catch:", "Which leaves us with:",
]

ALL_MARKERS = (
    MARKERS_HEDGING + MARKERS_EMPHASIS + MARKERS_TRANSITION +
    MARKERS_CONTRAST + MARKERS_CONSEQUENCE + HUMAN_FILLERS
)

# ─── Sentence Opener Alternatives (Signal 3: start diversity) ─────────────────
OPENER_ALTERNATES = [
    "Running counter to expectations,", "Buried within the detail,",
    "Against the conventional read,", "What emerges clearly is",
    "Pulling back to the broader picture,", "On closer inspection,",
    "At its core,", "When you strip away the surface,",
    "Worth emphasising here:", "Beneath the obvious reading lies",
    "From another angle entirely,", "Taken together,",
    "Looking more carefully,", "For the careful observer,",
    "Most striking of all,", "What the data actually shows is",
]

# ─── Synonym pool for common AI adjectives/adverbs (Signal 6: TTR boost) ──────
SYNONYM_MAP = {
    "important": ["significant", "consequential", "weighty", "material", "notable"],
    "significant": ["consequential", "weighty", "material", "notable", "meaningful"],
    "clear": ["apparent", "evident", "unmistakeable", "plain", "manifest"],
    "show": ["reveal", "demonstrate", "indicate", "expose", "surface"],
    "shows": ["reveals", "demonstrates", "indicates", "exposes", "surfaces"],
    "find": ["uncover", "detect", "surface", "arrive at", "establish"],
    "found": ["uncovered", "detected", "surfaced", "established", "identified"],
    "use": ["employ", "apply", "draw on", "deploy", "harness"],
    "used": ["employed", "applied", "drawn on", "deployed", "harnessed"],
    "make": ["render", "produce", "bring about", "generate", "forge"],
    "large": ["considerable", "substantial", "sizeable", "pronounced", "marked"],
    "small": ["modest", "marginal", "negligible", "slender", "scant"],
    "many": ["numerous", "a host of", "an array of", "scores of", "multiple"],
    "often": ["frequently", "routinely", "commonly", "habitually", "repeatedly"],
    "quickly": ["swiftly", "rapidly", "at pace", "without delay", "briskly"],
    "very": ["remarkably", "notably", "particularly", "decidedly", "strikingly"],
    "also": ["too", "as well", "equally", "likewise", "by extension"],
    "however": ["yet", "even so", "all the same", "that said", "and still"],
    "therefore": ["and so", "thus", "which means", "as a consequence", "hence"],
    "new": ["novel", "emergent", "fresh", "nascent", "uncharted"],
    "different": ["distinct", "divergent", "contrasting", "separate", "alternative"],
    "similar": ["comparable", "analogous", "parallel", "akin", "cognate"],
    "high": ["elevated", "considerable", "pronounced", "steep", "substantial"],
    "low": ["modest", "reduced", "diminished", "subdued", "marginal"],
    "good": ["favourable", "sound", "solid", "strong", "promising"],
    "bad": ["problematic", "unfavourable", "adverse", "troubling", "weak"],
    "provide": ["offer", "supply", "furnish", "deliver", "afford"],
    "provides": ["offers", "supplies", "furnishes", "delivers", "affords"],
    "include": ["encompass", "incorporate", "comprise", "feature", "cover"],
    "includes": ["encompasses", "incorporates", "comprises", "features", "covers"],
    "consider": ["examine", "reflect on", "weigh up", "scrutinise", "assess"],
    "suggests": ["indicates", "points to", "implies", "signals", "hints"],
}

# ─── Banned connector phrases for deduplication (Signal 7) ────────────────────
CONNECTOR_ALTERNATES = {
    "however": ["yet", "even so", "all the same", "that said", "still"],
    "therefore": ["and so", "as a consequence", "which means", "hence", "thus it follows"],
    "as a result": ["which means", "the consequence:", "in turn", "and so", "what followed"],
    "in addition": ["beyond this", "there's more:", "equally", "a further point:", "on top of that"],
    "for example": ["as a case in point", "take this:", "consider the instance of", "one illustration:"],
    "in conclusion": ["taken together", "to close:", "zooming out,", "the bottom line:", "what all this suggests"],
    "furthermore": ["beyond that", "there's also", "adding to this,", "a related point:", "equally compelling"],
    "moreover": ["and further", "beyond that,", "layered on top,", "yet also", "equally worth noting"],
    "additionally": ["beyond this,", "on top of that,", "a further consideration:", "equally,"],
}

# ─── Existing human signal patterns (don't inject markers here) ───────────────
EXISTING_SIGNALS = [
    "admittedly", "frankly", "honestly", "in practice", "oddly",
    "that said", "to be fair", "in fact", "interestingly", "notably",
    "but here", "the catch", "which leads", "as a result", "therefore",
    "however", "although", "while ", "despite", "because", "since ",
    "—", ";", "...", "?",
]

# ─── AI-heavy sentence starters to diversify ──────────────────────────────────
AI_STARTERS = ["the ", "this ", "it ", "these ", "there ", "their ", "in the ", "a "]


# ══════════════════════════════════════════════════════════════════════════════
# METRIC FUNCTIONS
# ══════════════════════════════════════════════════════════════════════════════

def _calculate_ttr(text: str) -> float:
    """Type-Token Ratio: measures lexical diversity. Higher = more human."""
    tokens = re.findall(r'\b\w+\b', text.lower())
    if not tokens:
        return 0.0
    return len(set(tokens)) / len(tokens)


def _calculate_cv(sentences: list) -> float:
    """Coefficient of Variation of sentence lengths. Higher = more bursty = more human."""
    lengths = [len(s.split()) for s in sentences if s.strip()]
    if len(lengths) < 2:
        return 0.0
    mean = sum(lengths) / len(lengths)
    if mean == 0:
        return 0.0
    variance = sum((l - mean) ** 2 for l in lengths) / len(lengths)
    return (variance ** 0.5) / mean


def _calculate_start_diversity(sentences: list) -> float:
    """Percentage of unique sentence-starting words. Human target: > 75%."""
    if not sentences:
        return 1.0
    starters = [s.strip().split()[0].lower() if s.strip() else "" for s in sentences]
    unique = len(set(starters))
    return unique / len(starters)


def _needs_marker(sentence: str) -> bool:
    """True if sentence qualifies for marker injection."""
    s = sentence.strip().lower()
    if len(s.split()) < 7:
        return False
    prefix = s[:70]
    return not any(sig in prefix for sig in EXISTING_SIGNALS)


# ══════════════════════════════════════════════════════════════════════════════
# SIGNAL 3: SENTENCE-START DIVERSITY ENFORCER
# ══════════════════════════════════════════════════════════════════════════════

def enforce_sentence_start_diversity(sentences: list) -> list:
    """
    Detects over-used sentence starters. If any word starts > 15% of sentences,
    rewrites those openers using OPENER_ALTERNATES or marker prepending.
    """
    if not sentences:
        return sentences

    from collections import Counter
    starters = [s.strip().lower().split()[0] if s.strip() else "" for s in sentences]
    counts = Counter(starters)
    threshold = max(2, int(len(sentences) * 0.15))

    result = []
    used_alternates = list(OPENER_ALTERNATES)
    random.shuffle(used_alternates)
    alt_idx = 0

    for i, s in enumerate(sentences):
        word = s.strip().lower().split()[0] if s.strip() else ""
        # Rewrite if: over threshold, OR is a known AI starter
        if (counts[word] > threshold or word in [w.lower() for w in AI_STARTERS]) and len(s.split()) > 5:
            # Prepend an alternate opener
            alternate = used_alternates[alt_idx % len(used_alternates)]
            alt_idx += 1
            # Lowercase first char of original sentence
            stripped = s.strip()
            if stripped:
                s = f"{alternate} {stripped[0].lower()}{stripped[1:]}"
        result.append(s)

    return result


# ══════════════════════════════════════════════════════════════════════════════
# SIGNAL 6: TTR BOOSTER (SYNONYM ROTATION)
# ══════════════════════════════════════════════════════════════════════════════

def boost_ttr(text: str) -> str:
    """
    Replaces 2nd+ occurrences of common AI adjectives/adverbs with synonyms
    from the SYNONYM_MAP to boost Type-Token Ratio.
    """
    seen: dict = {}
    words = text.split()
    result = []

    for word in words:
        clean_word = word.strip(".,!?;:—()\"'").lower()
        base = clean_word

        if base in SYNONYM_MAP:
            seen[base] = seen.get(base, 0) + 1
            if seen[base] >= 2:
                synonyms = SYNONYM_MAP[base]
                # pick a synonym not yet used for this base
                used_syns = seen.get(f"_syns_{base}", [])
                available = [s for s in synonyms if s not in used_syns]
                if not available:
                    available = synonyms
                replacement = random.choice(available)
                used_syns.append(replacement)
                seen[f"_syns_{base}"] = used_syns
                # Preserve surrounding punctuation
                prefix = word[:len(word) - len(word.lstrip(".,!?;:—()\"'"))]
                suffix = word[len(word.rstrip(".,!?;:—()\"'")):]
                word = f"{prefix}{replacement}{suffix}"

        result.append(word)

    return " ".join(result)


# ══════════════════════════════════════════════════════════════════════════════
# SIGNAL 4: COSINE CONTINUITY DISRUPTION
# ══════════════════════════════════════════════════════════════════════════════

def inject_cosine_disruption(sentences: list, rate: float = 0.25) -> list:
    """
    Every 3-5 sentences, inserts a brief micro-pivot phrase.
    This breaks the smooth semantic cosine similarity chain detectors measure.
    """
    if len(sentences) < 4:
        return sentences

    result = []
    pivots = list(MARKERS_MICRO_PIVOT)
    random.shuffle(pivots)
    p_idx = 0
    interval = random.randint(3, 5)

    for i, s in enumerate(sentences):
        result.append(s)
        if (i + 1) % interval == 0 and i < len(sentences) - 1 and random.random() < rate:
            pivot = pivots[p_idx % len(pivots)]
            p_idx += 1
            result.append(pivot)
            interval = random.randint(3, 5)  # randomise next interval

    return result


# ══════════════════════════════════════════════════════════════════════════════
# SIGNAL 5: PASSIVE VOICE → ACTIVE CONVERSION
# ══════════════════════════════════════════════════════════════════════════════

def convert_passives(text: str) -> str:
    """
    Regex-based passive voice detector and converter.
    Handles the most common passive constructions.
    """
    replacements = [
        # "is/are/was/were [verb-ed]" → reframe
        (r'\bIt is (shown|demonstrated|argued|suggested|noted|found|known|believed|considered) that\b',
         lambda m: {"shown": "The evidence shows", "demonstrated": "Research demonstrates",
                    "argued": "The argument holds", "suggested": "The data suggests",
                    "noted": "Observers note", "found": "Analysis finds",
                    "known": "We know", "believed": "Many believe",
                    "considered": "Analysts consider"}.get(m.group(1), "One notes")),
        # "is being [verb-ed]"
        (r'\bis being (\w+ed)\b', r'undergoes \1'),
        # "was [verb-ed] by"
        (r'\bwas (\w+ed) by\b', r'\1 by'),
        # "can be [verb-ed]"
        (r'\bcan be (\w+ed)\b', r'one can \1'),
        # "should be [verb-ed]"
        (r'\bshould be (\w+ed)\b', r'one should \1'),
        # "must be [verb-ed]"
        (r'\bmust be (\w+ed)\b', r'one must \1'),
        # "has been [verb-ed]"
        (r'\bhas been (\w+ed)\b', r'has \1'),
        # "have been [verb-ed]"
        (r'\bhave been (\w+ed)\b', r'have \1'),
        # "are [verb-ed]" (common AI passive)
        (r'\bThese are (\w+ed)\b', r'Researchers \1 these'),
        (r'\bThis is (\w+ed)\b', r'Analysis \1s this'),
        # New aggressive replacements
        (r'\b(is|are) transforming\b', r'pushes'),
        (r'\b(is|are) leveraging\b', r'draws on'),
        (r'\b(it|this) is expected to\b', r'\1 likely will'),
        (r'\bmust be addressed to ensure\b', r'we must address to guarantee'),
        (r'\bidentifying patterns\b', r'spotting trends'),
        (r'\bdrive innovation\b', r'spark new ideas'),
    ]

    result = text
    for pattern, replacement in replacements:
        if callable(replacement):
            result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
        else:
            result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)

    return result


# ══════════════════════════════════════════════════════════════════════════════
# SIGNAL 7: CONNECTOR PHRASE DEDUPLICATOR
# ══════════════════════════════════════════════════════════════════════════════

def deduplicate_connectors(text: str) -> str:
    """
    Detects repeated connector phrases (however, therefore, as a result...)
    and replaces subsequent occurrences with alternatives.
    """
    result = text
    for connector, alternates in CONNECTOR_ALTERNATES.items():
        # Build pattern for the connector
        pattern = r'\b' + re.escape(connector) + r'\b'
        matches = list(re.finditer(pattern, result, flags=re.IGNORECASE))
        if len(matches) <= 1:
            continue

        # Replace 2nd+ occurrences
        offset = 0
        for i, match in enumerate(matches[1:], 1):
            replacement = alternates[(i - 1) % len(alternates)]
            # Preserve original capitalisation
            original = result[match.start() + offset:match.end() + offset]
            if original[0].isupper():
                replacement = replacement[0].upper() + replacement[1:]
            result = result[:match.start() + offset] + replacement + result[match.end() + offset:]
            offset += len(replacement) - len(original)

    return result


# ══════════════════════════════════════════════════════════════════════════════
# SIGNAL 8: PUNCTUATION RICHNESS INJECTOR
# ══════════════════════════════════════════════════════════════════════════════

def increase_punctuation_richness(sentences: list) -> list:
    """
    Injects rich punctuation beyond basic em-dashes:
    - Parenthetical asides
    - Rhetorical questions (rare)
    - Trailing ellipses
    - Semicolons replacing commas
    """
    PARENTHETICALS = [
        "as one might expect", "curiously enough", "for all that",
        "and this matters", "worth pausing on", "if such a thing exists",
        "however briefly", "it bears noting", "on reflection",
    ]
    QUESTION_TAGS = [
        "But why would that be?", "And yet — does this hold universally?",
        "The question, of course, is why.", "Where does that leave us?",
        "Is this always the case?",
    ]

    result = []
    question_budget = max(1, len(sentences) // 8)
    questions_used = 0

    for i, s in enumerate(sentences):
        s = s.strip()
        if not s:
            result.append(s)
            continue

        words = s.split()
        roll = random.random()

        # Inject parenthetical aside
        if roll < 0.18 and len(words) > 10 and "(" not in s:
            aside = random.choice(PARENTHETICALS)
            # Insert after first clause (approx 40% through sentence)
            insert_at = max(3, len(words) // 3)
            words.insert(insert_at, f"({aside})")
            s = " ".join(words)

        # Convert a comma to semicolon occasionally
        elif roll < 0.30 and "," in s and ";" not in s:
            # Replace FIRST comma with semicolon only if sentence is long enough
            if len(words) > 12:
                s = s.replace(",", ";", 1)

        # Add rhetorical question after a sentence
        elif roll < 0.10 and questions_used < question_budget and i < len(sentences) - 1:
            s = s.rstrip(".!?") + ". " + random.choice(QUESTION_TAGS)
            questions_used += 1

        # Add trailing ellipsis emphasis
        elif roll < 0.08 and s.endswith(".") and len(words) > 8:
            s = s[:-1] + "..."

        # Replace comma with em-dash for drama
        elif roll < 0.22 and "," in s and "—" not in s and len(words) > 8:
            s = s.replace(",", " —", 1)

        result.append(s)

    return result


# ══════════════════════════════════════════════════════════════════════════════
# NEW: LINGUISTIC QUIRK INJECTOR (HUMANNESS ANCHOR)
# ══════════════════════════════════════════════════════════════════════════════

def inject_human_quirks(sentences: list) -> list:
    """
    Injects subtle human-like filler phrases and conversational anchors.
    This grounds the text in human-like unpredictability.
    """
    QUIRKS = [
        "the thing is,", "as it happens,", "strictly speaking,",
        "mind you,", "for what it's worth,", "more often than not,",
        "curiously as it sounds,", "the catch is,", "which leaves us with:",
    ]
    result = []
    injected_count = 0
    max_quirks = max(1, len(sentences) // 6)

    for s in sentences:
        if injected_count < max_quirks and len(s.split()) > 10 and random.random() < 0.15:
            quirk = random.choice(QUIRKS)
            s = f"{quirk[0].upper()}{quirk[1:]} {s[0].lower()}{s[1:]}"
            injected_count += 1
        result.append(s)
    return result


# ══════════════════════════════════════════════════════════════════════════════
# SIGNAL 2: BURSTINESS ENFORCER (FRACTAL CV > 0.75)
# ══════════════════════════════════════════════════════════════════════════════

def enforce_cv(sentences: list, target_cv: float = 0.75, max_attempts: int = 4) -> list:
    """
    Recursively merges short adjacent sentences and splits long ones
    until CV >= target_cv or max_attempts reached.
    Forces fractal burstiness pattern.
    """
    CONNECTORS = [" — ", "; ", ", and yet ", ", specifically ", ", which means ", " — meaning "]

    for _ in range(max_attempts):
        cv = _calculate_cv(sentences)
        if cv >= target_cv:
            break

        new_sentences = []
        i = 0
        while i < len(sentences):
            s = sentences[i].strip()
            words = s.split()
            avg_len = sum(len(sent.split()) for sent in sentences) / max(len(sentences), 1)

            if i + 1 < len(sentences) and abs(len(words) - avg_len) < 6 and random.random() < 0.65:
                # Merge two similar-length sentences → creates a LONG sentence
                next_s = sentences[i + 1].strip()
                connector = random.choice(CONNECTORS)
                s = s.rstrip(".!?") + connector + next_s[0].lower() + next_s[1:]
                i += 2
            elif len(words) > 18 and random.random() < 0.45:
                # Split a long sentence → creates a SHORT sentence
                mid = max(4, len(words) // 3)
                s1 = " ".join(words[:mid]) + "."
                s2 = words[mid][0].upper() + words[mid][1:] + " " + " ".join(words[mid + 1:]) if len(words) > mid + 1 else words[mid]
                new_sentences.append(s1)
                s = s2
                i += 1
            else:
                i += 1

            new_sentences.append(s)
        sentences = new_sentences

    return sentences


# ══════════════════════════════════════════════════════════════════════════════
# MAIN ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════════

def inject_pragmatic_markers(text: str, injection_rate: float = 0.40) -> str:
    """
    SENTIC Stage 2 — Linguistic Overdrive Engine v2.0

    Pipeline order (matters for interaction effects):
    1. Split into sentences
    2. Convert passive voice (Signal 5)
    3. Enforce CV burstiness (Signal 2)
    4. Enforce sentence-start diversity (Signal 3)
    5. Inject cosine disruption micro-pivots (Signal 4)
    6. Inject discourse markers + rich punctuation (Signals 1, 7, 8)
    7. Deduplicate connector phrases (Signal 7)
    8. Boost TTR via synonym rotation (Signal 6)

    Final telemetry: report all 5 metrics.
    """
    if not text.strip():
        return text

    # ── Step 0: Pre-clean ────────────────────────────────────────────────────
    text = re.sub(r'\s{2,}', ' ', text.strip())

    # ── Step 1: Convert passive voice ────────────────────────────────────────
    text = convert_passives(text)

    # ── Step 2: Split into sentences ─────────────────────────────────────────
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    if not sentences:
        return text

    # ── Step 3: Enforce CV > 0.75 ────────────────────────────────────────────
    sentences = enforce_cv(sentences, target_cv=0.75, max_attempts=4)

    # ── Step 4: Sentence-start diversity ─────────────────────────────────────
    sentences = enforce_sentence_start_diversity(sentences)

    # ── Step 5: Cosine disruption micro-pivots ───────────────────────────────
    sentences = inject_cosine_disruption(sentences, rate=injection_rate * 0.6)

    # ── Step 6: Discourse marker + punctuation injection ─────────────────────
    marker_cap = max(1, len(sentences) // 3)
    injected = 0
    processed = []

    local_pool = list(ALL_MARKERS)
    random.shuffle(local_pool)
    m_idx = 0

    sentences = increase_punctuation_richness(sentences)
    sentences = inject_human_quirks(sentences)

    for s in sentences:
        s = s.strip()

        if injected < marker_cap and _needs_marker(s) and random.random() < injection_rate:
            marker = local_pool[m_idx % len(local_pool)]
            s = marker + " " + s[0].lower() + s[1:]
            injected += 1
            m_idx += 1

        processed.append(s)

    # ── Step 7: Connector deduplication ──────────────────────────────────────
    final_text = " ".join(processed)
    final_text = deduplicate_connectors(final_text)

    # ── Step 8: TTR boost ────────────────────────────────────────────────────
    final_text = boost_ttr(final_text)

    # ── Telemetry ─────────────────────────────────────────────────────────────
    final_sentences = re.split(r'(?<=[.!?])\s+', final_text)
    cv_final = _calculate_cv(final_sentences)
    ttr_final = _calculate_ttr(final_text)
    start_div = _calculate_start_diversity(final_sentences)

    print(
        f"SENTIC Overdrive v2: "
        f"CV={cv_final:.2f} (target>0.75) | "
        f"TTR={ttr_final:.2f} (target>0.72) | "
        f"StartDiv={start_div:.2f} (target>0.75) | "
        f"Markers={injected} | "
        f"Sentences={len(final_sentences)}"
    )

    return final_text


# ── Legacy shim ────────────────────────────────────────────────────────────
def humanize_text_bert(text: str) -> str:
    return inject_pragmatic_markers(text)
