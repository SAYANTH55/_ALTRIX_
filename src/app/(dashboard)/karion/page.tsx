"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, BookOpen, Clipboard, Check, Download,
    RefreshCw, FileText, Code, Database, AlertCircle,
    ChevronDown, Play, ExternalLink, Trash2, List
} from "lucide-react";

// --- Types ---
type CitationStyle = "IEEE" | "APA" | "ACM" | "Chicago" | "Vancouver";
type OutputFormat = "Formatted Text" | "BibTeX" | "LaTeX \\bibitem" | "RIS";
type VerificationMode = "Strict" | "Standard" | "Quick";
type Tab = "Formatted" | "BibTeX" | "Metadata";

interface CitationMetadata {
    authors: string[];
    title: string;
    journal?: string;
    conference?: string;
    year?: string;
    volume?: string;
    issue?: string;
    pages?: string;
    doi?: string;
    url?: string;
    verified?: boolean;
}

interface KarionResponse {
    formatted: string[];
    bibtex: string;
    metadata: CitationMetadata[];
    warning?: string;
}

export default function KarionPage() {
    const [text, setText] = useState("");
    const [style, setStyle] = useState<CitationStyle>("IEEE");
    const [format, setFormat] = useState<OutputFormat>("Formatted Text");
    const [mode, setMode] = useState<VerificationMode>("Standard");
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<KarionResponse | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>("Formatted");
    const [copied, setCopied] = useState(false);

    // Advanced Toggles
    const [detectDuplicates, setDetectDuplicates] = useState(true);
    const [alphabetize, setAlphabetize] = useState(false);
    const [inTextExamples, setInTextExamples] = useState(false);

    const handleGenerate = async () => {
        if (!text.trim()) return;
        setLoading(true);
        setResponse(null);
        try {
            const res = await fetch("/api/karion/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text,
                    style: style.toLowerCase(),
                    mode: mode.toLowerCase(),
                    detect_duplicates: detectDuplicates,
                    alphabetize
                }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setResponse(data);
        } catch (err: any) {
            console.error("KARION Error:", err);
            alert(err.message || "Pipeline failed. Check backend logs.");
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        let content = "";
        if (activeTab === "Formatted") content = response?.formatted.join("\n") || "";
        else if (activeTab === "BibTeX") content = response?.bibtex || "";
        else content = JSON.stringify(response?.metadata, null, 2);

        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!response) return;
        let content = "";
        let filename = `citations.${activeTab === "BibTeX" ? "bib" : activeTab === "Metadata" ? "json" : "txt"}`;

        if (activeTab === "Formatted") content = response.formatted.join("\n");
        else if (activeTab === "BibTeX") content = response.bibtex;
        else content = JSON.stringify(response.metadata, null, 2);

        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <main className="min-h-screen flex flex-col items-center relative overflow-hidden bg-[#050106] selection:bg-[#4B3EFF]/30">
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes breathe { 0%,100%{opacity:.15} 50%{opacity:.4} }
                .breathe { animation: breathe 8s ease-in-out infinite; }
                @keyframes scan-indigo { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
                .scan-indigo { animation: scan-indigo 3s ease-in-out infinite; }
                @keyframes pulse-indigo { 0%,100%{box-shadow:0 0 20px rgba(75,62,255,.2)} 50%{box-shadow:0 0 40px rgba(75,62,255,.4)} }
                .pulse-indigo { animation: pulse-indigo 4s ease-in-out infinite; }
            ` }} />

            {/* Background elements */}
            <div className="fixed inset-0 bg-[#050106] -z-50" />
            <div className="fixed top-[-20%] left-[-10%] w-[800px] h-[800px] bg-[#4B3EFF]/10 rounded-full blur-[150px] -z-40 breathe pointer-events-none" />
            <div className="fixed bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-[#4B3EFF]/10 rounded-full blur-[150px] -z-40 breathe pointer-events-none" style={{ animationDelay: "2s" }} />

            {/* ── HERO ── */}
            <section className="relative w-full flex flex-col items-center pt-12 pb-6 px-6 text-center">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#4B3EFF]/5 rounded-full blur-[80px] pointer-events-none" />
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="mb-4 px-4 py-1 rounded-full border border-[#4B3EFF]/20 bg-[#4B3EFF]/5 text-[10px] font-bold tracking-[0.4em] uppercase text-[#4B3EFF]/60 backdrop-blur-md">
                    Citation Intelligence Engine
                </motion.div>
                <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    className="text-7xl md:text-8xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-400 tracking-tight font-orbitron drop-shadow-[0_0_25px_rgba(75,62,255,0.2)]">
                    KARION
                </motion.h1>
                <motion.div initial={{ width: 0 }} animate={{ width: 120 }} transition={{ duration: 1 }}
                    className="h-px bg-gradient-to-r from-transparent via-[#4B3EFF] to-transparent my-4" />
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                    className="text-lg font-light tracking-[0.1em] text-white/40 max-w-lg leading-relaxed">
                    Structure. Verify. Cite with precision. Transform raw references into publication-ready citations.
                </motion.p>
            </section>

            {/* ── INTERACTION PANEL ── */}
            <div className="w-full max-w-5xl px-6 pb-20 flex flex-col items-center gap-8 z-10">
                <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                    className="w-full relative group">
                    <div className="absolute -inset-px bg-[#4B3EFF]/20 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-700" />
                    <div className="relative rounded-[2rem] bg-white/[0.02] border border-white/[0.08] backdrop-blur-3xl overflow-hidden">

                        {/* Header */}
                        <div className="px-8 py-5 border-b border-white/[0.06] flex items-center justify-between">
                            <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#4B3EFF]/50">INPUT REFERENCES</span>
                            <div className="flex bg-white/[0.04] p-1 rounded-full border border-white/[0.06]">
                                <button className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
                                    <Trash2 size={14} onClick={() => setText("")} />
                                </button>
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="relative">
                            {loading && (
                                <div className="absolute top-0 left-0 right-0 h-1 z-20 overflow-hidden">
                                    <div className="w-full h-full bg-[#4B3EFF]/30 scan-indigo" />
                                </div>
                            )}
                            <textarea
                                className="w-full h-64 p-8 bg-transparent text-white/90 focus:outline-none text-base leading-relaxed placeholder:text-white/10 resize-none font-light selection:bg-[#4B3EFF]/40"
                                placeholder="Paste raw references, DOIs, URLs, or citation text here…"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                            />

                            <div className="px-8 py-6 border-t border-[#4B3EFF]/10 bg-[#4B3EFF]/5 grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Style Selection */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold tracking-widest text-white/30 uppercase flex items-center gap-2">
                                        <BookOpen size={10} /> Target Style
                                    </label>
                                    <select
                                        value={style}
                                        onChange={(e) => setStyle(e.target.value as CitationStyle)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/80 focus:outline-none focus:border-[#4B3EFF]/40 transition-colors cursor-pointer"
                                    >
                                        <option value="IEEE">IEEE</option>
                                        <option value="APA">APA</option>
                                        <option value="ACM">ACM</option>
                                        <option value="Chicago">Chicago</option>
                                        <option value="Vancouver">Vancouver</option>
                                    </select>
                                </div>

                                {/* Output Format */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold tracking-widest text-white/30 uppercase flex items-center gap-2">
                                        <FileText size={10} /> Output Format
                                    </label>
                                    <select
                                        value={format}
                                        onChange={(e) => setFormat(e.target.value as OutputFormat)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/80 focus:outline-none focus:border-[#4B3EFF]/40 transition-colors cursor-pointer"
                                    >
                                        <option value="Formatted Text">Formatted Text</option>
                                        <option value="BibTeX">BibTeX</option>
                                        <option value="LaTeX \\bibitem">LaTeX \bibitem</option>
                                        <option value="RIS">RIS</option>
                                    </select>
                                </div>

                                {/* Verification Mode */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold tracking-widest text-white/30 uppercase flex items-center gap-2">
                                        <Database size={10} /> Verification
                                    </label>
                                    <select
                                        value={mode}
                                        onChange={(e) => setMode(e.target.value as VerificationMode)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/80 focus:outline-none focus:border-[#4B3EFF]/40 transition-colors cursor-pointer"
                                    >
                                        <option value="Quick">Quick (AI only)</option>
                                        <option value="Standard">Standard (Crossref)</option>
                                        <option value="Strict">Strict (+Semantic Scholar)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ADVANCED TOGGLES */}
                <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
                    <button onClick={() => setDetectDuplicates(!detectDuplicates)} className="flex items-center gap-2 group">
                        <div className={`w-8 h-4 rounded-full relative transition-all border ${detectDuplicates ? "bg-[#4B3EFF]/20 border-[#4B3EFF]/50" : "bg-white/5 border-white/10"}`}>
                            <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all ${detectDuplicates ? "bg-[#4B3EFF] left-[17px]" : "bg-white/20 left-1"}`} />
                        </div>
                        <span className="text-[10px] font-bold tracking-widest text-white/30 group-hover:text-white/50 transition-colors uppercase">Detect Duplicates</span>
                    </button>
                    <button onClick={() => setAlphabetize(!alphabetize)} className="flex items-center gap-2 group">
                        <div className={`w-8 h-4 rounded-full relative transition-all border ${alphabetize ? "bg-[#4B3EFF]/20 border-[#4B3EFF]/50" : "bg-white/5 border-white/10"}`}>
                            <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all ${alphabetize ? "bg-[#4B3EFF] left-[17px]" : "bg-white/20 left-1"}`} />
                        </div>
                        <span className="text-[10px] font-bold tracking-widest text-white/30 group-hover:text-white/50 transition-colors uppercase">Alphabetize</span>
                    </button>
                    <button onClick={() => setInTextExamples(!inTextExamples)} className="flex items-center gap-2 group">
                        <div className={`w-8 h-4 rounded-full relative transition-all border ${inTextExamples ? "bg-[#4B3EFF]/20 border-[#4B3EFF]/50" : "bg-white/5 border-white/10"}`}>
                            <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all ${inTextExamples ? "bg-[#4B3EFF] left-[17px]" : "bg-white/20 left-1"}`} />
                        </div>
                        <span className="text-[10px] font-bold tracking-widest text-white/30 group-hover:text-white/50 transition-colors uppercase">In-text Examples</span>
                    </button>
                </div>

                {/* PRIMARY CTA */}
                <div className="flex flex-col items-center gap-4">
                    <motion.button
                        whileHover={{ y: -3, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGenerate}
                        disabled={loading || !text.trim()}
                        className="relative px-12 py-5 rounded-2xl font-orbitron font-black tracking-[0.2em] text-sm text-white overflow-hidden disabled:opacity-30 disabled:grayscale transition-all duration-500 pulse-indigo group">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#4B3EFF] to-[#251b8a] group-hover:from-[#5e51ff] group-hover:to-[#3126b8] transition-colors" />
                        <div className="absolute top-0 left-4 right-4 h-px bg-white/20" />
                        <span className="relative flex items-center justify-center gap-3">
                            {loading ? (
                                <>
                                    <span>Verifying & Structuring</span>
                                    <div className="flex gap-1">
                                        <div className="w-1 h-1 rounded-full bg-white opacity-40 animate-pulse" />
                                        <div className="w-1 h-1 rounded-full bg-white opacity-40 animate-pulse delay-150" />
                                        <div className="w-1 h-1 rounded-full bg-white opacity-40 animate-pulse delay-300" />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <span>Generate Citations</span>
                                    <Play size={14} fill="currentColor" className="ml-1" />
                                </>
                            )}
                        </span>
                    </motion.button>
                    <span className="text-[10px] text-white/15 tracking-[0.3em] uppercase">Verified metadata-driven formatting</span>
                </div>

                {/* ── VISUAL OUTPUT ── */}
                <AnimatePresence>
                    {response && (
                        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                            className="w-full flex flex-col gap-6 mt-4">

                            <div className="relative group">
                                <div className="absolute -inset-px bg-[#4B3EFF]/20 rounded-3xl blur opacity-20" />
                                <div className="relative rounded-3xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-3xl min-h-[400px] flex flex-col">

                                    {/* Tabs */}
                                    <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between">
                                        <div className="flex bg-white/[0.04] p-1 rounded-xl border border-white/[0.06]">
                                            {["Formatted", "BibTeX", "Metadata"].map((t) => (
                                                <button
                                                    key={t}
                                                    onClick={() => setActiveTab(t as Tab)}
                                                    className={`px-5 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all ${activeTab === t ? "bg-[#4B3EFF]/20 text-[#4B3EFF]" : "text-white/30 hover:text-white/50"}`}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button onClick={handleDownload} className="p-2 hover:bg-white/5 rounded-lg text-white/30 hover:text-white transition-colors" title="Download">
                                                <Download size={16} />
                                            </button>
                                            <button onClick={handleCopy} className="p-2 hover:bg-white/5 rounded-lg text-white/30 hover:text-white transition-colors" title="Copy">
                                                {copied ? <Check size={16} className="text-green-500" /> : <Clipboard size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Tab Content */}
                                    <div className="flex-1 p-8">
                                        {activeTab === "Formatted" ? (
                                            <div className="space-y-6">
                                                {response.formatted.map((cite, idx) => (
                                                    <motion.div
                                                        key={idx}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        className="flex gap-4 group/cite"
                                                    >
                                                        <span className="text-[10px] font-mono text-white/20 mt-1">[{idx + 1}]</span>
                                                        <div className="flex-1 space-y-2">
                                                            <p className="text-white/80 font-light leading-relaxed indent-[-1em] ml-[1em]">
                                                                {style === "IEEE" ? `[${idx + 1}] ` : ""}{cite}
                                                            </p>
                                                            {response.metadata[idx].verified && (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-[9px] font-bold text-green-500 uppercase tracking-tighter">Verified</div>
                                                                    {response.metadata[idx].doi && (
                                                                        <a href={`https://doi.org/${response.metadata[idx].doi}`} target="_blank" className="text-[9px] text-white/20 hover:text-[#4B3EFF] flex items-center gap-1 transition-colors">
                                                                            <ExternalLink size={10} /> DOI: {response.metadata[idx].doi}
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {!response.metadata[idx].verified && mode !== "Quick" && (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[9px] font-bold text-amber-500 uppercase tracking-tighter flex items-center gap-1">
                                                                        <AlertCircle size={8} /> Unverified
                                                                    </div>
                                                                    <span className="text-[9px] text-white/10 italic">Metadata reconstructed by AI.</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        ) : activeTab === "BibTeX" ? (
                                            <div className="w-full bg-black/20 p-6 rounded-2xl font-mono text-xs text-[#4B3EFF]/70 whitespace-pre border border-white/5 overflow-auto max-h-[500px]">
                                                {response.bibtex}
                                            </div>
                                        ) : (
                                            <div className="w-full bg-black/20 p-6 rounded-2xl font-mono text-xs text-white/40 whitespace-pre border border-white/5 overflow-auto max-h-[500px]">
                                                {JSON.stringify(response.metadata, null, 2)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Regenerate Action */}
                            <motion.button
                                onClick={handleGenerate}
                                className="self-center flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 hover:border-[#4B3EFF]/30 hover:bg-[#4B3EFF]/5 transition-all text-[10px] font-bold tracking-widest text-white/40 hover:text-white uppercase"
                            >
                                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                                Refresh Results
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}
