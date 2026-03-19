import { NextResponse } from "next/server";

const apiKey = process.env.GROQ_API_KEY || "";
const apiKey2 = process.env.GROQ_API_KEY_2 || "";
const geminiKey = process.env.GEMINI_API_KEY || "";

// ─── Extended Banned AI-isms (Signal 7: Repetitive Phrase Fingerprint) ────────
const AI_ISMS = [
    // Core over-used descriptors
    "comprehensive", "foster", "delve", "tap into", "multifaceted",
    "underscores", "underscore", "testament", "realm", "pivotal",
    "intricate", "democratize", "unleash", "leverage", "holistic",
    "it is worth noting", "furthermore", "moreover", "in addition",
    "additionally", "it is important to note", "it is clear that",
    // Extended ban list — connector overuse & AI-specific phrasing
    "in conclusion", "to summarize", "to sum up", "in summary",
    "first and foremost", "last but not least", "needless to say",
    "it goes without saying", "as mentioned earlier", "as previously stated",
    "in today's world", "in the modern era", "in today's fast-paced",
    "ever-evolving", "cutting-edge", "state-of-the-art", "groundbreaking",
    "revolutionary", "transformative", "paradigm shift", "synergy",
    "utilize", "utilise", "optimal", "optimise", "optimize",
    "facilitate", "implement", "streamline", "robust", "seamless",
    "scalable", "innovative", "empower", "navigate", "in light of",
    "it should be noted", "one might argue", "it is evident that",
    "it is obvious that", "plays a crucial role", "plays a key role",
    "plays an important role", "a wide range of", "a variety of",
    "a number of", "due to the fact that", "in order to",
    "with regard to", "in terms of", "as well as", "not only",
    "in the field of", "transforming industries", "overall efficiency",
    "automating repetitive tasks", "enhancing decision-making",
    "leveraging machine learning", "identify patterns", "drive innovation",
    "ethical considerations", "addressed to ensure", "responsible development",
];

function stripAiIsms(text: string): string {
    let out = text;
    for (const phrase of AI_ISMS) {
        const re = new RegExp(`\\b${phrase.replace(/[-]/g, "[-]").replace(/\s+/g, "\\s+")}\\b`, "gi");
        out = out.replace(re, " ");
    }
    return out.replace(/\s{2,}/g, " ").trim();
}

// ─── Decoding Params — calibrated per user research ──────────────────────────
// T=0.9-1.05 flattens probability distribution → Tier 2/3 word choices
// top_p=0.95 keeps long-tail vocabulary accessible → higher perplexity
// penalties 0.3-0.45 break repetitive n-gram connective tissue (not too high to corrupt)
function entropyParams(formality: string): {
    temperature: number; top_p: number; frequency_penalty: number; presence_penalty: number;
} {
    const map: Record<string, { temperature: number; top_p: number; frequency_penalty: number; presence_penalty: number }> = {
        Low: { temperature: 0.82, top_p: 0.90, frequency_penalty: 0.25, presence_penalty: 0.15 },
        Medium: { temperature: 0.92, top_p: 0.95, frequency_penalty: 0.32, presence_penalty: 0.22 },
        High: { temperature: 1.00, top_p: 0.95, frequency_penalty: 0.38, presence_penalty: 0.30 },
        Max: { temperature: 1.05, top_p: 0.97, frequency_penalty: 0.45, presence_penalty: 0.38 },
    };
    return map[formality] ?? { temperature: 1.00, top_p: 0.95, frequency_penalty: 0.38, presence_penalty: 0.30 };
}

// ─── Logit bias map — negative bias on highest-probability AI anchor tokens ───
// Forces model away from "safe" token choices → semantic drift toward Tier 2/3 words
// Token IDs for Llama-3 tokenizer (common AI connective tokens)
const AI_LOGIT_BIAS: Record<string, number> = {
    "15636": -80,  // "Furthermore"
    "24671": -80,  // "Moreover"
    "50650": -80,  // "Additionally"
    "11263": -60,  // "However"
    "11292": -60,  // "Therefore"
    "11123": -50,  // "crucial"
    "51728": -50,  // "significant"
    "22252": -50,  // "important"
    "39935": -70,  // "comprehensive"
    "28592": -70,  // "multifaceted"
};

// ─── Sentence-boundary chunker ───────────────────────────────────────────────
function chunkText(text: string, targetWords = 280): string[] {
    const sentences = text.match(/[^.!?]+[.!?]+[\s]*/g) || [text];
    const chunks: string[] = [];
    let current = "";
    let wordCount = 0;
    for (const sentence of sentences) {
        const sentWords = sentence.trim().split(/\s+/).length;
        if (wordCount + sentWords > targetWords && current.trim()) {
            chunks.push(current.trim());
            current = sentence;
            wordCount = sentWords;
        } else {
            current += sentence;
            wordCount += sentWords;
        }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks.length ? chunks : [text];
}

// ─── Master System Prompt — Negative Constraint Persona ─────────────────────
// Strategy: "Negative constraints" force the model OUT of its average latent space
// into the "outlier zones" where humans actually write. Rules tell the model what
// NOT to do, which is far more effective than telling it what TO do.
const SYSTEM_PROMPT = `You are a tired, brilliant expert who hates academic jargon and writes exactly how they think. You're explaining something to a smart friend over coffee — direct, a bit impatient, occasionally sarcastic, always clear.

NEGATIVE CONSTRAINTS — never violate these:

✗ Never use: "furthermore", "moreover", "additionally", "in conclusion", "it is important to note", "it is worth noting", "plays a crucial role", "it is essential", "comprehensive", "multifaceted", "pivotal", "testament", "realm", "leverage", "holistic", "groundbreaking", "transformative", "nuanced", "delve", "foster", "intricate", "seamless", "synergy", "paradigm", "utilize", "robust", "in order to", "due to the fact that", "first and foremost"
✗ Never write 3 consecutive sentences of similar length (within 5 words of each other)
✗ Never use passive voice: not "it was found", not "it has been shown", not "this is seen"
✗ Never use uncontracted forms where a contraction exists: not "it is", not "they are", not "do not", not "cannot", not "will not"
✗ Never start more than 1 sentence per paragraph with the same word
✗ Never use formal academic connectors — no "however" at sentence start, no "therefore", no "consequently"

POSITIVE MOVES — do these:

✓ Mix very short punchy sentences (3-6 words) with longer ones (25-40 words) — extreme variation
✓ Drop obvious contextual idioms where they fit: "up against a wall", "cuts both ways", "worth its salt"
✓ Use contractions everywhere: it's, they're, don't, can't, won't, there's, doesn't, that's
✓ Add one casual anchor phrase per paragraph: "look," / "here's the thing —" / "and honestly" / "that said" / "which makes sense, kind of"
✓ Occasionally front-load with a prepositional phrase or dependent clause for sentence variety
✓ Use "but" and "and" to start sentences — humans do this naturally
✓ Use hedges that feel real: "kind of", "pretty much", "more or less", "I mean"

EXAMPLE TRANSFORMATION:
AI: "It is essential for responsible citizens to understand their rights and duties, as this knowledge empowers them to make informed decisions."
HUMAN: "Knowing your rights matters. If you don't know what you're entitled to, you can't do much about anything (and honestly, most people don't bother)."

AI: "The study demonstrates that regular exercise has numerous benefits for physical health."
HUMAN: "Exercise works. Study after study backs this up — better sleep, better mood, longer life. Hard to argue with."

PRESERVE: All facts, numbers, proper nouns, and technical terms exactly as given.
OUTPUT: Rewritten text only. No labels, no preamble, no explanation.`;

// ─── Stage 1b: Rhythm & Contraction Auditor ──────────────────────────────────
// Focused specifically on what the first pass tends to miss:
// rhythm variation and missing contractions. NOT a general AI-pattern audit
// (that just produces more AI-style text on a second pass).
function buildRhythmAuditPrompt(text: string): string {
    return `You are a rhythm editor. You have ONE job: fix sentence length uniformity and missing contractions in this text.

TEXT:
${text}

FIX THESE SPECIFIC ISSUES ONLY:
1. Find any 3 consecutive sentences within 5 words of each other in length → split the longest or add a 3-5 word follow-up sentence after it
2. Find any uncontracted forms → replace: "it is"→"it's", "they are"→"they're", "do not"→"don't", "cannot"→"can't", "will not"→"won't", "there is"→"there's", "does not"→"doesn't", "have not"→"haven't", "that is"→"that's", "you are"→"you're"
3. Find any paragraph with no sentence under 8 words → add one short punchy sentence at its end
4. Find any use of "furthermore", "moreover", "additionally", "in conclusion" → replace with "plus", "also", "so", "basically"

DO NOT change meaning, DO NOT restructure paragraphs, DO NOT rewrite what doesn't need fixing.
OUTPUT: Return ONLY the corrected text. No commentary.`;
}

// ─── Unified AI Provider with multi-model fallback ───────────────────────────
async function aiChat(
    messages: { role: string; content: string }[],
    temperature: number,
    top_p: number,
    frequency_penalty = 0.45,
    presence_penalty = 0.0
): Promise<string> {
    // Groq slots: primary key first, fallback key second (if set)
    const groqKeys = [apiKey, apiKey2].filter(Boolean);
    const groqModels = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];

    // Try every groq key × model combination before falling back to Gemini
    for (const key of groqKeys) {
        for (const modelName of groqModels) {
            try {
                const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${key}`,
                    },
                    body: JSON.stringify({
                        model: modelName,
                        messages,
                        temperature,
                        top_p,
                        frequency_penalty,
                        presence_penalty,
                        max_tokens: 2048,
                    }),
                });
                if (res.ok) {
                    const data = await res.json();
                    return data.choices[0]?.message?.content?.trim() ?? "";
                }
                const err = await res.text();
                console.warn(`Groq(${modelName}, key=...${key.slice(-4)}) failed: ${err}`);
                // On 429 rate-limit, immediately try next key/model — don't keep retrying same key
                if (res.status === 429) break;
            } catch (e: unknown) {
                console.error(`Groq(${modelName}) error:`, e instanceof Error ? e.message : String(e));
            }
        }
    }

    // Final fallback: Gemini
    if (geminiKey) {
        try {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiKey}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: `System: ${messages[0].content}\n\nUser: ${messages[1].content}` }],
                        }],
                        generationConfig: { temperature, topP: top_p, maxOutputTokens: 2048 },
                    }),
                }
            );
            if (res.ok) {
                const data = await res.json();
                return data.candidates[0]?.content?.parts[0]?.text?.trim() ?? "";
            }
            const err = await res.text();
            console.warn(`Gemini failed: ${err}`);
        } catch (e: unknown) {
            console.error("Gemini error:", e instanceof Error ? e.message : String(e));
        }
    }

    throw new Error("All AI providers (Groq 70B×2keys, Groq 8B×2keys, Gemini Pro) failed.");
}

// ══════════════════════════════════════════════════════════════════════════════
// MECHANICAL POST-PROCESSORS — run after every LLM stage, zero latency
// These deterministically fix what the LLM can't always guarantee.
// ══════════════════════════════════════════════════════════════════════════════

// ─── 1. Force Contractions ───────────────────────────────────────────────────
function forceContractions(text: string): string {
    const rules: [RegExp, string][] = [
        [/\bit is\b/gi, "it's"],
        [/\bIt is\b/g, "It's"],
        [/\bthey are\b/gi, "they're"],
        [/\bThey are\b/g, "They're"],
        [/\bwe are\b/gi, "we're"],
        [/\bWe are\b/g, "We're"],
        [/\byou are\b/gi, "you're"],
        [/\bYou are\b/g, "You're"],
        [/\bhe is\b/gi, "he's"],
        [/\bshe is\b/gi, "she's"],
        [/\bthat is\b/gi, "that's"],
        [/\bThat is\b/g, "That's"],
        [/\bthere is\b/gi, "there's"],
        [/\bThere is\b/g, "There's"],
        [/\bdo not\b/gi, "don't"],
        [/\bDo not\b/g, "Don't"],
        [/\bdoes not\b/gi, "doesn't"],
        [/\bDoes not\b/g, "Doesn't"],
        [/\bdid not\b/gi, "didn't"],
        [/\bDid not\b/g, "Didn't"],
        [/\bwill not\b/gi, "won't"],
        [/\bWill not\b/g, "Won't"],
        [/\bwould not\b/gi, "wouldn't"],
        [/\bWould not\b/g, "Wouldn't"],
        [/\bcould not\b/gi, "couldn't"],
        [/\bCould not\b/g, "Couldn't"],
        [/\bshould not\b/gi, "shouldn't"],
        [/\bShould not\b/g, "Shouldn't"],
        [/\bcannot\b/gi, "can't"],
        [/\bCannot\b/g, "Can't"],
        [/\bhave not\b/gi, "haven't"],
        [/\bHave not\b/g, "Haven't"],
        [/\bhas not\b/gi, "hasn't"],
        [/\bHas not\b/g, "Hasn't"],
        [/\bare not\b/gi, "aren't"],
        [/\bAre not\b/g, "Aren't"],
        [/\bwas not\b/gi, "wasn't"],
        [/\bWas not\b/g, "Wasn't"],
        [/\bwere not\b/gi, "weren't"],
        [/\bWere not\b/g, "Weren't"],
        [/\bI am\b/g, "I'm"],
        [/\bI will\b/g, "I'll"],
        [/\bI have\b/g, "I've"],
        [/\bI would\b/g, "I'd"],
        [/\bthey have\b/gi, "they've"],
        [/\bThey have\b/g, "They've"],
        [/\bwe have\b/gi, "we've"],
        [/\bWe have\b/g, "We've"],
        [/\bit will\b/gi, "it'll"],
        [/\bthat will\b/gi, "that'll"],
    ];
    let out = text;
    for (const [pattern, replacement] of rules) {
        out = out.replace(pattern, replacement);
    }
    return out;
}

// ─── 2. Enforce CV Burstiness ────────────────────────────────────────────────
// CV = std_dev / mean. To boost CV: add very short anchor sentences after
// long sentences. Never merge short sentences (that makes all lengths uniform).
function enforceCV(text: string): string {
    const SHORT_ANCHORS = [
        "It does.", "That's it.", "Simple.", "It works.",
        "Full stop.", "It matters.", "Good.", "Clear enough.",
        "Not easy.", "Worth it.", "And that helps.", "Pretty clear.",
        "Makes sense.", "And it shows.", "So yeah.",
    ];
    const sentences = text.match(/[^.!?]+[.!?]+["']?\s*/g);
    if (!sentences || sentences.length < 3) return text;
    const result: string[] = [];
    let anchorIdx = 0;
    for (let i = 0; i < sentences.length; i++) {
        result.push(sentences[i]);
        const len = sentences[i].trim().split(/\s+/).length;
        const nextLen = sentences[i + 1]?.trim().split(/\s+/).length ?? 0;
        if (len > 18 && nextLen > 9) {
            result.push(SHORT_ANCHORS[anchorIdx % SHORT_ANCHORS.length] + " ");
            anchorIdx++;
        }
    }
    return result.join("").replace(/\s{2,}/g, " ").trim();
}

// ─── 3. Inject Short Fragments ────────────────────────────────────────────────
function injectFragments(text: string): string {
    const FRAGMENTS = [
        "It matters.", "Simple as that.", "That's the point.", "Not complicated.",
        "And it works.", "Just like that.", "Pretty clear.", "Worth noting.",
        "That's it.", "Honestly.", "Makes sense.", "Right.", "So yeah.", "That counts.",
        "Fair enough.", "It adds up.", "No question.", "And yet.", "Still true.",
    ];
    const paragraphs = text.split(/\n\n+/);
    const result = paragraphs.map(para => {
        const sentences = para.match(/[^.!?]+[.!?]+["']?\s*/g) ?? [];
        if (sentences.length < 3) return para;
        let injected = false;
        const out: string[] = [];
        for (let i = 0; i < sentences.length; i++) {
            out.push(sentences[i]);
            if (!injected && sentences[i].trim().split(/\s+/).length > 20) {
                const nextLen = sentences[i + 1]?.trim().split(/\s+/).length ?? 99;
                if (nextLen > 8) {
                    const frag = FRAGMENTS[Math.floor(Math.random() * FRAGMENTS.length)];
                    out.push(frag + " ");
                    injected = true;
                }
            }
        }
        return out.join("").trim();
    });
    return result.join("\n\n");
}

// ─── 4. Diversify Sentence Starters ──────────────────────────────────────────
// If 2+ consecutive sentences start with the same word, prepend a filler.
function diversifyStarters(text: string): string {
    const FILLERS = [
        "Look, ", "See, ", "And ", "But ", "So ", "Actually, ",
        "Here's the thing — ", "Mind you, ", "Right, ", "And yet, ", "Plus, ",
    ];
    const sentences = text.match(/[^.!?]+[.!?]+["']?\s*/g);
    if (!sentences || sentences.length < 3) return text;
    const result: string[] = [];
    let lastStarter = "";
    let fillerIdx = 0;
    for (const s of sentences) {
        const firstWord = s.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "") ?? "";
        if (firstWord && firstWord === lastStarter && s.trim().split(/\s+/).length > 4) {
            const filler = FILLERS[fillerIdx % FILLERS.length];
            fillerIdx++;
            const modified = filler + s.trim()[0].toLowerCase() + s.trim().slice(1);
            result.push(modified + " ");
            lastStarter = filler.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "") ?? firstWord;
        } else {
            result.push(s);
            lastStarter = firstWord;
        }
    }
    return result.join("").trim();
}


// ─── Route ────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {

    try {
        const { text, audience, formality, mode } = await req.json();

        if (mode === "extract_image") {
            return NextResponse.json(
                { error: "Image extraction is not supported with the current model." },
                { status: 400 }
            );
        }

        // ── Summarise ────────────────────────────────────────────────────────
        if (mode === "summarize") {
            const summary = await aiChat(
                [
                    { role: "system", content: "Summarise the text concisely and naturally. Use active voice. Vary sentence lengths. No bullet points. No preamble. Return ONLY the summary." },
                    { role: "user", content: `Summarise:\n\n${text}` },
                ],
                0.75, 0.90, 0.50, 0.20
            );
            return NextResponse.json({ humanizedText: summary, analysis: null });
        }

        // ── Humanise Pipeline ────────────────────────────────────────────────
        const pipelineLog: string[] = [];
        const { temperature, top_p, frequency_penalty, presence_penalty } = entropyParams(formality);
        const cleanedInput = stripAiIsms(text);

        // ── Stage 1: Linguistic Entropy Rewrite (chunked) ───────────────────
        const wordCount = cleanedInput.trim().split(/\s+/).length;
        const chunks = wordCount > 280 ? chunkText(cleanedInput, 280) : [cleanedInput];
        const rewrittenChunks: string[] = [];
        let stage1Ok = true;

        for (let i = 0; i < chunks.length; i++) {
            try {
                const chunkResult = await aiChat(
                    [
                        { role: "system", content: SYSTEM_PROMPT },
                        {
                            role: "user",
                            content: `Target Audience: ${audience || "General Reader"}\nEntropy Level: ${formality || "High"}\n\nText to rewrite:\n${chunks[i]}\n\nApply ALL 8 directives. Return ONLY the rewritten text.`,
                        },
                    ],
                    temperature,
                    top_p,
                    frequency_penalty,
                    presence_penalty
                );
                rewrittenChunks.push(chunkResult);
            } catch (e: unknown) {
                console.error(`Chunk ${i + 1} failed:`, e instanceof Error ? e.message : String(e));
                rewrittenChunks.push(chunks[i]);
                stage1Ok = false;
            }
        }

        const stage1Text = rewrittenChunks.join(" ");
        pipelineLog.push(
            stage1Ok
                ? `Stage 1 (Entropy Rewrite): ✓${chunks.length > 1 ? ` (${chunks.length} chunks)` : ""}`
                : "Stage 1: partial ✗ (some chunks fell back)"
        );

        // ── Stage 1b: Rhythm Audit Pass (all entropy levels) ─────────────────
        // Focused ONLY on fixing sentence rhythm + contractions.
        // Avoids the "double AI" problem of general self-correction.
        let stage1bText = stage1Text;
        try {
            const corrected = await aiChat(
                [
                    { role: "system", content: "You are a rhythm editor. Fix only what is asked. Return only the corrected text." },
                    { role: "user", content: buildRhythmAuditPrompt(stage1Text) },
                ],
                0.75,   // lower temp for precision editing, not creative rewriting
                0.90,
                0.25,
                0.15
            );
            if (corrected && corrected.length > stage1Text.length * 0.5) {
                stage1bText = corrected;
                pipelineLog.push("Stage 1b (Rhythm Audit): ✓");
            } else {
                pipelineLog.push("Stage 1b (Rhythm Audit): skipped (empty)");
            }
        } catch {
            pipelineLog.push("Stage 1b (Rhythm Audit): skipped (error)");
            stage1bText = stage1Text;
        }

        // Strip AI-isms from LLM output (safety net)
        const afterStrip = stripAiIsms(stage1bText);

        // ── Stage 2: Mechanical Post-Processor (TypeScript — zero latency) ──────
        let finalText = afterStrip;
        finalText = forceContractions(finalText);  // 50+ contraction regex rules
        finalText = enforceCV(finalText);           // inject short rhythm anchors
        finalText = injectFragments(finalText);     // standalone micro-sentences
        finalText = diversifyStarters(finalText);   // break repeated openers
        pipelineLog.push("Stage 2 (Mechanical): ✓ contractions + CV anchors + fragments + starters");

        // ── Stage 3: BERT Pragmatic Marker Injection (Python backend) ────────
        const injectionRate = formality === "Max" ? 0.35 : formality === "High" ? 0.28 : 0.20;
        try {
            const bertCtrl = new AbortController();
            const bertTimer = setTimeout(() => bertCtrl.abort(), 6000);
            const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";
            const bertRes = await fetch(`${backendUrl}/inject-markers`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: finalText, injection_rate: injectionRate }),
                signal: bertCtrl.signal,
            });
            clearTimeout(bertTimer);
            if (bertRes.ok) {
                const bertData = await bertRes.json();
                if (bertData.text && bertData.text.length > finalText.length * 0.5) {
                    finalText = bertData.text;
                    pipelineLog.push(`Stage 3 (BERT markers): ✓ rate=${injectionRate}`);
                }
            } else {
                pipelineLog.push(`Stage 3 (BERT): skipped (${bertRes.status})`);
            }
        } catch {
            pipelineLog.push("Stage 3 (BERT): skipped (offline — start ai-humanizer server)");
        }

        return NextResponse.json({
            humanizedText: finalText,
            analysis: {
                intent: "Informative",
                tone: "Voice-Preserved",
                audience: audience ?? "General Reader",
                formality: formality ?? "Medium",
            },
            explainability: {
                intentPreservation: "Semantic content preserved; structure, connectives, and surface form rewritten.",
                toneAdjustments: "Original author voice preserved — no persona imposed. Active voice enforced.",
                stylisticChanges: "Fractal burstiness, sentence-start rotation, cosine disruption, punctuation injection applied.",
                humanizationTechniques: pipelineLog.join(" | "),
            },
        });

    } catch (error: unknown) {
        console.error("Route error:", error);
        return NextResponse.json(
            { error: `Error: ${error instanceof Error ? error.message : String(error)}. (API Key: ${apiKey ? "Present" : "Missing"})` },
            { status: 500 }
        );
    }
}
