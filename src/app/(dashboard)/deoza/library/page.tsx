"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useDeozaStore } from "@/lib/deoza-store";
import PaperCard from "@/components/deoza/PaperCard";
import { Library, ArrowLeft, Trash2, LibraryBig, BookOpen } from "lucide-react";
import Link from "next/link";

export default function DeozaLibraryPage() {
    const { savedPapers, removePaper } = useDeozaStore();

    return (
        <main className="min-h-screen p-8 lg:p-12 bg-[#02080f]">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute -top-[10%] -right-[10%] w-[700px] h-[700px] bg-emerald-950/20 rounded-full blur-[120px]" />
                <div className="absolute -bottom-[10%] -left-[10%] w-[600px] h-[600px] bg-teal-950/10 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-6xl mx-auto space-y-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/5 pb-10">
                    <div className="flex flex-col">
                        <h1 className="text-3xl font-bold font-orbitron text-white tracking-[0.15em] flex items-center gap-4">
                            <span className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
                                <LibraryBig size={28} />
                            </span>
                            RESEARCH LIBRARY
                        </h1>
                        <p className="text-xs text-emerald-400/50 font-bold tracking-[0.3em] uppercase mt-3">
                            {savedPapers.length} Saved Publication{savedPapers.length !== 1 ? "s" : ""}
                        </p>
                    </div>

                    <Link
                        href="/deoza"
                        className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-gray-300 hover:text-white hover:bg-white/10 transition-all font-semibold tracking-wide"
                    >
                        <ArrowLeft size={18} />
                        Discovery Hub
                    </Link>
                </div>

                {/* Library Grid */}
                <section className="space-y-6">
                    {savedPapers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 bg-white/[0.02] border border-white/5 rounded-[2.5rem] text-center">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full scale-150" />
                                <div className="relative p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20">
                                    <BookOpen size={48} className="text-emerald-500/40" />
                                </div>
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2 font-orbitron tracking-wider">Your Library is Empty</h2>
                            <p className="text-gray-500 max-w-xs mx-auto text-sm leading-relaxed mb-8">
                                Save papers from your research searches to build your personal knowledge base and deep-dive with AI later.
                            </p>
                            <Link
                                href="/deoza"
                                className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                            >
                                Start Researching
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <AnimatePresence mode="popLayout">
                                {savedPapers.map((paper, idx) => (
                                    <motion.div
                                        key={paper.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.3 }}
                                        className="relative"
                                    >
                                        <PaperCard paper={paper} index={idx} />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
