import { NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

async function groqGenerate(model: string, messages: any[]) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model,
            messages,
            temperature: 0.1,
            max_tokens: 2048,
        }),
    });
    return res;
}

export async function POST(req: Request) {
    try {
        const { text, type, direction, complexity } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "No description provided." }, { status: 400 });
        }

        const systemPrompt = `You are SAYON, a Visual Intelligence Engine.
Convert the user text into a professional Mermaid diagram.

EXTREMELY CRITICAL RULES:
1. NO conversational filler. NO "Here is your diagram". Return ONLY the Mermaid code.
2. NO illegal arrow types like "|>", "-->|", or "->>|". Use standard --> or ->> only.
3. EVERY node label MUST be enclosed in double quotes: A["Label Text"].
4. NO special characters inside labels unless escaped.
5. If Mode is "Flowchart": use 'graph ${direction || 'TD'}'.
6. If Mode is "Mind Map": use 'mindmap'.
7. If Mode is "System Diagram": use 'sequenceDiagram'.
8. NEVER use bare node IDs with spaces. Node IDs must be a single word or use underscores: Payment_Success not "Payment Success". WRONG: A --> Payment Success --> B. RIGHT: A -->|Payment Success| B (edge label) or A --> Payment_Success["Payment Success"] --> B.
9. NEVER use | between two nodes on one line for branching. WRONG: A --> B["X"]|C["Y"]. RIGHT: write A --> B["X"] and A --> C["Y"] on separate lines.
10. NEVER use parentheses () inside node labels. WRONG: A["Status (Active)". RIGHT: A["Status Active/Closed"].

Current Requested Mode: ${type || 'Flowchart'}`;

        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Generate a ${type || 'Flowchart'} for: ${text}` },
        ];

        let res = await groqGenerate("llama-3.3-70b-versatile", messages);

        // Fallback to 8b if rate limited or generic error
        if (!res.ok) {
            const errText = await res.text();
            console.warn("Primary 70B model failed, attempting fallback to 8B...", errText);
            res = await groqGenerate("llama-3.1-8b-instant", messages);
            if (!res.ok) {
                const finalErr = await res.text();
                throw new Error(`Groq service unavailable: ${finalErr}`);
            }
        }

        const data = await res.json();
        let content = data.choices[0]?.message?.content || "";

        // Backend Sanitization & Extraction Pass
        // Regex to find the Actual Mermaid Block (case-insensitive for the header)
        const mermaidMatch = content.match(/(graph|mindmap|sequenceDiagram|stateDiagram|classDiagram|erDiagram|gantt|pie|journey)[\s\S]+/i);

        if (mermaidMatch) {
            content = mermaidMatch[0];
        }

        content = content
            .replace(/```mermaid/gi, "")
            .replace(/```/g, "")
            .replace(/\|>\s?/g, "--> ")
            // Only strip bare -->| or ->>| when NOT part of a valid -->|text| edge label
            .replace(/-->\|(?![^|\n]*\|)/g, "--> ")
            .replace(/->>\\?\|(?![^|\n]*\|)/g, "->> ")
            .trim();

        // Fix 1: bare node IDs with spaces as intermediate hops
        // Pattern: A --> Payment Success --> B  (no quotes, spaces in node ID)
        // Safe: A --> Node["Label with spaces"] --> B  (quoted = leave alone)
        // Approach: line-by-line, split on --> tokens, check middle for spaces+no brackets
        content = content.split("\n").map((line: string) => {
            const trimmed = line.trim();
            // Only process flowchart arrow lines
            if (!trimmed.includes("-->")) return line;
            // Split on --> keeping order
            const parts = trimmed.split(/\s*-->\s*/);
            if (parts.length !== 3) return line; // only handle A --> B --> C triples
            const [src, middle, dst] = parts;
            // Middle must have a space, no brackets/quotes (i.e., bare multi-word ID)
            if (middle.includes(" ") && !middle.includes("[") && !middle.includes('"') && !middle.includes("|")) {
                const indent = line.match(/^([ \t]*)/)?.[1] ?? "";
                return `${indent}${src} -->|${middle.trim()}| ${dst.trim()}`;
            }
            return line;
        }).join("\n");

        // Fix 2: invalid pipe-between-nodes: A --> B["X"]|C["Y"]
        // Split into two separate arrow lines from same source
        content = content.replace(
            /^([ \t]*)(\S+)([ \t]*-{2,}>[ \t]*)([^\n|]+)\|([^\n]+)$/gm,
            (_match: string, indent: string, src: string, arrow: string, nodeA: string, nodeB: string) =>
                `${indent}${src}${arrow}${nodeA.trim()}\n${indent}${src}${arrow}${nodeB.trim()}`
        );

        // Fix 3: strip parentheses from node label text (breaks Mermaid parser)
        content = content.replace(/\["([^"]*)\(([^)]*)\)([^"]*)"\]/g, (_m: string, pre: string, mid: string, post: string) =>
            `["${pre}${mid}${post}"]`
        );

        // Final check: fix header if extraction missed it but content looks like lines
        const expectedHeader = type === "Mind Map" ? "mindmap" :
            type === "System Diagram" ? "sequenceDiagram" :
                `graph ${direction || 'TD'}`;

        if (!content.toLowerCase().startsWith(expectedHeader.split(' ')[0].toLowerCase())) {
            content = `${expectedHeader}\n${content}`;
        }

        return NextResponse.json({ syntax: content });
    } catch (err: any) {
        console.error("SAYON Visualization Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
