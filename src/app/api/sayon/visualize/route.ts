import { NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

export async function POST(req: Request) {
    try {
        const { text, type, direction, complexity } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "No description provided." }, { status: 400 });
        }

        const systemPrompt = `You are SAYON, a Visual Intelligence Engine part of the ALTRIX ecosystem.
Your task is to convert research text, ideas, or prompts into professional diagrams using Mermaid syntax.

DIAGRAM TYPES & SYNTAX:
1. Flowchart: 
   - Start with 'graph ${direction || 'TD'}'
   - USE DOUBLE QUOTES for all node labels: A["Start"] --> B["Process (Action)"]
2. Mind Map:
   - Start with 'mindmap'
   - Use indentation for structure
   - Example:
     mindmap
       root((Main Idea))
         Node1["Sub Topic 1"]
           Node1a["Detail 1"]
3. System Diagram:
   - Use 'sequenceDiagram'
   - Example:
     sequenceDiagram
       participant A as "User"
       participant B as "System"
       A->>B: "Request"
       B-->>A: "Response"
4. Research Map:
   - Use 'graph TD' with subgraphs for clustering.

STRICT RULES:
- Output ONLY valid Mermaid syntax.
- DO NOT use markdown fences (\`\`\`mermaid).
- DO NOT provide explanations.
- CRITICAL: Always use double quotes for labels containing spaces, parentheses, or special characters.
- Maintain structural clarity and professional tone.
- Direction: ${direction || 'TD'}
- Complexity: ${complexity || 'Standard'}
- Diagram Type Requested: ${type || 'Flowchart'}

Example Output:
graph TD
    A["Start Project"] --> B{"Is Ready?"}
    B -- "Yes" --> C["Execute (Beta)"]
    B -- "No" --> D["Wait"]`;

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
                    { role: "user", content: `Visualize this: ${text}` },
                ],
                temperature: 0.2,
                max_tokens: 2048,
            }),
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Groq error: ${err}`);
        }

        const data = await res.json();
        let content = data.choices[0]?.message?.content || "";

        // Strip markdown fences if AI included them despite instructions
        content = content.replace(/```mermaid/g, "").replace(/```/g, "").trim();

        return NextResponse.json({ syntax: content });
    } catch (err: any) {
        console.error("SAYON Visualization Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
