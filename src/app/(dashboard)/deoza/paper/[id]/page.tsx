"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { UnifiedPaper } from "@/lib/deoza-store";
import { useDeozaStore } from "@/lib/deoza-store";
import AISummaryPanel from "@/components/deoza/AISummaryPanel";
import ChatPanel from "@/components/deoza/ChatPanel";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    ArrowLeft, BookmarkPlus, BookmarkCheck, ExternalLink,
    FileText, Calendar, Star, Globe, Tag
} from "lucide-react";

function PaperDetailInner() {
    const searchParams = useSearchParams();
    const rawData = searchParams.get("data");
    const [paper, setPaper] = useState<UnifiedPaper | null>(null);
    const { addPaper, removePaper, isSaved } = useDeozaStore();

    useEffect(() => {
        if (rawData) {
            try {
                setPaper(JSON.parse(rawData));
            } catch { }
        }
    }, [rawData]);

    if (!paper) {
        return (
            <div className="min-h-screen bg-[#02080f] flex flex-col items-center justify-center text-gray-400 gap-4">
                <p>Paper not found.</p>
                <Link href="/deoza" className="text-emerald-400 hover:underline text-sm">← Back to DEOZA</Link>
            </div>
        );
    }

    const saved = isSaved(paper.id);

    return (
        <main className="min-h-screen bg-[#02080f] relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-900/15 rounded-full blur-[200px] -z-0" />

            {/* Top nav */}
            <div className="relative z-10 border-b border-white/5 bg-[#02080f]/80 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/deoza/search" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
                        <ArrowLeft size={18} />
                        Back to results
                    </Link>
                    <div className="flex items-center gap-3">
                        {paper.pdf && (
                            <a
                                href={paper.pdf}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 text-sm transition-all"
                            >
                                <FileText size={15} />
                                View PDF
                            </a>
                        )}
                        <button
                            onClick={() => saved ? removePaper(paper.id) : addPaper(paper)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${saved
                                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                                    : "bg-white/5 border-white/10 hover:bg-emerald-500/10 hover:border-emerald-500/20 text-gray-300 hover:text-emerald-300"
                                }`}
                        >
                            {saved ? <BookmarkCheck size={15} /> : <BookmarkPlus size={15} />}
                            {saved ? "Saved" : "Save"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-6xl mx-auto px-6 py-10">
                <div className="grid lg:grid-cols-[1fr_420px] gap-8">
                    {/* Left — paper info */}
                    <div>
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="space-y-6"
                        >
                            {/* Source badges */}
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold px-3 py-1 rounded-full border tracking-widest uppercase ${paper.source === "semantic"
                                        ? "border-purple-500/40 text-purple-300 bg-purple-500/10"
                                        : "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
                                    }`}>
                                    {paper.source === "semantic" ? "Semantic Scholar" : "arXiv"}
                                </span>
                                {paper.openAccess && (
                                    <span className="text-xs px-3 py-1 rounded-full border border-green-500/30 text-green-400 bg-green-500/5 uppercase tracking-widest font-bold">
                                        Open Access
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl font-bold text-white leading-tight">
                                {paper.title}
                            </h1>

                            {/* Metadata */}
                            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                                {paper.authors.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <Globe size={14} className="text-gray-600" />
                                        <span>{paper.authors.slice(0, 5).join(", ")}{paper.authors.length > 5 ? " et al." : ""}</span>
                                    </div>
                                )}
                                {paper.year && (
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-gray-600" />
                                        <span>{paper.year}</span>
                                    </div>
                                )}
                                {paper.citations !== null && (
                                    <div className="flex items-center gap-2">
                                        <Star size={14} className="text-amber-500/70" />
                                        <span className="text-amber-400/80">{paper.citations.toLocaleString()} citations</span>
                                    </div>
                                )}
                                {paper.field && (
                                    <div className="flex items-center gap-2">
                                        <Tag size={14} className="text-gray-600" />
                                        <span className="text-teal-400/70">{paper.field}</span>
                                    </div>
                                )}
                            </div>

                            {/* View source link */}
                            <a
                                href={paper.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-400 transition-colors"
                            >
                                <ExternalLink size={14} />
                                View on {paper.source === "semantic" ? "Semantic Scholar" : "arXiv"}
                            </a>

                            {/* Abstract */}
                            <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6">
                                <h2 className="text-white font-bold text-sm uppercase tracking-widest mb-4 text-emerald-400">Abstract</h2>
                                <p className="text-gray-300 leading-relaxed text-sm">{paper.abstract || "No abstract available."}</p>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right — AI panels */}
                    <div className="space-y-4">
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
                            <AISummaryPanel title={paper.title} abstract={paper.abstract} />
                        </motion.div>
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}>
                            <ChatPanel title={paper.title} abstract={paper.abstract} />
                        </motion.div>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default function PaperDetailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#02080f] flex items-center justify-center text-gray-400">
                Loading...
            </div>
        }>
            <PaperDetailInner />
        </Suspense>
    );
}
