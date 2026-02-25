import { NextResponse } from "next/server";

const apiKey = process.env.GROQ_API_KEY || "";

// ─── Banned AI-isms stripped before sending to Groq ─────────────────────────
const AI_ISMS = [
    "comprehensive", "foster", "delve", "tap into", "multifaceted",
    "underscores", "underscore", "testament", "realm", "pivotal",
    "intricate", "democratize", "game-changer", "unleash", "leverage",
    "holistic", "it is worth noting", "furthermore", "moreover",
    "in addition", "additionally", "it is important to note",
];

function stripAiIsms(text: string): string {
    let out = text;
    for (const word of AI_ISMS) {
        const re = new RegExp(`\\b${word.replace(/[-]/g, "[-]")}\\b`, "gi");
        out = out.replace(re, "");
    }
    return out.replace(/  +/g, " ").trim();
}

// ─── Entropy level → Groq sampling params ───────────────────────────────────
function entropyParams(formality: string): { temperature: number; top_p: number } {
    const map: Record<string, { temperature: number; top_p: number }> = {
        Low: { temperature: 0.75, top_p: 0.85 },
        Medium: { temperature: 0.88, top_p: 0.90 },
        High: { temperature: 0.95, top_p: 0.93 },
        Max: { temperature: 1.02, top_p: 0.97 },
    };
    return map[formality] ?? { temperature: 0.92, top_p: 0.90 };
}

// ─── Sentence-boundary chunker ──────────────────────────────────────────────
// Splits text into chunks of ~targetWords words, always breaking at sentence ends.
function chunkText(text: string, targetWords = 300): string[] {
    // Split into sentences
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

// ─── Master prompt — voice-preserving, no persona ───────────────────────────
const SYSTEM_PROMPT = `You are a professional editor specialising in Linguistic Entropy.
Rewrite the text to maximise Perplexity and Burstiness while keeping 100% semantic accuracy.
CRITICAL: Preserve the author's original writing voice, style, and register — do NOT impose a new persona.

DIRECTIVES — follow ALL:

1. BURSTINESS (most important)
   - Vary sentence length aggressively: SHORT fragment (3–6 words) → LONG multi-clause sentence (30–50 words) → MEDIUM (10–18 words).
   - Never write 3 sentences of similar length in a row.
   - Example: "Results were mixed. Three factors contributed — none anticipated — and each one, examined in isolation, tells only part of a story far more complicated than the numbers suggest. The data confirms this."

2. LATERAL VOCABULARY
   - Never do thesaurus swaps. Replace single words with phrases. "significant" → "it carries weight".
   - HARD BAN — rephrase any of: comprehensive, foster, delve, tap into, multifaceted, underscores, testament, realm, pivotal, intricate, democratize, game-changer, unleash, leverage, holistic.

3. HUMAN MICRO-TRANSITIONS
   - NEVER use: Furthermore, Moreover, In addition, Additionally, It is worth noting.
   - USE instead: "But here's the thing —", "That aside,", "The catch is,", "Oddly enough,", "In practice though,".

4. SYNTACTIC FRONT-LOADING
   - Do NOT start sentences with "The [Noun]...".
   - Begin sentences with: Prepositional phrases, Dependent clauses, Adverbs ("Frankly,"), or Gerunds.

5. PRESERVE TECHNICAL TERMS exactly. Only humanise connective tissue, not content.

6. PUNCTUATION — use em-dashes (—), parentheses, and semicolons throughout.

OUTPUT: Return ONLY the rewritten text. No preamble, no labels.`;

// ─── Groq call ───────────────────────────────────────────────────────────────
async function groqChat(
    messages: { role: string; content: string }[],
    temperature: number,
    top_p: number,
    frequency_penalty = 0.0
): Promise<string> {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages,
            temperature,
            top_p,
            frequency_penalty,
            max_tokens: 1536,
        }),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Groq ${res.status}: ${err}`);
    }
    const data = await res.json();
    return data.choices[0]?.message?.content?.trim() ?? "";
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
            const summary = await groqChat(
                [
                    { role: "system", content: "Summarise the text concisely and naturally. No bullet points. No preamble. Return ONLY the summary." },
                    { role: "user", content: `Summarise:\n\n${text}` },
                ],
                0.7, 0.9
            );
            return NextResponse.json({ humanizedText: summary, analysis: null });
        }

        // ── Humanise — single Groq pass + optional fast BERT stage ──────────
        const pipelineLog: string[] = [];
        const { temperature, top_p } = entropyParams(formality);
        const cleanedInput = stripAiIsms(text);

        // Stage 1: Linguistic Entropy rewrite — chunked for long texts
        const wordCount = cleanedInput.trim().split(/\s+/).length;
        const chunks = wordCount > 300 ? chunkText(cleanedInput, 300) : [cleanedInput];
        const rewrittenChunks: string[] = [];
        let stage1Ok = true;

        for (let i = 0; i < chunks.length; i++) {
            try {
                const chunkResult = await groqChat(
                    [
                        { role: "system", content: SYSTEM_PROMPT },
                        { role: "user", content: `Text:\n${chunks[i]}\n\nRewrite following ALL directives. Preserve the author's original voice. Return ONLY the rewritten text.` },
                    ],
                    temperature,
                    top_p,
                    0.35
                );
                rewrittenChunks.push(chunkResult);
            } catch (e: any) {
                console.error(`Chunk ${i + 1} failed:`, e.message);
                rewrittenChunks.push(chunks[i]); // fallback: keep original chunk
                stage1Ok = false;
            }
        }

        const stage1Text = rewrittenChunks.join(" ");
        pipelineLog.push(
            stage1Ok
                ? `Stage 1 (Entropy Rewrite): ✓ ${chunks.length > 1 ? `(${chunks.length} chunks)` : ""}`
                : "Stage 1: partial ✗ (some chunks fell back)"
        );

        // Stage 2: BERT pragmatic marker injection (3s timeout)
        let finalText = stage1Text;
        try {
            const bertController = new AbortController();
            const bertTimeout = setTimeout(() => bertController.abort(), 3000);
            const bertRes = await fetch("http://127.0.0.1:8000/inject-markers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: stage1Text }),
                signal: bertController.signal,
            });
            clearTimeout(bertTimeout);
            if (bertRes.ok) {
                const bertData = await bertRes.json();
                if (bertData.text) {
                    finalText = bertData.text;
                    pipelineLog.push("Stage 2 (BERT Markers): ✓");
                }
            } else {
                pipelineLog.push(`Stage 2 (BERT): skipped (${bertRes.status})`);
            }
        } catch {
            pipelineLog.push("Stage 2 (BERT): skipped (offline/timeout)");
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
                intentPreservation: "Semantic content preserved; structure and connectives rewritten.",
                toneAdjustments: "Original author voice preserved — no persona imposed.",
                stylisticChanges: "Syntactic front-loading, lateral vocabulary, punctuation shifts applied.",
                humanizationTechniques: pipelineLog.join(" | "),
            },
        });

    } catch (error: any) {
        console.error("Route error:", error);
        return NextResponse.json(
            { error: `Error: ${error.message}. (API Key: ${apiKey ? "Present" : "Missing"})` },
            { status: 500 }
        );
    }
}
