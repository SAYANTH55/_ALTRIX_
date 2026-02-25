"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useDeozaStore } from "@/lib/deoza-store";
import PaperCard from "@/components/deoza/PaperCard";
import FilterPanel from "@/components/deoza/FilterPanel";
import FieldInsightPanel from "@/components/deoza/FieldInsightPanel";
import SearchBar from "@/components/deoza/SearchBar";
import UnifiedHistorySidebar, { addDeozaHistory } from "@/components/UnifiedHistorySidebar";
import Link from "next/link";
import { Library, Loader2, SearchX, ArrowLeft } from "lucide-react";

function SearchPageInner() {
    const searchParams = useSearchParams();
    const query = searchParams.get("q") || "";

    const { searchResults, isSearching, setSearchResults, setIsSearching, setSearchQuery, searchQuery, filters, savedPapers } = useDeozaStore();

    useEffect(() => {
        if (!query) return;
        setSearchQuery(query);
        runSearch(query);
    }, [query]);

    // Re-search when filters change
    useEffect(() => {
        if (!searchQuery) return;
        runSearch(searchQuery);
    }, [filters]);

    const runSearch = async (q: string) => {
        setIsSearching(true);
        try {
            const res = await fetch("/api/deoza/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: q, filters }),
            });
            const data = await res.json();
            const results = data.results || [];
            setSearchResults(results);
            // Save to DEOZA history
            if (results.length > 0) addDeozaHistory(q, results.length);
        } catch {
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#02080f] relative overflow-hidden">
            <UnifiedHistorySidebar tool="deoza" />
            {/* Background */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-900/15 rounded-full blur-[200px] -z-0 animate-pulse" />

            {/* Header */}
            <div className="relative z-10 border-b border-white/5 bg-[#02080f]/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/deoza" className="text-gray-500 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex-1 max-w-2xl">
                        <SearchBar defaultValue={query} size="compact" />
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <span className="text-gray-500 text-sm hidden sm:block">
                            {isSearching ? "Searching..." : `${searchResults.length} results`}
                        </span>
                        {savedPapers.length > 0 && (
                            <Link
                                href="/deoza/library"
                                className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs font-semibold hover:bg-emerald-500/20 transition-all"
                            >
                                <Library size={14} />
                                {savedPapers.length}
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 flex gap-6">
                {/* Filter panel */}
                <div className="hidden lg:block w-64 shrink-0">
                    <div className="sticky top-24">
                        <FilterPanel />
                    </div>
                </div>

                {/* Results */}
                <div className="flex-1 min-w-0">
                    {/* Field insight */}
                    {query && <FieldInsightPanel query={query} />}

                    {/* Content */}
                    {isSearching ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 size={36} className="animate-spin text-emerald-400" />
                            <p className="text-gray-400 text-sm">Searching papers...</p>
                        </div>
                    ) : searchResults.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                            <SearchX size={48} className="text-gray-600" />
                            <p className="text-gray-400">No papers found for <span className="text-white">"{query}"</span></p>
                            <p className="text-gray-600 text-sm">Try a different query or relax your filters</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {searchResults.map((paper, i) => (
                                <PaperCard key={paper.id} paper={paper} index={i} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#02080f] flex items-center justify-center">
                <Loader2 size={36} className="animate-spin text-emerald-400" />
            </div>
        }>
            <SearchPageInner />
        </Suspense>
    );
}
