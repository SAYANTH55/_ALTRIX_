"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown, Loader2, AlertCircle } from "lucide-react";

interface AISummaryPanelProps {
    title: string;
    abstract: string;
}

function formatAnalysis(text: string) {
    const sections = text.split(/\n(?=\d+\.)/).filter(Boolean);
    return sections.length > 1 ? sections : [text];
}

export default function AISummaryPanel({ title, abstract }: AISummaryPanelProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalysis = async () => {
        if (analysis) { setIsOpen(true); return; }
        setLoading(true);
        setError(null);
        setIsOpen(true);
        try {
            const res = await fetch("/api/deoza/summarize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, abstract }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setAnalysis(data.analysis);
        } catch (err: any) {
            setError(err.message || "Failed to generate analysis");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white/[0.03] border border-emerald-500/20 rounded-2xl overflow-hidden">
            <button
                onClick={() => isOpen ? setIsOpen(false) : fetchAnalysis()}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-emerald-500/5 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                        <Sparkles size={18} className="text-emerald-400" />
                    </div>
                    <div className="text-left">
                        <p className="text-white font-semibold text-sm">AI Research Analysis</p>
                        <p className="text-gray-500 text-xs">7-point structured analysis by DEOZA</p>
                    </div>
                </div>
                <ChevronDown
                    size={18}
                    className={`text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden border-t border-emerald-500/10"
                    >
                        <div className="p-6">
                            {loading && (
                                <div className="flex items-center gap-3 text-emerald-400">
                                    <Loader2 size={18} className="animate-spin" />
                                    <span className="text-sm">DEOZA is analyzing the paper...</span>
                                </div>
                            )}

                            {error && (
                                <div className="flex items-center gap-3 text-red-400 bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                                    <AlertCircle size={18} />
                                    <span className="text-sm">{error}</span>
                                </div>
                            )}

                            {analysis && (
                                <div className="space-y-4">
                                    {formatAnalysis(analysis).map((section, i) => {
                                        const lines = section.trim().split("\n");
                                        const heading = lines[0];
                                        const body = lines.slice(1).join("\n").trim();
                                        return (
                                            <div key={i} className="border-l-2 border-emerald-500/30 pl-4">
                                                <p className="text-emerald-300 font-semibold text-sm mb-1">{heading}</p>
                                                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{body || heading}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
