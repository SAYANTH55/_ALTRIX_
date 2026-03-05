"use client";

import { useSearchParams, useParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Calendar, Users, BookmarkPlus, BookmarkCheck, FileText } from "lucide-react";
import { useDeozaStore, UnifiedPaper } from "@/lib/deoza-store";
import AISummaryPanel from "@/components/deoza/AISummaryPanel";
import ChatPanel from "@/components/deoza/ChatPanel";
import FieldInsightPanel from "@/components/deoza/FieldInsightPanel";

function PaperDetailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [paper, setPaper] = useState<UnifiedPaper | null>(null);
    const { addPaper, removePaper, isSaved } = useDeozaStore();

    useEffect(() => {
        const dataStr = searchParams.get("data");
        if (dataStr) {
            try {
                setPaper(JSON.parse(dataStr));
            } catch (e) {
                console.error("Failed to parse paper data");
            }
        }
    }, [searchParams]);

    if (!paper) return null;

    const saved = isSaved(paper.id);

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header Navigation */}
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium tracking-wide">Back to search</span>
                </button>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => saved ? removePaper(paper.id) : addPaper(paper)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all border ${saved
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                            }`}
                    >
                        {saved ? <BookmarkCheck size={18} /> : <BookmarkPlus size={18} />}
                        <span className="text-sm font-semibold">{saved ? "Saved to Library" : "Save Paper"}</span>
                    </button>

                    <a
                        href={paper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <ExternalLink size={18} />
                    </a>
                </div>
            </div>

            {/* Title Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
            >
                <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border tracking-[0.2em] uppercase ${paper.source === "semantic"
                            ? "border-purple-500/40 text-purple-300 bg-purple-500/10"
                            : paper.source === "arxiv"
                                ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
                                : "border-blue-500/40 text-blue-300 bg-blue-500/10"
                        }`}>
                        {paper.source}
                    </span>
                    {paper.openAccess && (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-green-500/30 text-green-400 bg-green-500/5 tracking-[0.2em] uppercase">
                            Open Access
                        </span>
                    )}
                </div>

                <h1 className="text-4xl font-bold text-white leading-tight">
                    {paper.title}
                </h1>

                <div className="flex flex-wrap gap-6 pt-2 text-gray-400">
                    <div className="flex items-center gap-2">
                        <Users size={16} className="text-emerald-400/70" />
                        <span className="text-sm">{paper.authors.join(", ")}</span>
                    </div>
                    {paper.year && (
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-emerald-400/70" />
                            <span className="text-sm">{paper.year}</span>
                        </div>
                    )}
                    {paper.citations !== null && (
                        <div className="flex items-center gap-2 text-amber-400/80">
                            <span className="text-sm font-semibold">★ {paper.citations.toLocaleString()} citations</span>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Abstract Section */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold font-orbitron text-white tracking-widest uppercase flex items-center gap-2">
                            <div className="w-1 h-4 bg-emerald-500" />
                            Abstract
                        </h2>
                        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8">
                            <p className="text-gray-300 text-base leading-relaxed whitespace-pre-line font-light">
                                {paper.abstract || "No abstract available for this paper."}
                            </p>
                        </div>
                    </div>

                    {/* AI Research Chat */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold font-orbitron text-white tracking-widest uppercase flex items-center gap-2">
                            <div className="w-1 h-4 bg-blue-500" />
                            Research Chat
                        </h2>
                        <ChatPanel title={paper.title} abstract={paper.abstract} />
                    </div>
                </div>

                {/* Sidebar Intelligence */}
                <div className="space-y-6">
                    <div className="sticky top-6 space-y-6">
                        {/* PDF Link */}
                        {paper.pdf && (
                            <a
                                href={paper.pdf}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-emerald-500 text-black font-bold text-sm tracking-widest uppercase hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                            >
                                <FileText size={18} />
                                Download Full PDF
                            </a>
                        )}

                        {/* Analysis Panel */}
                        <AISummaryPanel title={paper.title} abstract={paper.abstract} />

                        {/* Field Intelligence */}
                        <FieldInsightPanel query={paper.title} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PaperDetailPage() {
    return (
        <main className="min-h-screen p-8 lg:p-12 bg-[#02080f]">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-1/4 -right-[10%] w-[800px] h-[800px] bg-emerald-950/20 rounded-full blur-[150px]" />
                <div className="absolute -bottom-[10%] -left-[10%] w-[600px] h-[600px] bg-blue-950/15 rounded-full blur-[120px]" />
            </div>

            <Suspense fallback={
                <div className="flex items-center justify-center py-40">
                    <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                </div>
            }>
                <PaperDetailContent />
            </Suspense>
        </main>
    );
}
