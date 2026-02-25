"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, ChevronDown, Loader2 } from "lucide-react";

interface FieldInsightPanelProps {
    query: string;
}

export default function FieldInsightPanel({ query }: FieldInsightPanelProps) {
    const [insight, setInsight] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [fetched, setFetched] = useState(false);

    useEffect(() => {
        if (!query) return;
        setInsight(null);
        setFetched(false);
        setExpanded(false);
    }, [query]);

    const fetch_ = async () => {
        if (fetched) { setExpanded(!expanded); return; }
        setLoading(true);
        setExpanded(true);
        try {
            const res = await fetch("/api/deoza/insight", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query }),
            });
            const data = await res.json();
            setInsight(data.insight || null);
            setFetched(true);
        } catch {
            setInsight("Could not load field insight.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full bg-gradient-to-r from-emerald-950/50 to-teal-950/50 border border-emerald-500/20 rounded-2xl overflow-hidden mb-6">
            <button
                onClick={fetch_}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-emerald-500/5 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-emerald-500/15 rounded-lg">
                        <Cpu size={16} className="text-emerald-400" />
                    </div>
                    <div className="text-left">
                        <p className="text-emerald-300 font-bold text-sm tracking-wide">Field Intelligence</p>
                        <p className="text-emerald-500/60 text-xs">DEOZA AI overview of "{query}"</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {!fetched && <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Generate</span>}
                    <ChevronDown size={16} className={`text-emerald-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
                </div>
            </button>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-emerald-500/10"
                    >
                        <div className="p-6">
                            {loading && (
                                <div className="flex items-center gap-3 text-emerald-400">
                                    <Loader2 size={16} className="animate-spin" />
                                    <span className="text-sm">Generating field intelligence...</span>
                                </div>
                            )}
                            {insight && (
                                <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                                    {insight}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
