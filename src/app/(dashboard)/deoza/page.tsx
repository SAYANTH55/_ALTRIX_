"use client";

import { motion } from "framer-motion";
import SearchBar from "@/components/deoza/SearchBar";
import { useDeozaStore } from "@/lib/deoza-store";
import Link from "next/link";
import { BookOpen, Library, Cpu } from "lucide-react";

export default function DeozaPage() {
    const { savedPapers } = useDeozaStore();

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background */}
            <div className="fixed inset-0 bg-[#02080f] -z-20" />
            <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-emerald-900/25 rounded-full blur-[200px] -z-10 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-900/20 rounded-full blur-[180px] -z-10 animate-pulse delay-1000" />

            {/* Nav strip */}
            <div className="fixed top-6 right-6 flex items-center gap-3 z-50">
                {savedPapers.length > 0 && (
                    <Link
                        href="/deoza/library"
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-sm font-semibold hover:bg-emerald-500/20 transition-all"
                    >
                        <Library size={16} />
                        Library ({savedPapers.length})
                    </Link>
                )}
            </div>

            <div className="z-10 w-full max-w-3xl flex flex-col items-center gap-10">

                {/* Logo + title */}
                <motion.div
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    {/* Icon glow */}
                    <div className="relative mb-2">
                        <div className="absolute inset-0 bg-emerald-500/30 blur-3xl rounded-full scale-150" />
                        <div className="relative p-6 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-600 shadow-2xl shadow-emerald-900/50">
                            <Cpu size={52} className="text-white" />
                        </div>
                    </div>

                    <h1 className="text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-white to-teal-400 tracking-[0.2em] font-orbitron">
                        DEOZA
                    </h1>

                    <div className="flex items-center gap-4">
                        <span className="h-px w-10 bg-emerald-500/30" />
                        <span className="text-xs text-emerald-400/70 font-bold tracking-[0.3em] uppercase">
                            Research Intelligence Platform
                        </span>
                        <span className="h-px w-10 bg-emerald-500/30" />
                    </div>

                    <p className="text-gray-400 text-center text-lg font-light max-w-xl leading-relaxed mt-2">
                        Search across millions of <span className="text-emerald-400 font-medium">academic papers</span>, then let AI explain, analyze, and guide your research.
                    </p>
                </motion.div>

                {/* Search bar */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-full"
                >
                    <SearchBar autoFocus size="hero" />
                </motion.div>

                {/* Feature pills */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-wrap gap-3 justify-center"
                >
                    {[
                        { label: "Multi-source search" },
                        { label: "AI summarization" },
                        { label: "Paper Q&A chat" },
                        { label: "Personal library" },
                        { label: "Field intelligence" },
                    ].map((f) => (
                        <div
                            key={f.label}
                            className="flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/8 text-sm text-gray-300"
                        >
                            <span>{f.label}</span>
                        </div>
                    ))}
                </motion.div>

                {/* Library shortcut */}
                {savedPapers.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                        <Link
                            href="/deoza/library"
                            className="flex items-center gap-3 px-6 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl hover:bg-emerald-500/10 transition-all"
                        >
                            <BookOpen size={18} className="text-emerald-400" />
                            <span className="text-emerald-300 text-sm font-medium">
                                Continue reading — {savedPapers.length} saved paper{savedPapers.length > 1 ? "s" : ""}
                            </span>
                        </Link>
                    </motion.div>
                )}
            </div>
        </main>
    );
}
