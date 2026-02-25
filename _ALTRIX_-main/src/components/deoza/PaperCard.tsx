"use client";

import { motion } from "framer-motion";
import { ExternalLink, BookmarkPlus, BookmarkCheck, Cpu, Sparkles, FileText } from "lucide-react";
import { useDeozaStore, UnifiedPaper } from "@/lib/deoza-store";
import { useRouter } from "next/navigation";

interface PaperCardProps {
    paper: UnifiedPaper;
    index?: number;
}

export default function PaperCard({ paper, index = 0 }: PaperCardProps) {
    const { addPaper, removePaper, isSaved } = useDeozaStore();
    const saved = isSaved(paper.id);
    const router = useRouter();

    const handleSave = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (saved) removePaper(paper.id);
        else addPaper(paper);
    };

    const handleAI = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Encode paper data in search params for detail page
        const params = new URLSearchParams({
            id: paper.id,
            data: JSON.stringify(paper),
        });
        router.push(`/deoza/paper/${encodeURIComponent(paper.id)}?${params.toString()}`);
    };

    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.04, duration: 0.4 }}
            whileHover={{ y: -3 }}
            className="group relative"
        >
            {/* Hover glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600/0 to-teal-600/0 group-hover:from-emerald-600/20 group-hover:to-teal-600/20 rounded-2xl blur transition-all duration-500" />

            <div className="relative bg-white/[0.03] border border-white/8 group-hover:border-emerald-500/30 rounded-2xl p-6 backdrop-blur-sm transition-all duration-300">
                {/* Header row */}
                <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2 shrink-0">
                        {/* Source badge */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-widest uppercase ${paper.source === "semantic"
                                ? "border-purple-500/40 text-purple-300 bg-purple-500/10"
                                : "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
                            }`}>
                            {paper.source === "semantic" ? "Semantic" : "arXiv"}
                        </span>
                        {paper.openAccess && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-500/30 text-green-400 bg-green-500/5 tracking-widest uppercase">
                                Open
                            </span>
                        )}
                    </div>
                    <button
                        onClick={handleSave}
                        className={`p-1.5 rounded-lg transition-all shrink-0 ${saved ? "text-emerald-400 bg-emerald-500/10" : "text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                            }`}
                        title={saved ? "Remove from library" : "Save to library"}
                    >
                        {saved ? <BookmarkCheck size={16} /> : <BookmarkPlus size={16} />}
                    </button>
                </div>

                {/* Title */}
                <h3 className="text-white font-semibold text-base leading-snug mb-2 line-clamp-2 group-hover:text-emerald-100 transition-colors">
                    {paper.title}
                </h3>

                {/* Authors + Meta */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
                    {paper.authors.length > 0 && (
                        <span className="truncate max-w-[220px]">
                            {paper.authors.slice(0, 3).join(", ")}{paper.authors.length > 3 ? " et al." : ""}
                        </span>
                    )}
                    {paper.year && <span>{paper.year}</span>}
                    {paper.citations !== null && (
                        <span className="text-amber-500/70">⭐ {paper.citations.toLocaleString()} citations</span>
                    )}
                    {paper.field && <span className="text-teal-400/60">{paper.field}</span>}
                </div>

                {/* Abstract preview */}
                {paper.abstract && (
                    <p className="text-gray-400 text-sm leading-relaxed line-clamp-3 mb-4">
                        {paper.abstract}
                    </p>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={handleAI}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold transition-all"
                    >
                        <Sparkles size={13} />
                        AI Summary
                    </button>
                    {paper.pdf && (
                        <a
                            href={paper.pdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 text-xs font-semibold transition-all"
                        >
                            <FileText size={13} />
                            View PDF
                        </a>
                    )}
                    <a
                        href={paper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 text-xs transition-all ml-auto"
                    >
                        <ExternalLink size={12} />
                    </a>
                </div>
            </div>
        </motion.div>
    );
}
