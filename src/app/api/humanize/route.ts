import { NextResponse } from "next/server";


const apiKey = process.env.GROQ_API_KEY || "";

export async function POST(req: Request) {
    try {
        const { text, tone, audience, formality, mode, imageData, mimeType } = await req.json();

        let messages = [];
        let temperature = 0.7;

        if (mode === "extract_image") {
            return NextResponse.json(
                { error: "Image extraction is not supported with the current model (llama-3.3-70b-versatile)." },
                { status: 400 }
            );
        }

        if (mode === "summarize") {
            // Keep summarization on Groq for now as BERT is for rewriting
            messages = [
                {
                    role: "system",
                    content: "You are a helpfull assistant that summarizes text concisely and naturally."
                },
                {
                    role: "user",
                    content: `Summarize the following text:\n\n"${text}"\n\nReturn ONLY the summary.`
                }
            ];

            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: messages,
                    temperature: temperature
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Groq API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            const resultText = data.choices[0]?.message?.content || "";

            return NextResponse.json({
                humanizedText: resultText,
                analysis: null
            });
        }
        else {
            // HYBRID PIPELINE: Stage 1 (Groq/Llama-3) -> Stage 2 (Local BERT)

            // Stage 1: Structural Rewrite with Llama-3 (Advanced Syntactic Refinement)
            messages = [
                {
                    role: "system",
                    content: `You are an expert Academic Editor using advanced Syntactic Restructuring algorithms. Apply the following 4 refinement mechanisms:

1.  **Syntactic Restructuring:**
    -   **Goal:** Maximize fluency and logical flow.
    -   **Action:** Convert run-on sentences into coordinated clauses. Move misplaced modifiers for clarity.
    -   **Example:** "Because the sample was limited, conclusions are tentative" -> "Given the sample heterogeneity, conclusions remain tentative; validation requires further study."

2.  **Standardizing Grammatical Agreement:**
    -   **Goal:** Perfect Morphological alignment.
    -   **Action:** Ensure strict Subject-Verb and Noun-Pronoun agreement (e.g., "The range of values *was* large," not "were").
    -   **Constraint:** Resolve ambiguous pronouns (e.g., replace "it" with "the instrument" where unclear).

3.  **Punctuation for Logical Flow:**
    -   **Goal:** explicit logical relations.
    -   **Action:** Use **semicolons** to link related independent clauses. Use **colons** to introduce explanations or lists.
    -   **Action:** Use commas to strictly set off nonrestrictive clauses (appositives).

4.  **Tone Edits & Filler Removal:**
    -   **Goal:** Objective Academic Voice.
    -   **Action:** DELETE all discourse markers ("you know", "well", "so").
    -   **Action:** REMOVE hedges ("I think", "It seems"). Replace with assertions ("The results indicate").
    -   **Action:** Convert First-Person ("We measured") to **Passive/Impersonal** ("Measurements showed").

**Output Requirement:** The text must be syntactically flawless, logically punctuated, and strictly academic.`
                },
                {
                    role: "user",
                    content: `Text:\n"${text}"\n\nRewrite this text following the rules above. Do NOT simply paraphrase. Reconstruct the expression.`
                }
            ];

            let stage1Text = "";
            let pipelineLog = [];

            try {
                const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: "llama-3.3-70b-versatile",
                        messages: messages,
                        temperature: temperature
                    })
                });

                if (!groqResponse.ok) {
                    const errorText = await groqResponse.text();
                    throw new Error(`Groq API Error: ${groqResponse.status} - ${errorText}`);
                }

                const groqData = await groqResponse.json();
                stage1Text = groqData.choices[0]?.message?.content || "";
                pipelineLog.push("Stage 1 (Groq Llama-3): Success");
            } catch (groqError: any) {
                console.error("Stage 1 Failed (Network/API Error):", groqError);
                // RESILIENCE FALLBACK:
                // If Groq is blocked (common in corporate/school networks), 
                // we skip Stage 1 and pass the RAW text to Stage 2 (BERT).
                pipelineLog.push(`Stage 1 (Groq): Skipped (Network Error)`);
                stage1Text = text; // Fallback to original text
            }

            // Stage 2: Statistical Humanization with Local BERT
            let finalText = stage1Text;
            try {
                const bertResponse = await fetch("http://127.0.0.1:8000/humanize", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: stage1Text })
                });

                if (bertResponse.ok) {
                    const bertData = await bertResponse.json();
                    if (bertData.humanized_text) {
                        finalText = bertData.humanized_text;
                        pipelineLog.push("Stage 2 (Local BERT): Success");
                    }
                } else {
                    console.warn(`Local Backend returned ${bertResponse.status}. Skipping Stage 2.`);
                    pipelineLog.push(`Stage 2 (Local BERT): Skipped (${bertResponse.status})`);
                }
            } catch (bertError) {
                console.warn("Local Backend not reachable. Skipping Stage 2.", bertError);
                pipelineLog.push("Stage 2 (Local BERT): Failed (Backend Offline)");
                // Fallback: Keep stage1Text
            }

            return NextResponse.json({
                humanizedText: finalText,
                analysis: {
                    intent: "Informative",
                    tone: tone || "Neutral",
                    audience: audience || "General Reader",
                    formality: formality || "Medium"
                },
                explainability: {
                    intentPreservation: "Original meaning preserved",
                    toneAdjustments: "Tone - Llama 3",
                    stylisticChanges: "Perplexity Reduction - BERT",
                    humanizationTechniques: pipelineLog.join(" | ")
                }
            });
        }

    } catch (error: any) {
        console.error("Groq API error:", error);
        return NextResponse.json(
            { error: `Groq Error: ${error.message}. (Key: ${apiKey ? 'Present' : 'Missing'})` },
            { status: 500 }
        );
    }
}
