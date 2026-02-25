"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Activity, ChevronDown, Clipboard, Check, Download,
    RefreshCw, Network, Layers, Settings, Maximize2, X,
    ArrowRight, Code, Play
} from "lucide-react";
import mermaid from "mermaid";

// Initialize Mermaid
if (typeof window !== "undefined") {
    mermaid.initialize({
        startOnLoad: false,
        theme: "dark",
        securityLevel: "loose",
        fontFamily: "Inter, sans-serif",
        themeVariables: {
            primaryColor: "#FF2E4D",
            primaryTextColor: "#fff",
            primaryBorderColor: "#FF2E4D",
            lineColor: "#FF2E4D",
            secondaryColor: "#1e0b0e",
            tertiaryColor: "#05010d",
        },
    });
}

// ─── Types ───────────────────────────────────────────────────────────────────
type DiagramType = "Flowchart" | "Mind Map" | "System Diagram" | "Research Map";
type Complexity = "Simple" | "Standard" | "Advanced";
type Direction = "TD" | "LR" | "RL" | "BT";
type OutputMode = "Mermaid" | "Interactive JSON";

// ─── Components ───────────────────────────────────────────────────────────────


function MermaidRenderer({ syntax }: { syntax: string }) {
    const [svg, setSvg] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const render = async () => {
            if (!syntax) return;
            try {
                // Pre-processing syntax to remove common AI hallucination characters
                const cleanSyntax = syntax
                    .replace(/&quot;/g, '"')
                    .replace(/\\n/g, '\n')
                    .trim();

                // Unique ID for each render to avoid conflicts
                const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

                const { svg } = await mermaid.render(id, cleanSyntax);
                setSvg(svg);
                setError(null);
            } catch (err: any) {
                console.error("Mermaid Render Error Detail:", err);
                setError(err.message || "Failed to render diagram. Syntax error detected.");
            }
        };
        render();
    }, [syntax]);

    if (error) return (
        <div className="p-8 w-full max-w-2xl flex flex-col gap-4 border border-red-500/20 rounded-2xl bg-red-500/5">
            <div className="flex items-center gap-3 text-red-400 font-bold">
                <X size={18} />
                <span className="text-sm">Rendering Engine Error</span>
            </div>
            <p className="text-xs text-red-300/70 font-mono leading-relaxed bg-black/20 p-4 rounded-xl">
                {error}
            </p>
            <p className="text-[10px] text-white/30 uppercase tracking-widest mt-2">
                Tip: Try simplifying your request or checking the code tab.
            </p>
        </div>
    );
    return (
        <div ref={containerRef} className="w-full flex justify-center py-4 overflow-auto min-h-[300px]"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SayonPage() {
    const [text, setText] = useState("");
    const [type, setType] = useState<DiagramType>("Flowchart");
    const [direction, setDirection] = useState<Direction>("TD");
    const [complexity, setComplexity] = useState<Complexity>("Standard");
    const [mode, setMode] = useState<OutputMode>("Mermaid");
    const [loading, setLoading] = useState(false);
    const [syntax, setSyntax] = useState("");
    const [copied, setCopied] = useState(false);
    const [advancedMode, setAdvancedMode] = useState(false);
    const [activeTab, setActiveTab] = useState<"Preview" | "Code">("Preview");

    const handleVisualize = async () => {
        if (!text.trim()) return;
        setLoading(true);
        try {
            const res = await fetch("/api/sayon/visualize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, type, direction, complexity }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setSyntax(data.syntax);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (format: "svg" | "png") => {
        // Implementation for download
        console.log(`Downloading as ${format}`);
    };

    return (
        <main className="min-h-screen flex flex-col items-center relative overflow-hidden bg-[#050106] selection:bg-[#FF2E4D]/30">
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes breathe { 0%,100%{opacity:.15} 50%{opacity:.4} }
                .breathe { animation: breathe 8s ease-in-out infinite; }
                @keyframes sweep { 0%{transform:translateX(-100%);opacity:0} 40%{opacity:1} 100%{transform:translateX(200%);opacity:0} }
                .sweep { animation: sweep 2s ease-in-out infinite; }
                @keyframes pulseDot { 0%,80%,100%{transform:scale(0.6);opacity:.3} 40%{transform:scale(1);opacity:1} }
                .dot1{animation:pulseDot 1.2s ease-in-out infinite}
                .dot2{animation:pulseDot 1.2s ease-in-out .2s infinite}
                .dot3{animation:pulseDot 1.2s ease-in-out .4s infinite}
                @keyframes glowPulse { 0%,100%{box-shadow:0 0 20px rgba(255,46,77,.2)} 50%{box-shadow:0 0-40px rgba(255,46,77,.4)} }
                .glow-pulse { animation: glowPulse 4s ease-in-out infinite; }
            ` }} />

            {/* Background elements */}
            <div className="fixed inset-0 bg-[#050106] -z-50" />
            <div className="fixed top-[-20%] left-[-10%] w-[800px] h-[800px] bg-[#FF2E4D]/10 rounded-full blur-[150px] -z-40 breathe pointer-events-none" />
            <div className="fixed bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-[#FF2E4D]/10 rounded-full blur-[150px] -z-40 breathe pointer-events-none" style={{ animationDelay: "2s" }} />

            {/* Neural background lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03]" viewBox="0 0 900 600">
                <motion.path d="M50,100 Q450,300 850,100" stroke="#FF2E4D" strokeWidth="0.5" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 4 }} />
                <motion.path d="M50,500 Q450,200 850,500" stroke="#FF2E4D" strokeWidth="0.5" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 4, delay: 1 }} />
            </svg>

            {/* ── HERO ── */}
            <section className="relative w-full flex flex-col items-center pt-12 pb-6 px-6 text-center">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#FF2E4D]/5 rounded-full blur-[80px] pointer-events-none" />
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
                    className="mb-4 px-4 py-1 rounded-full border border-[#FF2E4D]/20 bg-[#FF2E4D]/5 text-[10px] font-bold tracking-[0.4em] uppercase text-[#FF2E4D]/60 backdrop-blur-md">
                    Visual Intelligence Engine
                </motion.div>
                <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8 }}
                    className="text-7xl md:text-8xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-400 tracking-tight font-orbitron drop-shadow-[0_0_25px_rgba(255,46,77,0.2)]">
                    SAYON
                </motion.h1>
                <motion.div initial={{ width: 0 }} animate={{ width: 120 }} transition={{ delay: 0.5, duration: 1 }}
                    className="h-px bg-gradient-to-r from-transparent via-[#FF2E4D] to-transparent my-4" />
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                    className="text-lg font-light tracking-[0.1em] text-white/40 max-w-lg leading-relaxed">
                    Transform ideas into structured visual clarity. Generate flowcharts and maps from text.
                </motion.p>
            </section>

            {/* ── INTERACTION PANEL ── */}
            <div className="w-full max-w-4xl px-6 pb-20 flex flex-col items-center gap-8 z-10">
                <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.8 }}
                    className="w-full relative group">
                    <div className="absolute -inset-px bg-gradient-to-r from-[#FF2E4D]/40 to-red-900/40 rounded-[2.5rem] blur-lg opacity-20 group-hover:opacity-40 transition duration-700" />
                    <div className="relative rounded-[2rem] bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl shadow-3xl overflow-hidden">

                        {/* Header */}
                        <div className="px-8 py-5 border-b border-white/[0.06] flex items-center justify-between">
                            <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#FF2E4D]/50">INPUT</span>
                            <div className="flex bg-white/[0.04] p-1 rounded-full border border-white/[0.06]">
                                {["Flowchart", "Mind Map", "System Diagram", "Research Map"].map((t) => (
                                    <button key={t} onClick={() => setType(t as DiagramType)}
                                        className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-wider transition-all duration-300
                                            ${type === t ? "bg-[#FF2E4D] text-white shadow-[0_0_15px_rgba(255,46,77,0.4)]" : "text-white/40 hover:text-white/60"}`}>
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Text Area */}
                        <div className="relative">
                            {loading && (
                                <div className="absolute inset-0 z-20 pointer-events-none">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FF2E4D]/10 to-transparent sweep" />
                                </div>
                            )}
                            <textarea
                                className="w-full h-56 p-8 bg-transparent text-white/90 focus:outline-none text-base leading-relaxed placeholder:text-white/10 resize-none font-light selection:bg-[#FF2E4D]/40"
                                placeholder="Describe the process, system, or concept you want visualized..."
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                            />

                            <div className="px-8 pb-8 pt-4">
                                {/* Controls removed as per user request, defaulting to standard settings */}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ADVANCED MODE TOGGLE */}
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold tracking-widest text-white/30 uppercase">Advanced Mode</span>
                    <button onClick={() => setAdvancedMode(!advancedMode)}
                        className={`w-10 h-5 rounded-full relative transition-all duration-300 border ${advancedMode ? "bg-[#FF2E4D]/20 border-[#FF2E4D]/50" : "bg-white/5 border-white/10"}`}>
                        <motion.div animate={{ x: advancedMode ? 22 : 4 }} className={`absolute top-1 w-2.5 h-2.5 rounded-full ${advancedMode ? "bg-[#FF2E4D]" : "bg-white/20"}`} />
                    </button>
                    <AnimatePresence>
                        {advancedMode && (
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                                className="flex gap-4 ml-4">
                                <div className="text-[10px] text-white/40 border border-white/5 px-3 py-1 rounded-full">Nodes: ~15</div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* PRIMARY CTA */}
                <div className="flex flex-col items-center gap-4">
                    <motion.button
                        whileHover={{ y: -3, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleVisualize}
                        disabled={loading || !text.trim()}
                        className="relative px-12 py-5 rounded-2xl font-orbitron font-black tracking-[0.2em] text-sm text-white overflow-hidden disabled:opacity-30 disabled:grayscale transition-all duration-500 glow-pulse group">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#FF2E4D] to-[#8a0f21] group-hover:from-[#ff4d68] group-hover:to-[#b0142b] transition-colors" />
                        <div className="absolute top-0 left-4 right-4 h-px bg-white/20" />
                        <span className="relative flex items-center justify-center gap-3">
                            {loading ? (
                                <>
                                    <span>Structuring</span>
                                    <div className="flex gap-1">
                                        <div className="w-1 h-1 rounded-full bg-white dot1" />
                                        <div className="w-1 h-1 rounded-full bg-white dot2" />
                                        <div className="w-1 h-1 rounded-full bg-white dot3" />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <span>Generate Visualization</span>
                                    <Play size={14} fill="white" className="ml-1" />
                                </>
                            )}
                        </span>
                    </motion.button>
                    <span className="text-[10px] text-white/15 tracking-[0.3em] uppercase">AI-powered structural diagram generation</span>
                </div>

                {/* ── VISUAL OUTPUT ── */}
                <AnimatePresence>
                    {syntax && (
                        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
                            className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">

                            {/* Render Container */}
                            <div className="lg:col-span-8 relative group">
                                <div className="absolute -inset-px bg-[#FF2E4D]/20 rounded-3xl blur opacity-20" />
                                <div className="relative rounded-3xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-3xl min-h-[400px] flex flex-col">
                                    <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between">
                                        <div className="flex bg-white/[0.04] p-1 rounded-xl border border-white/[0.06]">
                                            <button onClick={() => setActiveTab("Preview")} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${activeTab === "Preview" ? "bg-white/10 text-[#FF2E4D]" : "text-white/30"}`}>Preview</button>
                                            <button onClick={() => setActiveTab("Code")} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${activeTab === "Code" ? "bg-white/10 text-[#FF2E4D]" : "text-white/30"}`}>Code</button>
                                        </div>
                                        <Maximize2 size={14} className="text-white/20 hover:text-white cursor-pointer transition-colors" />
                                    </div>

                                    <div className="flex-1 p-8 flex items-center justify-center overflow-auto">
                                        {activeTab === "Preview" ? (
                                            <MermaidRenderer syntax={syntax} />
                                        ) : (
                                            <div className="w-full h-full bg-black/20 p-6 rounded-2xl font-mono text-sm text-[#FF2E4D]/70 whitespace-pre border border-white/5">
                                                {syntax}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Actions / Info */}
                            <div className="lg:col-span-4 flex flex-col gap-4">
                                <div className="relative rounded-3xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-3xl p-6 flex-1">
                                    <h4 className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#FF2E4D]/50 mb-6">OUTPUT ACTIONS</h4>
                                    <div className="flex flex-col gap-3">
                                        <button onClick={() => { navigator.clipboard.writeText(syntax); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                                            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-[#FF2E4D]/30 transition-all group">
                                            <div className="flex items-center gap-3">
                                                <Clipboard size={16} className="text-[#FF2E4D]/60" />
                                                <span className="text-xs font-medium text-white/70">{copied ? "Copied!" : "Copy Mermaid Code"}</span>
                                            </div>
                                            {copied && <Check size={14} className="text-[#FF2E4D]" />}
                                        </button>
                                        <button onClick={() => handleDownload("svg")}
                                            className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-[#FF2E4D]/30 transition-all">
                                            <Download size={16} className="text-[#FF2E4D]/60" />
                                            <span className="text-xs font-medium text-white/70">Download SVG</span>
                                        </button>
                                        <button className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-[#FF2E4D]/30 transition-all">
                                            <Download size={16} className="text-[#FF2E4D]/60" />
                                            <span className="text-xs font-medium text-white/70">Download PNG</span>
                                        </button>
                                        <button onClick={handleVisualize}
                                            className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl bg-[#FF2E4D]/10 border border-[#FF2E4D]/20 hover:border-[#FF2E4D]/50 transition-all text-[#FF2E4D]">
                                            <RefreshCw size={16} />
                                            <span className="text-xs font-bold uppercase tracking-widest">Regenerate</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}
