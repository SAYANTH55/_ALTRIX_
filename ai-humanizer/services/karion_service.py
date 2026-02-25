import json
import httpx
import asyncio
import re
from typing import List, Dict, Any, Optional
from citeproc import CitationStylesStyle, CitationStylesBibliography
from citeproc import Citation, CitationItem
from citeproc.source.json import CiteProcJSON

class KarionService:
    def __init__(self, gateway):
        self.gateway = gateway
        self.crossref_url = "https://api.crossref.org/works"
        self.semantic_scholar_url = "https://api.semanticscholar.org/graph/v1/paper/search"

    async def extract_metadata(self, raw_text: str) -> List[Dict[str, Any]]:
        """
        Step 1: Extract structured data using AI Gateway (8B model).
        """
        system_prompt = (
            "You are an academic metadata extractor. Extract citation details from the provided text. "
            "Return a JSON object with a key 'references' containing a list of objects. Each citation object should have these fields: "
            "authors (list of strings), title, journal, conference, year, volume, issue, pages, doi, url. "
            "If a field is missing, use null. Output ONLY strict JSON. "
            "Example: {\"references\": [{\"authors\": [\"A. Vaswani\"], \"title\": \"Attention...\", ...}]}"
        )
        
        # Taking first 5000 chars to avoid overload
        prompt = f"Extract metadata from these references:\n\n{raw_text[:5000]}"
        
        try:
            res = await self.gateway.generate(
                model_type="light",
                system_prompt=system_prompt,
                prompt=prompt
            )
            
            if "error" in res:
                return []

            content = res.get("choices", [{}])[0].get("message", {}).get("content", "[]")
            
            # Extract JSON from potential conversational text
            json_match = re.search(r"(\{.*\}|\[.*\])", content, re.DOTALL)
            if json_match:
                content = json_match.group(0)
            
            data = json.loads(content)
            
            # Ensure it's a list
            if isinstance(data, dict):
                # Sometimes LLM returns {"references": [...]}
                for key in ["references", "citations", "results", "data"]:
                    if key in data and isinstance(data[key], list):
                        return data[key]
                return [data]
            return data
        except Exception as e:
            return []

    async def verify_metadata(self, item: Dict[str, Any], mode: str = "standard") -> Dict[str, Any]:
        """
        Step 2: Verify against Crossref/Semantic Scholar.
        """
        if mode == "quick":
            return item

        doi = item.get("doi")
        title = item.get("title")
        
        verified_data = item.copy()

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # 1. Try DOI directly
                if doi:
                    doi_clean = doi.strip().replace("https://doi.org/", "")
                    res = await client.get(f"{self.crossref_url}/{doi_clean}")
                    if res.status_code == 200:
                        cr_data = res.json().get("message", {})
                        self._merge_crossref(verified_data, cr_data)
                        verified_data["verified"] = True
                        return verified_data

                # 2. Try Title Search
                if title:
                    params = {"query.title": title, "rows": 1}
                    if item.get("authors") and len(item["authors"]) > 0:
                        params["query.author"] = item["authors"][0]
                    
                    res = await client.get(self.crossref_url, params=params)
                    if res.status_code == 200:
                        items = res.json().get("message", {}).get("items", [])
                        if items:
                            self._merge_crossref(verified_data, items[0])
                            verified_data["verified"] = True
                            return verified_data

                # 3. Fallback to Semantic Scholar if requested and no match yet
                if mode == "strict" and not verified_data.get("verified") and title:
                    params = {"query": title, "limit": 1, "fields": "title,authors,year,journal,externalIds,url"}
                    res = await client.get(self.semantic_scholar_url, params=params)
                    if res.status_code == 200:
                        papers = res.json().get("data", [])
                        if papers:
                            self._merge_semantic(verified_data, papers[0])
                            verified_data["verified"] = True
                            return verified_data

        except Exception as e:
            print(f"KARION Verification Error: {e}")
        
        verified_data["verified"] = False
        return verified_data

    def _merge_crossref(self, target: Dict, source: Dict):
        target["title"] = source.get("title", [target.get("title")])[0]
        target["doi"] = source.get("DOI", target.get("doi"))
        target["url"] = source.get("URL", target.get("url"))
        target["year"] = source.get("created", {}).get("date-parts", [[target.get("year")]])[0][0]
        
        if "container-title" in source:
            target["journal"] = source["container-title"][0]
        
        if "author" in source:
            target["authors"] = [f"{a.get('given', '')} {a.get('family', '')}".strip() for a in source["author"]]

    def _merge_semantic(self, target: Dict, source: Dict):
        target["title"] = source.get("title", target.get("title"))
        target["year"] = source.get("year", target.get("year"))
        target["url"] = source.get("url", target.get("url"))
        if "externalIds" in source and "DOI" in source["externalIds"]:
            target["doi"] = source["externalIds"]["DOI"]
        if "authors" in source:
            target["authors"] = [a.get("name", "") for a in source["authors"]]

    def format_citation(self, items: List[Dict[str, Any]], style_name: str = "ieee") -> Dict[str, Any]:
        """
        Step 3 & 4: Format using citeproc-py.
        Note: style_name should be an alias or path to CSL.
        For simplicity, we'll map common styles to built-in or standard names.
        """
        # Mapping to CSL field names
        csl_items = []
        for i, item in enumerate(items):
            authors = []
            for a in item.get("authors", []):
                parts = a.split()
                if len(parts) > 1:
                    authors.append({"family": parts[-1], "given": " ".join(parts[:-1])})
                else:
                    authors.append({"family": a})

            csl_item = {
                "id": f"ref{i}",
                "type": "article-journal" if item.get("journal") else "paper-conference",
                "title": item.get("title"),
                "container-title": item.get("journal") or item.get("conference"),
                "issued": {"date-parts": [[int(item.get("year"))]]} if item.get("year") else None,
                "author": authors,
                "DOI": item.get("doi"),
                "URL": item.get("url"),
                "volume": item.get("volume"),
                "issue": item.get("issue"),
                "page": item.get("pages")
            }
            # Remove None values
            csl_item = {k: v for k, v in csl_item.items() if v is not None}
            csl_items.append(csl_item)

        try:
            # Try to use citeproc-py
            try:
                alias_map = {
                    "ieee": "ieee",
                    "apa": "apa",
                    "acm": "acm-siggraph",
                    "chicago": "chicago-author-date",
                    "vancouver": "vancouver"
                }
                actual_style = alias_map.get(style_name.lower(), "ieee")
                style = CitationStylesStyle(actual_style, validate=False)
                bibliography = CitationStylesBibliography(style, bib_source, formatter=None)
                
                for item in csl_items:
                    citation = Citation([CitationItem(item["id"])])
                    bibliography.register(citation)
                
                formatted_list = [str(item) for item in bibliography.bibliography()]
            except Exception as e:
                print(f"KARION CiteProc failed (likely missing style): {e}. Using fallback.")
                formatted_list = self._manual_format(items, style_name)

            # Generate BibTeX manually for reliability
            bibtex_entries = []
            for item in items:
                # Use year if available, otherwise 'n.d.'
                year_val = item.get('year', 'n.d.')
                # Create a reliable key
                author_key = "ref"
                if item.get("authors"):
                    last_name = item["authors"][0].split()[-1]
                    author_key = "".join(filter(str.isalnum, last_name)).lower()
                
                cite_key = f"{author_key}{year_val}"
                
                entry = f"@article{{{cite_key},\n"
                entry += f"  author = {{{' and '.join(item.get('authors', []))}}},\n"
                entry += f"  title = {{{item.get('title')}}},\n"
                if item.get("journal"): entry += f"  journal = {{{item.get('journal')}}},\n"
                if item.get("year"): entry += f"  year = {{{item.get('year')}}},\n"
                if item.get("doi"): entry += f"  doi = {{{item.get('doi')}}},\n"
                if item.get("url"): entry += f"  url = {{{item.get('url')}}},\n"
                entry += "}"
                bibtex_entries.append(entry)

            return {
                "formatted": formatted_list,
                "bibtex": "\n\n".join(bibtex_entries),
                "metadata": items
            }

        except Exception as e:
            print(f"KARION Formatting Error: {e}")
            return {
                "formatted": self._manual_format(items, style_name),
                "bibtex": "Failed to generate BibTeX",
                "metadata": items,
                "warning": str(e)
            }

    def _manual_format(self, items: List[Dict], style: str) -> List[str]:
        """Simple template-based academic formatting."""
        formatted = []
        for item in items:
            authors = ", ".join(item.get("authors", ["Unknown Author"]))
            year = item.get("year", "n.d.")
            title = item.get("title", "Untitled")
            source = item.get("journal") or item.get("conference") or "Academic Repository"
            
            if style.lower() == "apa":
                line = f"{authors} ({year}). {title}. {source}."
            elif style.lower() == "ieee":
                # [1] A. Author, "Title," Journal, Year.
                line = f"{authors}, \"{title},\" {source}, {year}."
            else:
                line = f"{authors}. {year}. {title}. {source}."
            
            formatted.append(line)
        return formatted
