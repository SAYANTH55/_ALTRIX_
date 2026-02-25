"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FileText, Upload, ChevronRight, Check, Download,
    RefreshCw, Code, Eye, Clipboard, Settings,
    FileCode, Layout, BookOpen, Layers, X, Play
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type AcademicFormat = "IEEE" | "ACM" | "APA" | "Springer";

// ─── Components ───────────────────────────────────────────────────────────────

function ToggleOption({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
    return (
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all group">
            <span className="text-xs font-semibold text-white/50 group-hover:text-white/80 transition-colors uppercase tracking-widest">{label}</span>
            <button onClick={onToggle}
                className={`w-10 h-5 rounded-full relative transition-all duration-300 border ${active ? "bg-[#D4AF37]/20 border-[#D4AF37]/50" : "bg-white/5 border-white/10"}`}>
                <motion.div animate={{ x: active ? 22 : 4 }} className={`absolute top-1 w-2.5 h-2.5 rounded-full ${active ? "bg-[#D4AF37]" : "bg-white/20"}`} />
            </button>
        </div>
    );
}

export default function LexoraPage() {
    const [file, setFile] = useState<File | null>(null);
    const [text, setText] = useState("");
    const [format, setFormat] = useState<AcademicFormat>("IEEE");
    const [loading, setLoading] = useState(false);
    const [latex, setLatex] = useState("");
    const [activeTab, setActiveTab] = useState<"Preview" | "Code">("Preview");
    const [copied, setCopied] = useState(false);

    // Options
    const [options, setOptions] = useState({
        autoDetect: true,
        preserveHeadings: true,
        normalizeRefs: true,
        extractFigures: false
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            setFile(selected);
            setText(""); // Clear mock text
        }
    };

    const handleGenerate = async () => {
        if (!file) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("format", format);
            formData.append("autoDetect", options.autoDetect.toString());
            formData.append("normalizeRefs", options.normalizeRefs.toString());

            const res = await fetch("http://localhost:8000/lexora/process", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || "Failed to process document");
            }

            const data = await res.json();
            setLatex(data.latex);
            setActiveTab("Code"); // Switch to code to show the full result
        } catch (err: any) {
            console.error("LEXORA Error:", err);
            alert(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex flex-col items-center relative overflow-hidden bg-[#040404] selection:bg-[#D4AF37]/30">
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes goldBreathe { 0%,100%{opacity:.1} 50%{opacity:.25} }
                .gold-breathe { animation: goldBreathe 10s ease-in-out infinite; }
                @keyframes goldSweep { 0%{transform:translateX(-100%);opacity:0} 40%{opacity:1} 100%{transform:translateX(200%);opacity:0} }
                .gold-sweep { animation: goldSweep 2.5s ease-in-out infinite; }
                @keyframes manuscriptLine { 0%{transform:scaleX(0);opacity:0} 50%{opacity:.15} 100%{transform:scaleX(1);opacity:0} }
                .manuscript { animation: manuscriptLine 4s ease-in-out infinite; }
            ` }} />

            {/* Background */}
            <div className="fixed inset-0 bg-[#040404] -z-50" />
            <div className="fixed top-[-10%] left-[-5%] w-[900px] h-[900px] bg-[#D4AF37]/5 rounded-full blur-[180px] -z-40 gold-breathe pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-5%] w-[800px] h-[800px] bg-[#D4AF37]/5 rounded-full blur-[150px] -z-40 gold-breathe pointer-events-none" style={{ animationDelay: "3s" }} />

            {/* Micro grid lines */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
                style={{ backgroundImage: `linear-gradient(#D4AF37 1px, transparent 1px), linear-gradient(90deg, #D4AF37 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />

            {/* ── HERO ── */}
            <section className="relative w-full flex flex-col items-center pt-16 pb-8 px-6 text-center">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
                    className="mb-5 px-5 py-1.5 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/5 text-[10px] font-bold tracking-[0.4em] uppercase text-[#D4AF37]/60 backdrop-blur-md">
                    Academic Formatting Engine
                </motion.div>
                <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8 }}
                    className="text-7xl md:text-8xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-[#D4AF37]/50 tracking-tight font-orbitron drop-shadow-[0_0_30px_rgba(212,175,55,0.15)]">
                    LEXORA
                </motion.h1>
                <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.5, duration: 1.2 }}
                    className="h-px w-48 bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent my-6" />
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                    className="text-lg font-light tracking-[0.15em] text-white/40 max-w-xl leading-relaxed">
                    Transform research into publication-ready precision. Standardized LaTeX templates for global publishers.
                </motion.p>
            </section>

            {/* ── PRIMARY PANEL ── */}
            <div className="w-full max-w-5xl px-6 pb-24 flex flex-col gap-8 z-10">
                <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.8 }}
                    className="relative group">
                    <div className="absolute -inset-px bg-gradient-to-r from-[#D4AF37]/30 to-[#8a6d21]/30 rounded-[2.5rem] blur-xl opacity-10 group-hover:opacity-20 transition duration-700" />
                    <div className="relative rounded-[2.5rem] bg-white/[0.02] border border-white/[0.08] backdrop-blur-3xl shadow-3xl overflow-hidden p-10">

                        <div className="flex items-center justify-between mb-8">
                            <span className="text-[10px] font-bold tracking-[0.5em] uppercase text-[#D4AF37]/50">UPLOAD DOCUMENT</span>
                            <div className="flex gap-4">
                                <span className="text-[9px] font-bold text-white/20 tracking-widest px-3 py-1 rounded-full border border-white/5 bg-white/[0.02]">DOCX</span>
                                <span className="text-[9px] font-bold text-white/20 tracking-widest px-3 py-1 rounded-full border border-white/5 bg-white/[0.02]">PDF</span>
                            </div>
                        </div>

                        {/* Upload Zone */}
                        <label className="relative block h-64 w-full rounded-2xl border-2 border-dashed border-white/5 bg-[#D4AF37]/[0.02] hover:bg-[#D4AF37]/[0.04] hover:border-[#D4AF37]/20 transition-all cursor-pointer group/upload">
                            <input type="file" className="hidden" onChange={handleFileUpload} accept=".docx,.pdf" />
                            {loading && (
                                <div className="absolute inset-0 z-20 pointer-events-none">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/10 to-transparent gold-sweep" />
                                </div>
                            )}
                            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                {file ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="p-5 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37]">
                                            <FileText size={40} />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{file.name}</p>
                                            <p className="text-white/30 text-xs mt-1">{(file.size / 1024).toFixed(1)} KB • Ready for processing</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <Upload size={40} className="text-white/10 group-hover/upload:text-[#D4AF37]/50 transition-colors mb-4" />
                                        <p className="text-white/40 font-light tracking-wide">Drag & drop your research document or <span className="text-[#D4AF37]/70 font-medium">click to upload</span></p>
                                    </>
                                )}
                            </div>
                        </label>

                        {/* Format Selection */}
                        <div className="mt-12">
                            <p className="text-[10px] font-bold tracking-[0.5em] uppercase text-[#D4AF37]/50 mb-6">SELECT TARGET FORMAT</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {(["IEEE", "ACM", "APA", "Springer"] as AcademicFormat[]).map((f) => (
                                    <button key={f} onClick={() => setFormat(f)}
                                        className={`relative h-24 rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all duration-300
                                            ${format === f ? "bg-[#D4AF37]/15 border-[#D4AF37]/40 shadow-[0_0_20px_rgba(212,175,55,0.15)]" : "bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10"}`}>
                                        <span className={`text-sm font-bold tracking-widest ${format === f ? "text-[#D4AF37]" : "text-white/40"}`}>{f}</span>
                                        {format === f && <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Options */}
                        <div className="mt-12">
                            <p className="text-[10px] font-bold tracking-[0.5em] uppercase text-[#D4AF37]/50 mb-6">STRUCTURE ANALYSIS OPTIONS</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ToggleOption label="Auto-detect sections" active={options.autoDetect} onToggle={() => setOptions(o => ({ ...o, autoDetect: !o.autoDetect }))} />
                                <ToggleOption label="Preserve original headings" active={options.preserveHeadings} onToggle={() => setOptions(o => ({ ...o, preserveHeadings: !o.preserveHeadings }))} />
                                <ToggleOption label="Normalize references" active={options.normalizeRefs} onToggle={() => setOptions(o => ({ ...o, normalizeRefs: !o.normalizeRefs }))} />
                                <ToggleOption label="Extract figures & tables" active={options.extractFigures} onToggle={() => setOptions(o => ({ ...o, extractFigures: !o.extractFigures }))} />
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="mt-12 flex flex-col items-center gap-4">
                            <motion.button
                                whileHover={{ y: -3, scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleGenerate}
                                disabled={loading || (!file && !text)}
                                className="relative px-16 py-5 rounded-2xl font-orbitron font-black tracking-[0.25em] text-sm text-white overflow-hidden disabled:opacity-30 disabled:grayscale transition-all duration-500 shadow-[0_0_30px_rgba(212,175,55,0.1)] group">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37] to-[#8a6d21] group-hover:from-[#e5c158] group-hover:to-[#a98528] transition-colors" />
                                <div className="absolute top-0 left-4 right-4 h-px bg-white/20" />
                                <span className="relative flex items-center justify-center gap-3">
                                    {loading ? (
                                        <>
                                            <span className="text-white/90">Structuring Document</span>
                                            <div className="flex gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
                                                <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse delay-75" />
                                                <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse delay-150" />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <span>Generate LaTeX</span>
                                            <ChevronRight size={18} className="translate-y-[1px]" />
                                        </>
                                    )}
                                </span>
                            </motion.button>
                            <span className="text-[10px] text-white/15 tracking-[0.4em] uppercase">Structured template-based LaTeX generation</span>
                        </div>
                    </div>
                </motion.div>

                {/* ── OUTPUT SECTION ── */}
                <AnimatePresence>
                    {latex && (
                        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                            className="w-full relative group">
                            <div className="absolute -inset-px bg-[#D4AF37]/20 rounded-[2.5rem] blur-xl opacity-10" />
                            <div className="relative rounded-[2.5rem] bg-white/[0.02] border border-white/[0.08] backdrop-blur-3xl overflow-hidden min-h-[600px] flex flex-col">

                                <div className="px-8 py-6 border-b border-white/[0.05] flex items-center justify-between">
                                    <div className="flex bg-white/[0.04] p-1.5 rounded-2xl border border-white/[0.06]">
                                        <button onClick={() => setActiveTab("Preview")}
                                            className={`px-6 py-2 rounded-xl text-[10px] font-bold tracking-widest transition-all ${activeTab === "Preview" ? "bg-white/10 text-[#D4AF37]" : "text-white/30 hover:text-white/50"}`}>PREVIEW</button>
                                        <button onClick={() => setActiveTab("Code")}
                                            className={`px-6 py-2 rounded-xl text-[10px] font-bold tracking-widest transition-all ${activeTab === "Code" ? "bg-white/10 text-[#D4AF37]" : "text-white/30 hover:text-white/50"}`}>SOURCE CODE</button>
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={() => { navigator.clipboard.writeText(latex); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                                            className="p-3 rounded-xl bg-white/[0.04] border border-white/5 text-white/30 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all">
                                            {copied ? <Check size={16} /> : <Clipboard size={16} />}
                                        </button>
                                        <button className="px-5 py-2.5 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-bold tracking-widest hover:bg-[#D4AF37]/20 transition-all flex items-center gap-2">
                                            <Download size={14} /> DOWNLOAD .TEX
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 p-8 overflow-auto">
                                    {activeTab === "Preview" ? (
                                        <div className="w-full h-full rounded-2xl bg-white/5 border border-white/5 p-12 overflow-y-auto">
                                            <div className="max-w-2xl mx-auto font-serif text-white/80 leading-relaxed text-sm whitespace-pre-wrap">
                                                {/* Mocked Preview Rendering */}
                                                {latex}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full h-full rounded-2xl bg-black/40 border border-white/5 p-8 font-mono text-xs text-[#D4AF37]/80 leading-loose overflow-x-auto whitespace-pre">
                                            {latex}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}
