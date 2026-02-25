"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { parsePdf, parseDocx, parseTxt, fileToBase64 } from "@/lib/file-processing";
import {
    Clipboard, ClipboardPaste, Check, Upload, FileText, X,
    Mic, StopCircle, Home as HomeIcon, Volume2, RefreshCw,
    ChevronDown, Activity, Settings,
} from "lucide-react";
import ExportDropdown from "@/components/ExportDropdown";
import UnifiedHistorySidebar, { addSenticHistory } from "@/components/UnifiedHistorySidebar";
import { useHistoryPanel } from "@/lib/history-store";

// ─── Types ───────────────────────────────────────────────────────────────────
type EntropyLevel = "Low" | "Medium" | "High" | "Max";
type Audience = "Student" | "Professional" | "General Reader" | "Expert";

interface TextProcessingSettings {
    removeUnicode: boolean;
    dashesToCommas: boolean;
    removeDashes: boolean;
    transformQuotes: boolean;
    removeWhitespace: boolean;
    removeEmDash: boolean;
}

interface HumanizeOutput {
    humanizedText: string;
    analysis: { intent: string; tone: string; audience: string; formality: string } | null;
    explainability: {
        intentPreservation: string;
        toneAdjustments: string;
        stylisticChanges: string;
        humanizationTechniques: string;
    } | null;
}

// ─── Text processing functions ───────────────────────────────────────────────
function applyTextProcessing(text: string, settings: TextProcessingSettings): string {
    let out = text;
    if (settings.removeUnicode) out = out.replace(/[^\x00-\x7F]/g, " ");
    if (settings.dashesToCommas) out = out.replace(/\s*[-–]\s*/g, ", ");
    if (settings.removeDashes) out = out.replace(/[-–—]/g, " ");
    if (settings.removeEmDash) out = out.replace(/—/g, " ");
    if (settings.transformQuotes) out = out.replace(/[""'']/g, '"');
    if (settings.removeWhitespace) out = out.replace(/\s{2,}/g, " ").trim();
    return out;
}

// ─── Banned AI-isms (for client-side AI score) ───────────────────────────────
const BANNED = [
    "comprehensive", "foster", "delve", "tap into", "multifaceted", "underscores",
    "underscore", "testament", "realm", "pivotal", "intricate", "democratize",
    "game-changer", "unleash", "leverage", "holistic", "furthermore", "moreover",
    "in addition", "additionally",
];

// ─── AI Score Estimator ──────────────────────────────────────────────────────
function estimateAiScore(text: string): { level: "low" | "medium" | "high"; score: number; detail: string } {
    if (!text.trim()) return { level: "low", score: 0, detail: "No output yet" };
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 4);
    if (sentences.length < 2) return { level: "medium", score: 50, detail: "Too short to analyse" };
    const lengths = sentences.map(s => s.trim().split(/\s+/).length);
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((s, l) => s + Math.pow(l - mean, 2), 0) / lengths.length;
    const cv = Math.sqrt(variance) / mean;
    const lower = text.toLowerCase();
    const hits = BANNED.filter(w => lower.includes(w)).length;
    const richness = Math.min((text.match(/—/g) || []).length + (text.match(/\(/g) || []).length + (text.match(/;/g) || []).length, 6);
    let score = 100;
    score -= Math.min(cv * 60, 50);
    score += hits * 12;
    score -= richness * 6;
    score = Math.max(0, Math.min(100, Math.round(score)));
    const level = score < 35 ? "low" : score < 65 ? "medium" : "high";
    const detail = [
        `Burstiness CV: ${cv.toFixed(2)}`,
        hits > 0 ? `⚠ ${hits} AI-ism(s)` : "✓ No banned words",
        `Punctuation richness: ${richness}`,
    ].join(" · ");
    return { level, score, detail };
}

// ─── AI Score Badge ──────────────────────────────────────────────────────────
function AiScoreBadge({ text }: { text: string }) {
    const { level, score, detail } = useMemo(() => estimateAiScore(text), [text]);
    const colours: Record<string, string> = {
        low: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-300",
        medium: "from-amber-500/20  to-amber-600/10  border-amber-500/30  text-amber-300",
        high: "from-red-500/20    to-red-600/10    border-red-500/30    text-red-300",
    };
    const icons = { low: "🟢", medium: "🟡", high: "🔴" };
    const labels = { low: "Low AI Signal", medium: "Medium AI Signal", high: "High AI Signal" };
    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`w-full rounded-2xl bg-gradient-to-br ${colours[level]} border backdrop-blur-xl p-4`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Activity size={13} className="opacity-70" />
                    <span className="text-[9px] font-bold tracking-[0.4em] uppercase opacity-60">AI Score Estimator</span>
                </div>
                <span className="text-sm font-bold font-mono">{icons[level]} {labels[level]}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden mb-2">
                <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full ${level === "low" ? "bg-emerald-400" : level === "medium" ? "bg-amber-400" : "bg-red-400"}`} />
            </div>
            <p className="text-[10px] opacity-60 font-mono">{detail}</p>
        </motion.div>
    );
}

// ─── Glass dropdown ──────────────────────────────────────────────────────────
interface GlassSelectProps<T extends string> {
    label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[];
}
function GlassSelect<T extends string>({ label, value, onChange, options }: GlassSelectProps<T>) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);
    const current = options.find(o => o.value === value)?.label ?? value;
    return (
        <div ref={ref} className="relative flex-1 min-w-0">
            <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-purple-400/50 mb-1.5 pl-1">{label}</p>
            <button onClick={() => setOpen(p => !p)}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-purple-500/30 hover:bg-white/[0.07] backdrop-blur-md transition-all duration-200">
                <span className="text-sm text-white/80 font-medium">{current}</span>
                <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-purple-400/60">
                    <ChevronDown size={14} />
                </motion.span>
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.15 }}
                        className="absolute top-full mt-2 left-0 right-0 z-50 rounded-2xl bg-[#0e0616]/90 border border-purple-500/20 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden">
                        {options.map(opt => (
                            <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }}
                                className={`w-full text-left px-4 py-3 text-sm transition-all duration-150 ${opt.value === value ? "text-purple-300 bg-purple-500/15 font-semibold" : "text-gray-300 hover:bg-white/[0.06] hover:text-white"}`}>
                                {opt.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Toggle row ───────────────────────────────────────────────────────────────
function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0">
            <span className="text-sm text-white/70">{label}</span>
            <button onClick={() => onChange(!value)}
                className={`relative w-11 h-6 rounded-full transition-all duration-300 ${value ? "bg-emerald-500" : "bg-white/10"}`}>
                <motion.span animate={{ x: value ? 20 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md block" />
            </button>
        </div>
    );
}

// ─── Text Processing Settings Modal ──────────────────────────────────────────
function TextSettingsModal({ settings, onChange, onClose }: {
    settings: TextProcessingSettings;
    onChange: (s: TextProcessingSettings) => void;
    onClose: () => void;
}) {
    const set = (key: keyof TextProcessingSettings) => (v: boolean) => onChange({ ...settings, [key]: v });
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
            onClick={onClose}>
            <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="relative bg-[#0e0616]/95 border border-purple-500/25 p-7 rounded-3xl w-full max-w-sm shadow-2xl shadow-black/60 backdrop-blur-2xl">
                <button onClick={onClose} className="absolute top-5 right-5 text-gray-500 hover:text-white transition-colors"><X size={16} /></button>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                        <Settings size={18} className="text-purple-300" />
                    </div>
                    <h3 className="text-base font-bold text-white tracking-wide">Text Processing Settings</h3>
                </div>
                <div className="divide-y divide-white/[0.05]">
                    <ToggleRow label="Remove hidden unicode characters" value={settings.removeUnicode} onChange={set("removeUnicode")} />
                    <ToggleRow label="Turn dashes into commas" value={settings.dashesToCommas} onChange={set("dashesToCommas")} />
                    <ToggleRow label="Remove dashes completely" value={settings.removeDashes} onChange={set("removeDashes")} />
                    <ToggleRow label="Transform quotes" value={settings.transformQuotes} onChange={set("transformQuotes")} />
                    <ToggleRow label="Remove persistent whitespace" value={settings.removeWhitespace} onChange={set("removeWhitespace")} />
                    <ToggleRow label="Remove Em-dash" value={settings.removeEmDash} onChange={set("removeEmDash")} />
                </div>
                <button onClick={onClose}
                    className="mt-6 w-full py-3 rounded-2xl bg-white/[0.05] border border-white/10 hover:bg-white/[0.09] text-white/70 hover:text-white text-sm font-medium transition-all">
                    Close
                </button>
            </motion.div>
        </motion.div>
    );
}

// ─── Neural background lines ─────────────────────────────────────────────────
function NeuralLines() {
    return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.04]" viewBox="0 0 900 500" preserveAspectRatio="xMidYMid slice">
            {["M100,150 Q350,80 600,180 T900,130", "M50,280 Q300,200 550,300 T900,260", "M150,400 Q400,310 650,380"].map((d, i) => (
                <motion.path key={i} d={d} stroke="#a855f7" strokeWidth="1" fill="none"
                    initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 3 + i * 0.5, delay: i * 0.4 }} />
            ))}
        </svg>
    );
}

// ─── Pill button ──────────────────────────────────────────────────────────────
function PillBtn({ onClick, active, label, icon, activeClass = "text-red-400 border-red-500/40 bg-red-500/10" }: {
    onClick: () => void; active?: boolean; label: string; icon: React.ReactNode; activeClass?: string;
}) {
    return (
        <button onClick={onClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border text-[11px] font-semibold tracking-wide transition-all duration-200
                ${active ? activeClass + " animate-pulse" : "bg-white/[0.05] border-white/10 text-white/60 hover:bg-white/[0.1] hover:border-purple-500/30 hover:text-white"}`}>
            {icon} {label}
        </button>
    );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({ words, chars }: { words: number; chars: number }) {
    return (
        <div className="absolute bottom-3 right-3 flex gap-1.5 pointer-events-none z-10">
            <span className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-[9px] text-gray-500 tracking-widest font-mono">{words}w</span>
            <span className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-[9px] text-gray-500 tracking-widest font-mono">{chars}c</span>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SenticPage() {
    const [text, setText] = useState("");
    const [audience, setAudience] = useState<Audience>("General Reader");
    const [entropy, setEntropy] = useState<EntropyLevel>("High");
    const [showSettings, setShowSettings] = useState(false);
    const [settings, setSettings] = useState<TextProcessingSettings>({
        removeUnicode: false,
        dashesToCommas: false,
        removeDashes: false,
        transformQuotes: false,
        removeWhitespace: false,
        removeEmDash: false,
    });

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<HumanizeOutput | null>(null);
    const [displayedText, setDisplayedText] = useState("");
    const [copied, setCopied] = useState(false);
    const [expandSummary, setExpandSummary] = useState(false);
    const [expandAnalysis, setExpandAnalysis] = useState(false);
    const [showSummarizeModal, setShowSummarizeModal] = useState(false);
    const [processedFileText, setProcessedFileText] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const { close: closeHistory } = useHistoryPanel();
    const recognitionRef = useRef<any>(null);

    // Recompute displayed text whenever result or settings change
    useEffect(() => {
        if (result?.humanizedText) {
            setDisplayedText(applyTextProcessing(result.humanizedText, settings));
        }
    }, [result, settings]);

    useEffect(() => {
        if (typeof window !== "undefined" && (window as any).webkitSpeechRecognition) {
            const SR = (window as any).webkitSpeechRecognition;
            const rec = new SR();
            rec.continuous = true;
            rec.interimResults = true;
            rec.onresult = (e: any) => {
                let final = "";
                for (let i = e.resultIndex; i < e.results.length; ++i)
                    if (e.results[i].isFinal) final += e.results[i][0].transcript;
                if (final) setText(p => p + (p ? " " : "") + final);
            };
            rec.onerror = (e: any) => { console.error(e.error); setIsRecording(false); };
            rec.onend = () => setIsRecording(false);
            recognitionRef.current = rec;
        }
        return () => { if (typeof window !== "undefined") window.speechSynthesis.cancel(); };
    }, []);

    const toggleRecording = () => {
        if (!recognitionRef.current) { alert("Speech recognition not supported. Try Chrome."); return; }
        if (isRecording) { recognitionRef.current.stop(); setIsRecording(false); }
        else { recognitionRef.current.start(); setIsRecording(true); }
    };

    const toggleTTS = () => {
        if (typeof window === "undefined") return;
        if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); }
        else if (displayedText) {
            const u = new SpeechSynthesisUtterance(displayedText);
            u.onend = () => setIsSpeaking(false);
            u.onerror = () => setIsSpeaking(false);
            setIsSpeaking(true);
            window.speechSynthesis.speak(u);
        }
    };

    async function handleHumanize(mode: "humanize" | "summarize" = "humanize") {
        const src = mode === "summarize" ? processedFileText : text;
        if (!src.trim()) return;
        setLoading(true);
        setShowSummarizeModal(false);
        try {
            const body = mode === "summarize"
                ? { text: src, mode: "summarize" }
                : { text: src, audience, formality: entropy, mode: "humanize" };

            const r = await fetch("/api/humanize", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const d = await r.json();
            if (d.error) throw new Error(d.error);

            const out: HumanizeOutput = {
                humanizedText: d.humanizedText,
                analysis: d.analysis ?? null,
                explainability: d.explainability ?? null,
            };
            setResult(out);
            addSenticHistory(src, d.humanizedText);
        } catch (err: unknown) {
            alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setLoading(false);
            if (mode === "summarize") setText(processedFileText);
        }
    }

    const handlePaste = async () => {
        try { setText(await navigator.clipboard.readText()); } catch (e) { console.error(e); }
    };

    const handleCopy = async () => {
        if (!displayedText) return;
        try { await navigator.clipboard.writeText(displayedText); setCopied(true); setTimeout(() => setCopied(false), 2000); }
        catch (e) { console.error(e); }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        try {
            let extracted = "";
            if (file.type === "application/pdf") extracted = await parsePdf(file);
            else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") extracted = await parseDocx(file);
            else if (file.type === "text/plain") extracted = await parseTxt(file);
            else if (file.type.startsWith("image/")) {
                const b64 = await fileToBase64(file);
                const r = await fetch("/api/humanize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "extract_image", imageData: b64, mimeType: file.type }) });
                const d = await r.json();
                if (d.error) throw new Error(d.error);
                extracted = d.text;
            } else throw new Error("Unsupported file type");
            setProcessedFileText(extracted);
            setText(extracted);
            setShowSummarizeModal(true);
        } catch (err: unknown) {
            alert(`Failed to process file: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const wc = (v: string) => v.trim() ? v.trim().split(/\s+/).length : 0;
    const cc = (v: string) => v.length;

    const activeSettingsCount = Object.values(settings).filter(Boolean).length;

    const audienceOpts: { value: Audience; label: string }[] = [
        { value: "General Reader", label: "General Reader" },
        { value: "Student", label: "Student" },
        { value: "Professional", label: "Professional" },
        { value: "Expert", label: "Expert" },
    ];
    const entropyOpts: { value: EntropyLevel; label: string }[] = [
        { value: "Low", label: "Low — Minimal" },
        { value: "Medium", label: "Medium — Balanced" },
        { value: "High", label: "High — Strong" },
        { value: "Max", label: "Max — Aggressive" },
    ];

    return (
        <main className="min-h-screen flex flex-col items-center relative overflow-hidden bg-[#05010d] selection:bg-purple-500/30">

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes breathe { 0%,100%{opacity:.25} 50%{opacity:.6} }
                .breathe { animation: breathe 7s ease-in-out infinite; }
                @keyframes sweep { 0%{transform:translateX(-100%);opacity:0} 40%{opacity:1} 100%{transform:translateX(200%);opacity:0} }
                .sweep { animation: sweep 1.8s ease-in-out infinite; }
                @keyframes dotpulse { 0%,80%,100%{transform:scale(0.6);opacity:.3} 40%{transform:scale(1);opacity:1} }
                .dot1{animation:dotpulse 1.2s ease-in-out infinite}
                .dot2{animation:dotpulse 1.2s ease-in-out .2s infinite}
                .dot3{animation:dotpulse 1.2s ease-in-out .4s infinite}
                @keyframes ctapulse { 0%,100%{box-shadow:0 0 20px rgba(147,51,234,.35)} 50%{box-shadow:0 0 38px rgba(147,51,234,.6)} }
                .cta-idle { animation: ctapulse 3s ease-in-out infinite; }
            ` }} />

            <div className="fixed inset-0 bg-[#05010d] -z-50" />
            <div className="fixed top-[-25%] left-[-10%] w-[900px] h-[900px] bg-purple-600/30 rounded-full blur-[200px] -z-40 breathe pointer-events-none" />
            <div className="fixed bottom-[-25%] right-[-10%] w-[900px] h-[900px] bg-indigo-600/30 rounded-full blur-[200px] -z-40 breathe pointer-events-none" style={{ animationDelay: "1s" }} />

            <UnifiedHistorySidebar
                tool="sentic"
                onSenticSelect={(item) => {
                    setText(item.original);
                    setResult({ humanizedText: item.humanized, analysis: null, explainability: null });
                    closeHistory();
                }}
            />

            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                onClick={() => { if (confirm("Reset workspace?")) window.location.reload(); }}
                className="fixed top-6 right-6 z-50 p-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/40 hover:text-purple-300 backdrop-blur-md transition-all"
                title="Reset">
                <HomeIcon size={18} />
            </motion.button>

            {/* File Modal */}
            <AnimatePresence>
                {showSummarizeModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
                            className="relative bg-[#0e0616]/90 border border-purple-500/25 p-10 rounded-3xl max-w-sm w-full shadow-2xl">
                            <button onClick={() => setShowSummarizeModal(false)} className="absolute top-5 right-5 text-gray-500 hover:text-white transition-colors"><X size={18} /></button>
                            <div className="flex justify-center mb-6">
                                <div className="p-5 bg-purple-500/10 border border-purple-500/20 rounded-full">
                                    <FileText size={40} className="text-purple-300" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-center text-white font-orbitron tracking-wider mb-2">File Processed</h3>
                            <p className="text-center text-gray-500 text-sm mb-8 leading-relaxed">Text extracted. Proceed with summarization or edit manually.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setShowSummarizeModal(false)}
                                    className="flex-1 py-3 rounded-2xl border border-white/10 hover:bg-white/[0.06] text-white/60 hover:text-white text-sm font-medium transition-all">
                                    Manual Edit
                                </button>
                                <button onClick={() => handleHumanize("summarize")}
                                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-sm shadow-lg shadow-purple-900/30 transition-all font-orbitron tracking-wider">
                                    Summarize
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Text Processing Settings Modal */}
            <AnimatePresence>
                {showSettings && (
                    <TextSettingsModal
                        settings={settings}
                        onChange={setSettings}
                        onClose={() => setShowSettings(false)}
                    />
                )}
            </AnimatePresence>

            {/* ── HERO ── */}
            <section className="relative w-full flex flex-col items-center pt-6 pb-3 px-6 text-center overflow-hidden">
                <NeuralLines />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[220px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
                    className="mb-3 px-4 py-1 rounded-full border border-purple-500/20 bg-purple-500/5 text-[9px] font-bold tracking-[0.4em] uppercase text-purple-400/60">
                    Linguistic Entropy Engine
                </motion.div>
                <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1, duration: 0.7 }}
                    className="text-[clamp(2.5rem,7vw,4.5rem)] font-bold bg-clip-text text-transparent bg-gradient-to-br from-white via-purple-200 to-purple-400 tracking-[0.18em] font-orbitron leading-none drop-shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                    SENTIC
                </motion.h1>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
                    className="mt-2 text-base font-bold tracking-[0.25em] uppercase text-purple-300/50">
                    AI Text Humanization Engine
                </motion.p>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
                    className="mt-3 text-sm font-extralight tracking-[0.18em] text-white/30 breathe">
                    Perplexity · Burstiness · Linguistic Entropy
                </motion.p>
            </section>

            {/* ── MAIN ── */}
            <div className="w-full max-w-2xl px-4 pb-6 flex flex-col items-center gap-3 z-10">

                {/* Input panel */}
                <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.7 }}
                    className="w-full relative group">
                    <div className="absolute -inset-px bg-gradient-to-r from-purple-600/70 to-indigo-600/70 rounded-3xl blur-md opacity-20 group-hover:opacity-40 transition duration-700" />
                    <div className="relative rounded-3xl bg-white/[0.03] border border-white/[0.07] backdrop-blur-xl shadow-2xl overflow-hidden">
                        <div className="px-5 pt-4 pb-2 border-b border-white/[0.05] flex items-center justify-between">
                            <span className="text-[9px] font-bold tracking-[0.4em] uppercase text-purple-400/50">Input</span>
                            <div className="flex gap-2">
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".txt,.pdf,.docx,image/*" />
                                <PillBtn onClick={toggleRecording} active={isRecording} label={isRecording ? "Stop" : "Voice"} icon={isRecording ? <StopCircle size={12} /> : <Mic size={12} />} />
                                <PillBtn onClick={() => fileInputRef.current?.click()} label="Upload" icon={<Upload size={12} />} />
                                <PillBtn onClick={handlePaste} label="Paste" icon={<ClipboardPaste size={12} />} />
                            </div>
                        </div>
                        <div className="relative">
                            {loading && (
                                <div className="absolute inset-0 z-20 overflow-hidden pointer-events-none">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent sweep" />
                                </div>
                            )}
                            <AnimatePresence>
                                {!text && !loading && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 px-8 pb-8">
                                        <span className="text-2xl font-extralight tracking-wider text-white/15 text-center leading-relaxed">
                                            Paste your AI-generated text here…
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <textarea
                                className="w-full h-44 p-4 bg-transparent text-white/90 focus:outline-none text-sm leading-6 placeholder-transparent resize-none scrollbar-hide"
                                value={text}
                                onChange={e => setText(e.target.value)}
                            />
                            <StatPill words={wc(text)} chars={cc(text)} />
                        </div>
                    </div>
                </motion.div>

                {/* Controls row — no Persona, just Audience + Entropy + Settings */}
                <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                    className="w-full flex gap-3 items-end">
                    <GlassSelect label="Audience" value={audience} onChange={setAudience} options={audienceOpts} />
                    <GlassSelect label="Entropy Level" value={entropy} onChange={setEntropy} options={entropyOpts} />
                    {/* Settings button */}
                    <div className="flex-shrink-0">
                        <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-purple-400/50 mb-1.5 pl-1">Settings</p>
                        <button onClick={() => setShowSettings(true)}
                            className="relative flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-purple-500/30 hover:bg-white/[0.07] backdrop-blur-md transition-all duration-200">
                            <Settings size={15} className="text-purple-400/60" />
                            <span className="text-sm text-white/70 font-medium whitespace-nowrap">Text Settings</span>
                            {activeSettingsCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-purple-500 text-white text-[10px] font-bold flex items-center justify-center">
                                    {activeSettingsCount}
                                </span>
                            )}
                        </button>
                    </div>
                </motion.div>

                {/* Entropy descriptor */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="w-full px-1">
                    <p className="text-[10px] text-purple-400/40 tracking-widest font-mono">
                        {entropy === "Low" && "↳ Temperature 0.75 · Subtle restructuring · Safe for academic tone"}
                        {entropy === "Medium" && "↳ Temperature 0.88 · Balanced burstiness · Good general use"}
                        {entropy === "High" && "↳ Temperature 0.95 · Aggressive variance · Strong anti-detection"}
                        {entropy === "Max" && "↳ Temperature 1.02 · Maximum unpredictability · Use with care"}
                    </p>
                </motion.div>

                {/* CTA */}
                <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
                    className="w-full flex flex-col items-center gap-2">
                    <motion.button
                        whileHover={{ y: -2, boxShadow: "0 0 50px rgba(147,51,234,.65)" }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleHumanize("humanize")}
                        disabled={loading}
                        className="relative w-full py-4 rounded-2xl font-orbitron font-bold tracking-widest text-base text-white overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed cta-idle transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-800 via-purple-600 to-indigo-700" />
                        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                        <span className="relative flex items-center justify-center gap-3">
                            {loading ? (
                                <>
                                    <span className="text-sm font-semibold tracking-widest text-purple-200">Processing</span>
                                    <span className="flex gap-1.5 items-center">
                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-300 dot1" />
                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-300 dot2" />
                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-300 dot3" />
                                    </span>
                                </>
                            ) : "Humanize Text"}
                        </span>
                    </motion.button>
                    <p className="text-[10px] text-white/15 tracking-widest text-center">
                        2-stage pipeline · Groq Linguistic Entropy → BERT Pragmatic Markers
                    </p>
                </motion.div>

                {/* Results */}
                <AnimatePresence>
                    {result && (
                        <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 12, opacity: 0 }}
                            transition={{ duration: 0.5 }} className="w-full flex flex-col gap-3">

                            {/* Output panel */}
                            <div className="relative group">
                                <div className="absolute -inset-px bg-gradient-to-r from-purple-600/60 to-indigo-600/60 rounded-3xl blur-md opacity-20 group-hover:opacity-35 transition duration-700" />
                                <div className="relative rounded-3xl bg-white/[0.03] border border-white/[0.07] backdrop-blur-xl shadow-2xl overflow-hidden">
                                    <div className="px-5 pt-4 pb-2 border-b border-white/[0.05] flex items-center justify-between">
                                        <span className="text-[9px] font-bold tracking-[0.4em] uppercase text-purple-400/50">Humanized Version</span>
                                        <div className="flex gap-2">
                                            <PillBtn onClick={toggleTTS} active={isSpeaking} label={isSpeaking ? "Stop" : "Listen"}
                                                icon={<Volume2 size={12} className={isSpeaking ? "animate-bounce" : ""} />}
                                                activeClass="text-purple-300 border-purple-500/40 bg-purple-500/10" />
                                            <PillBtn onClick={handleCopy} label={copied ? "Copied" : "Copy"}
                                                icon={copied ? <Check size={12} className="text-emerald-400" /> : <Clipboard size={12} />} />
                                            <ExportDropdown text={displayedText} />
                                            <PillBtn onClick={() => handleHumanize("humanize")} label="Retry" icon={<RefreshCw size={12} />} />
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <textarea readOnly
                                            className="w-full min-h-60 p-5 bg-transparent text-white/85 focus:outline-none text-base leading-7 resize-none scrollbar-hide"
                                            value={displayedText}
                                        />
                                        <StatPill words={wc(displayedText)} chars={cc(displayedText)} />
                                    </div>
                                </div>
                            </div>

                            {/* AI Score Estimator */}
                            <AiScoreBadge text={displayedText} />

                            {/* Pipeline Log */}
                            {result.explainability && (
                                <div className="relative rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl overflow-hidden">
                                    <button onClick={() => setExpandSummary(p => !p)}
                                        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.03] transition-colors">
                                        <span className="text-[9px] font-bold tracking-[0.4em] uppercase text-purple-400/50">Pipeline Log</span>
                                        <ChevronDown size={13} className={`text-gray-600 transition-transform ${expandSummary ? "rotate-180" : ""}`} />
                                    </button>
                                    <AnimatePresence>
                                        {expandSummary && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25 }} className="overflow-hidden">
                                                <div className="px-5 pb-5 space-y-3 border-t border-white/[0.05] pt-4">
                                                    {[
                                                        ["Techniques", result.explainability.humanizationTechniques],
                                                        ["Voice", result.explainability.toneAdjustments],
                                                        ["Structural Changes", result.explainability.stylisticChanges],
                                                        ["Semantic Integrity", result.explainability.intentPreservation],
                                                    ].map(([k, v]) => (
                                                        <div key={k}>
                                                            <p className="text-[9px] text-purple-400/40 uppercase tracking-widest mb-0.5">{k}</p>
                                                            <p className="text-sm text-gray-400 leading-relaxed font-mono">{v}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            {/* Entropy Parameters */}
                            {result.analysis && (
                                <div className="relative rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl overflow-hidden">
                                    <button onClick={() => setExpandAnalysis(p => !p)}
                                        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.03] transition-colors">
                                        <span className="text-[9px] font-bold tracking-[0.4em] uppercase text-purple-400/50">Entropy Parameters</span>
                                        <ChevronDown size={13} className={`text-gray-600 transition-transform ${expandAnalysis ? "rotate-180" : ""}`} />
                                    </button>
                                    <AnimatePresence>
                                        {expandAnalysis && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25 }} className="overflow-hidden">
                                                <div className="px-5 pb-5 grid grid-cols-2 gap-3 border-t border-white/[0.05] pt-4">
                                                    {[
                                                        ["Voice", result.analysis.tone],
                                                        ["Audience", result.analysis.audience],
                                                        ["Entropy Level", result.analysis.formality],
                                                        ["Intent", result.analysis.intent],
                                                    ].map(([k, v]) => (
                                                        <div key={k} className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3">
                                                            <p className="text-[9px] text-purple-400/40 uppercase tracking-widest mb-0.5">{k}</p>
                                                            <p className="text-sm text-gray-300 font-medium">{v}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}
