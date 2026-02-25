import { NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

const LATEX_TEMPLATES: Record<string, string> = {
    IEEE: `\\documentclass[conference]{IEEEtran}
\\usepackage{cite}
\\usepackage{amsmath,amssymb,amsfonts}
\\usepackage{algorithmic}
\\usepackage{graphicx}
\\usepackage{textcomp}
\\usepackage{xcolor}
\\begin{document}
\\title{ {{TITLE}} }
\\author{\\IEEEauthorblockN{Author Name}
\\IEEEauthorblockA{Department \\\\ University \\\\ City, Country \\\\ Email} }
\\maketitle
\\begin{abstract}
{{ABSTRACT}}
\\end{abstract}
{{BODY}}
\\end{document}`,
    ACM: `\\documentclass[sigconf]{acmart}
\\begin{document}
\\title{ {{TITLE}} }
\\begin{abstract}
{{ABSTRACT}}
\\end{abstract}
\\maketitle
{{BODY}}
\\end{document}`,
    APA: `\\documentclass[manuscript, screen, noextraspace]{apa7}
\\title{ {{TITLE}} }
\\shorttitle{ {{SHORTTITLE}} }
\\begin{document}
\\maketitle
\\begin{abstract}
{{ABSTRACT}}
\\end{abstract}
{{BODY}}
\\end{document}`,
    Springer: `\\documentclass[runningheads]{llncs}
\\begin{document}
\\title{ {{TITLE}} }
\\author{Author Name}
\\institute{University Name}
\\maketitle
\\begin{abstract}
{{ABSTRACT}}
\\end{abstract}
{{BODY}}
\\end{document}`,
};

export async function POST(req: Request) {
    try {
        const { text, format, options } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "No document content provided." }, { status: 400 });
        }

        const systemPrompt = `You are LEXORA, an Academic Formatting Engine part of the ALTRIX ecosystem.
Your task is to take research text and map it into a professional LaTeX structure for the '${format}' template.

RULES:
- Handle the input text by identifying Title, Abstract, and Body sections.
- Extract key sections like Introduction, Methodology, Results, and Conclusion.
- Output ONLY the LaTeX body content (between \\maketitle and \\end{document}).
- DO NOT use markdown fences.
- DO NOT provide explanations.
- Use standard LaTeX commands (\\section{}, \\subsection{}, \\cite{}, etc.).
- Normalize references if detected.
- Maintain high academic quality and precision.

FORMAT SPECIFIC INSTRUCTIONS:
- Current Target: ${format}
- Auto-detect Sections: ${options?.autoDetect ? 'Yes' : 'No'}
- Normalize References: ${options?.normalizeRefs ? 'Yes' : 'No'}

Return the mapped content in a structured way that fits perfectly into the template.`;

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
                    { role: "user", content: `Process this research content into '${format}' structure:\n\n${text.substring(0, 10000)}` },
                ],
                temperature: 0.1,
                max_tokens: 4096,
            }),
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Groq error: ${err}`);
        }

        const data = await res.json();
        let bodyContent = data.choices[0]?.message?.content || "";

        // Strip any accidental markdown fences
        bodyContent = bodyContent.replace(/```latex/g, "").replace(/```/g, "").trim();

        // Simple template filling (Mocked title/abstract extraction for this stage)
        const template = LATEX_TEMPLATES[format as keyof typeof LATEX_TEMPLATES] || LATEX_TEMPLATES.IEEE;
        const fullLatex = template
            .replace("{{TITLE}}", "Research Title Detection")
            .replace("{{ABSTRACT}}", "Abstract content mapped from source...")
            .replace("{{BODY}}", bodyContent);

        return NextResponse.json({ latex: fullLatex, source: bodyContent });
    } catch (err: any) {
        console.error("LEXORA Formatting Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
