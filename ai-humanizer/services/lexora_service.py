import json
import re
from typing import Dict, Any, Optional

class LexoraService:
    def __init__(self, gateway):
        self.gateway = gateway
        self.templates = {
            "IEEE": """\\documentclass[conference]{IEEEtran}
% LEXORA_ENGINE_V2.5_ACTIVE
\\usepackage{cite}
\\usepackage{amsmath,amssymb,amsfonts}
\\usepackage{algorithmic}
\\usepackage{graphicx}
\\usepackage{textcomp}
\\usepackage{xcolor}
\\begin{document}
\\title{ {{TITLE}} }
\\author{ {{AUTHORS}} }
\\maketitle
{{BODY}}
\\end{document}""",
            "ACM": """\\documentclass[sigconf]{acmart}
% LEXORA_ENGINE_V2.5_ACTIVE
\\begin{document}
\\title{ {{TITLE}} }
\\author{ {{AUTHORS}} }
\\maketitle
{{BODY}}
\\end{document}""",
            "APA": """\\documentclass[manuscript, screen, noextraspace]{apa7}
% LEXORA_ENGINE_V2.5_ACTIVE
\\title{ {{TITLE}} }
\\shorttitle{ {{SHORTTITLE}} }
\\author{ {{AUTHORS}} }
\\begin{document}
\\maketitle
{{BODY}}
\\end{document}""",
            "Springer": """\\documentclass[runningheads]{llncs}
% LEXORA_ENGINE_V2.5_ACTIVE
\\begin{document}
\\title{ {{TITLE}} }
\\author{ {{AUTHORS}} }
\\institute{University Name}
\\maketitle
{{BODY}}
\\end{document}""",
        }

    async def _extract_metadata(self, text: str) -> Dict[str, Any]:
        """
        Multi-pass ML-style extraction for high precision.
        Pass 1: Broad extraction
        Pass 2: JSON Verification & Refinement
        """
        # Pass 1: Broad extraction
        broad_prompt = (
            "You are an Advanced Research Header Parser. Extract the EXACT Title and Authors from this paper.\n"
            "Format: JSON { 'title': '...', 'authors': ['...', '...'] }\n"
            "Be extremely literal."
        )
        try:
            res = await self.gateway.generate(
                model_type="light",
                system_prompt=broad_prompt,
                prompt=f"Paper Head:\n\n{text[:3000]}"
            )
            raw = res.get("choices", [{}])[0].get("message", {}).get("content", "{}").strip()
            raw = re.sub(r"```json\s?|\s?```", "", raw)
            data = json.loads(raw)
            
            # Pass 2: Refinement
            refine_prompt = (
                "Verify and clean this research metadata. Ensure names are formatted correctly "
                "and the title is exactly as written in the paper.\n"
                "Return clean JSON."
            )
            res_refine = await self.gateway.generate(
                model_type="light",
                system_prompt=refine_prompt,
                prompt=f"Original: {text[:2000]}\nExtracted: {json.dumps(data)}"
            )
            refined_raw = res_refine.get("choices", [{}])[0].get("message", {}).get("content", "{}").strip()
            refined_raw = re.sub(r"```json\s?|\s?```", "", refined_raw)
            return json.loads(refined_raw)
        except:
            return {"title": "Unknown Research Title", "authors": ["Unknown Researchers"]}

    async def process_text(self, text: str, format_type: str, options: Dict[str, Any]) -> Dict[str, Any]:
        """
        Structures research text into LaTeX using the specified format.
        Uses the V2.5 high-volume engine (30k char context).
        """
        # Stage 1: metadata
        metadata = await self._extract_metadata(text)

        # Stage 2: Full Body
        images = options.get("images", [])
        images_str = ", ".join(images) if images else "None"
        
        body_prompt = (
            f"You are LEXORA V2.5, an AI-ML Academic Structuring Engine.\n"
            f"Task: Generate the COMPLETE Body for a '{format_type}' LaTeX document.\n"
            "MANDATORY:\n"
            "1. Start with \\begin{abstract}.\n"
            "2. Follow with all sections (Introduction through References).\n"
            "3. Use LaTeX syntax strictly.\n"
            f"4. Integrate Figures: {images_str}. Identify where they fit and insert \\includegraphics.\n"
            "5. NO PREAMBLE, NO TITLE, NO AUTHORS - Just the body content starting with abstract.\n"
            "6. DO NOT CUT OFF. Generate the entire paper."
        )

        try:
            body_res = await self.gateway.generate(
                model_type="heavy",
                system_prompt=body_prompt,
                prompt=f"PAPER CONTENT (30k chars):\n\n{text[:30000]}"
            )

            body_content = body_res.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
            body_content = body_content.replace("```latex", "").replace("```", "").strip()

            template = self.templates.get(format_type, self.templates["IEEE"])
            
            authors = metadata.get("authors", [])
            if format_type == "IEEE":
                authors_latex = "\\IEEEauthorblockN{" + ", ".join(authors) + "}"
            else:
                authors_latex = ", ".join(authors)
            
            full_latex = template
            full_latex = full_latex.replace("{{TITLE}}", metadata.get("title", "Unknown Title"))
            full_latex = full_latex.replace("{{AUTHORS}}", authors_latex)
            full_latex = full_latex.replace("{{BODY}}", body_content)
            
            if "{{SHORTTITLE}}" in full_latex:
                short_title = metadata.get("title", "Research")[:50]
                full_latex = full_latex.replace("{{SHORTTITLE}}", short_title)

            return {
                "latex": full_latex,
                "metadata": metadata
            }
        except Exception as e:
            raise e
