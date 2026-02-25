import { NextResponse } from "next/server";

const SEMANTIC_SCHOLAR_URL = "https://api.semanticscholar.org/graph/v1/paper/search";
const ARXIV_URL = "http://export.arxiv.org/api/query";

interface UnifiedPaper {
    id: string;
    source: "semantic" | "arxiv";
    title: string;
    authors: string[];
    year: number | null;
    abstract: string;
    citations: number | null;
    pdf: string | null;
    url: string;
    field: string | null;
    openAccess: boolean;
}

function normalize(s: string) {
    return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
}

function scoreResult(paper: UnifiedPaper, query: string): number {
    const titleNorm = normalize(paper.title);
    const queryNorm = normalize(query);
    const queryWords = queryNorm.split(/\s+/);

    // Exact title match → massive boost
    if (titleNorm === queryNorm) return 10000;

    // Title contains entire query → big boost
    if (titleNorm.includes(queryNorm)) return 5000;

    // Word-by-word title match score
    const matchedWords = queryWords.filter((w) => titleNorm.includes(w));
    const wordCoverage = matchedWords.length / queryWords.length;
    const keywordScore = wordCoverage * 100;

    const citationScore = paper.citations ? Math.min(paper.citations / 100, 20) : 0;
    const recencyScore = paper.year ? Math.max(0, (paper.year - 2010) / 2) : 0;
    return keywordScore + citationScore + recencyScore;
}

const SEMANTIC_SCHOLAR_API_KEY = process.env.SEMANTIC_SCHOLAR_API_KEY || "";

async function fetchSemanticScholar(query: string, limit = 15): Promise<UnifiedPaper[]> {
    try {
        const fields = "title,authors,year,abstract,citationCount,url,venue,fieldsOfStudy,openAccessPdf";
        const headers: Record<string, string> = {};
        if (SEMANTIC_SCHOLAR_API_KEY) {
            headers["x-api-key"] = SEMANTIC_SCHOLAR_API_KEY;
        }

        const res = await fetch(
            `${SEMANTIC_SCHOLAR_URL}?query=${encodeURIComponent(query)}&limit=${limit}&fields=${fields}`,
            { headers, signal: AbortSignal.timeout(8000) }
        );

        if (!res.ok) {
            const errText = await res.text();
            console.error(`Semantic Scholar error ${res.status}:`, errText);
            return [];
        }

        const data = await res.json();
        return (data.data || []).map((p: any) => ({
            id: `semantic-${p.paperId}`,
            source: "semantic" as const,
            title: p.title || "Untitled",
            authors: (p.authors || []).map((a: any) => a.name),
            year: p.year || null,
            abstract: p.abstract || "",
            citations: p.citationCount ?? null,
            pdf: p.openAccessPdf?.url || null,
            url: p.url || `https://www.semanticscholar.org/paper/${p.paperId}`,
            field: p.fieldsOfStudy?.[0] || null,
            openAccess: !!p.openAccessPdf?.url,
        }));
    } catch (err) {
        console.error("Semantic Scholar fetch failed:", err);
        return [];
    }
}

async function fetchArxiv(query: string, limit = 15): Promise<UnifiedPaper[]> {
    try {
        // arXiv needs + not %20 for spaces, and we search title OR all-fields
        const q = query.trim().replace(/\s+/g, "+");
        const searchQuery = `ti:${q}+OR+all:${q}`;
        const res = await fetch(
            `${ARXIV_URL}?search_query=${searchQuery}&start=0&max_results=${limit}&sortBy=relevance`,
            { signal: AbortSignal.timeout(8000) }
        );
        if (!res.ok) {
            console.error("arXiv error:", res.status);
            return [];
        }
        const xml = await res.text();

        const entries: UnifiedPaper[] = [];
        const entryMatches = xml.match(/<entry>([\s\S]*?)<\/entry>/g) || [];

        for (const entry of entryMatches) {
            const get = (tag: string) => {
                const m = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
                return m ? m[1].trim().replace(/\s+/g, " ") : "";
            };
            const titleRaw = get("title");
            const summary = get("summary");
            const published = get("published");
            const year = published ? parseInt(published.slice(0, 4)) : null;

            const authorMatches = [...entry.matchAll(/<name>([\s\S]*?)<\/name>/g)];
            const authors = authorMatches.map((m) => m[1].trim());

            const idMatch = entry.match(/<id>([\s\S]*?)<\/id>/);
            const arxivUrl = idMatch ? idMatch[1].trim() : "";
            const arxivId = arxivUrl.split("/abs/")[1] || arxivUrl;
            const pdfLink = arxivId ? `https://arxiv.org/pdf/${arxivId}` : null;

            if (!titleRaw) continue;

            entries.push({
                id: `arxiv-${arxivId}`,
                source: "arxiv" as const,
                title: titleRaw,
                authors,
                year,
                abstract: summary,
                citations: null,
                pdf: pdfLink,
                url: arxivUrl || `https://arxiv.org/abs/${arxivId}`,
                field: null,
                openAccess: true,
            });
        }
        return entries;
    } catch {
        return [];
    }
}

export async function POST(req: Request) {
    try {
        const { query, filters } = await req.json();
        if (!query?.trim()) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        const [semanticResults, arxivResults] = await Promise.all([
            fetchSemanticScholar(query, 15),
            fetchArxiv(query, 15),
        ]);

        let combined: UnifiedPaper[] = [...semanticResults, ...arxivResults];

        // Apply filters
        if (filters) {
            if (filters.source && filters.source !== "all") {
                combined = combined.filter((p) => p.source === filters.source);
            }
            if (filters.openAccessOnly) {
                combined = combined.filter((p) => p.openAccess);
            }
            if (filters.yearFrom) {
                combined = combined.filter((p) => !p.year || p.year >= filters.yearFrom);
            }
            if (filters.yearTo) {
                combined = combined.filter((p) => !p.year || p.year <= filters.yearTo);
            }
            if (filters.minCitations) {
                combined = combined.filter(
                    (p) => p.citations === null || p.citations >= filters.minCitations
                );
            }
        }

        // Smart rank
        combined.sort((a, b) => scoreResult(b, query) - scoreResult(a, query));

        return NextResponse.json({ results: combined, total: combined.length });
    } catch (err: any) {
        console.error("DEOZA search error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
