import { NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

export async function POST(req: Request) {
    try {
        const { title, abstract, messages } = await req.json();
        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: "Messages array required" }, { status: 400 });
        }

        const systemPrompt = `You are DEOZA, an advanced AI Research Assistant helping a user understand a specific academic paper.

Paper Context:
Title: ${title || "Unknown"}
Abstract: ${abstract || "Not provided"}

Rules:
- Always ground your answers in the paper context above
- Be clear, academic, and concise
- If the question goes beyond the abstract, say so and provide general insight
- Do NOT hallucinate citations or data not in the abstract`;

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
                    ...messages.map((m: any) => ({ role: m.role, content: m.content })),
                ],
                temperature: 0.6,
                max_tokens: 1024,
            }),
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Groq error: ${err}`);
        }

        const data = await res.json();
        const reply = data.choices[0]?.message?.content || "";

        return NextResponse.json({ reply });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
