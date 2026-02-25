import { NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

export async function POST(req: Request) {
    try {
        const { title, abstract } = await req.json();
        if (!abstract) {
            return NextResponse.json({ error: "Abstract is required" }, { status: 400 });
        }

        const systemPrompt = `You are DEOZA, an advanced AI Research Assistant.
You help users understand academic research papers.
You must:
- Provide accurate structured summaries
- Avoid hallucinating citations
- Base analysis only on provided abstract/content
- Extract methodology and key contributions
- Identify research gaps
- Explain complex ideas clearly
- Maintain academic tone`;

        const userPrompt = `Analyze the following research paper:

Title: ${title || "Unknown"}
Abstract: ${abstract}

Provide a structured analysis with these exact sections:
1. Short Summary (5-7 lines)
2. Core Contribution
3. Methodology Used
4. Strengths
5. Limitations
6. Possible Research Gaps
7. Suggested Future Work

Format each section clearly with the number and heading.`;

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
                temperature: 0.4,
            }),
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Groq error: ${err}`);
        }

        const data = await res.json();
        const analysis = data.choices[0]?.message?.content || "";

        return NextResponse.json({ analysis });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
