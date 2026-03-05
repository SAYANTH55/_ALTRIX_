"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useDeozaStore } from "@/lib/deoza-store";
import SearchBar from "@/components/deoza/SearchBar";
import FilterPanel from "@/components/deoza/FilterPanel";
import PaperCard from "@/components/deoza/PaperCard";
import { Loader2, Search, AlertCircle, Inbox } from "lucide-react";

function SearchResultsContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get("q") || "";

    const {
        searchResults,
        setSearchResults,
        isSearching,
        setIsSearching,
        filters
    } = useDeozaStore();

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!query) return;

        const performSearch = async () => {
            setIsSearching(true);
            setError(null);
            try {
                const res = await fetch("/api/deoza/search", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ query, filters }),
                });

                if (!res.ok) throw new Error("Search failed");
                const data = await res.json();
                setSearchResults(data.results || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsSearching(false);
            }
        };

        performSearch();
    }, [query, filters, setSearchResults, setIsSearching]);

    return (
        <div className="flex flex-col gap-6">
            {/* Header info */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-white">
                        {isSearching ? "Searching..." : `Results for "${query}"`}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {!isSearching && `${searchResults.length} papers found across Semantic Scholar, arXiv, and CrossRef`}
                    </p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Results Column */}
                <div className="flex-1 space-y-4">
                    <AnimatePresence mode="wait">
                        {isSearching ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center py-20 gap-4"
                            >
                                <div className="relative">
                                    <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse" />
                                    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin relative" />
                                </div>
                                <p className="text-emerald-400 font-medium animate-pulse">Scanning global research databases...</p>
                            </motion.div>
                        ) : error ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-20 gap-4 bg-red-500/5 border border-red-500/10 rounded-3xl"
                            >
                                <AlertCircle className="w-12 h-12 text-red-500/50" />
                                <div className="text-center">
                                    <p className="text-red-400 font-semibold text-lg">Search encountered an error</p>
                                    <p className="text-red-400/60 text-sm mt-1">{error}</p>
                                </div>
                            </motion.div>
                        ) : searchResults.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-20 gap-4 bg-white/[0.02] border border-white/5 rounded-3xl text-center"
                            >
                                <Inbox className="w-12 h-12 text-gray-600" />
                                <div>
                                    <p className="text-gray-400 font-semibold text-lg">No papers found</p>
                                    <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
                                        Try broadening your search terms or adjusting filters to find what you're looking for.
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {searchResults.map((paper, idx) => (
                                    <PaperCard key={paper.id} paper={paper} index={idx} />
                                ))}
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Filters Sidebar */}
                <div className="w-full lg:w-72 shrink-0">
                    <div className="sticky top-6">
                        <FilterPanel />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function DeozaSearchPage() {
    return (
        <main className="min-h-screen p-8 lg:p-12 bg-[#02080f]">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute -top-[10%] -right-[10%] w-[600px] h-[600px] bg-emerald-950/20 rounded-full blur-[120px]" />
                <div className="absolute -bottom-[10%] -left-[10%] w-[500px] h-[500px] bg-teal-950/10 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-7xl mx-auto space-y-12">
                {/* Top Nav/Search */}
                <div className="flex flex-col md:flex-row items-center gap-8 border-b border-white/5 pb-10">
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-bold font-orbitron text-white tracking-widest flex items-center gap-3">
                            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                                <Search size={22} />
                            </span>
                            DEOZA
                        </h1>
                        <p className="text-[10px] text-emerald-400/50 font-bold tracking-[0.3em] uppercase mt-2">
                            Intelligence Engine
                        </p>
                    </div>

                    <div className="flex-1 w-full max-w-2xl">
                        <SearchBar size="compact" />
                    </div>
                </div>

                <Suspense fallback={
                    <div className="flex items-center justify-center py-40">
                        <Loader2 className="w-8 h-8 text-emerald-500/50 animate-spin" />
                    </div>
                }>
                    <SearchResultsContent />
                </Suspense>
            </div>
        </main>
    );
}
