"use client";

import { useDeozaStore } from "@/lib/deoza-store";
import PaperCard from "@/components/deoza/PaperCard";
import Link from "next/link";
import { motion } from "framer-motion";
import { Library, ArrowLeft, BookOpen, Search } from "lucide-react";

export default function LibraryPage() {
    const { savedPapers, removePaper } = useDeozaStore();

    return (
        <main className="min-h-screen bg-[#02080f] relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-900/15 rounded-full blur-[200px] -z-0 animate-pulse" />

            {/* Header */}
            <div className="relative z-10 border-b border-white/5 bg-[#02080f]/80 backdrop-blur-sm">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/deoza" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
                        <ArrowLeft size={18} />
                        DEOZA
                    </Link>
                    <div className="flex items-center gap-2 text-emerald-400">
                        <Library size={18} />
                        <span className="font-bold text-sm tracking-wide">Research Library</span>
                    </div>
                    <Link
                        href="/deoza"
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/20 transition-all"
                    >
                        <Search size={12} />
                        New Search
                    </Link>
                </div>
            </div>

            {/* Body */}
            <div className="relative z-10 max-w-5xl mx-auto px-6 py-10">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-1">My Library</h1>
                        <p className="text-gray-500 text-sm">
                            {savedPapers.length} saved paper{savedPapers.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>

                {savedPapers.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-24 gap-6 text-center"
                    >
                        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5">
                            <BookOpen size={52} className="text-gray-700 mx-auto" />
                        </div>
                        <div>
                            <p className="text-gray-400 font-medium mb-2">Your library is empty</p>
                            <p className="text-gray-600 text-sm">Save papers from search results to access them here</p>
                        </div>
                        <Link
                            href="/deoza"
                            className="flex items-center gap-2 px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-300 font-semibold hover:bg-emerald-500/20 transition-all"
                        >
                            <Search size={16} />
                            Start Searching
                        </Link>
                    </motion.div>
                ) : (
                    <div className="grid gap-4">
                        {savedPapers.map((paper, i) => (
                            <PaperCard key={paper.id} paper={paper} index={i} />
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
