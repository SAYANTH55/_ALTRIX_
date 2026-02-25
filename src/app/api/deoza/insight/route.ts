import { NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

export async function POST(req: Request) {
    try {
        const { query } = await req.json();
        if (!query?.trim()) {
            return NextResponse.json({ error: "Query required" }, { status: 400 });
        }

        const prompt = `You are DEOZA, a research intelligence assistant. A user searched for: "${query}"

Generate a concise field intelligence briefing with these sections:
1. Field Overview (3-4 lines about this research domain)
2. Emerging Trends (3 bullet points)
3. Dominant Methodologies (2-3 bullet points)
4. Key Research Gaps (2-3 bullet points)

Keep it crisp, academic, and under 300 words total.`;

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.5,
                max_tokens: 600,
            }),
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Groq error: ${err}`);
        }

        const data = await res.json();
        const insight = data.choices[0]?.message?.content || "";

        return NextResponse.json({ insight });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
