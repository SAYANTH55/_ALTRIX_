"use client";

import { useDeozaStore, SearchFilters } from "@/lib/deoza-store";
import { SlidersHorizontal, RefreshCw } from "lucide-react";

export default function FilterPanel() {
    const { filters, setFilters } = useDeozaStore();

    const reset = () =>
        setFilters({ source: "all", openAccessOnly: false, yearFrom: null, yearTo: null, minCitations: null });

    return (
        <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 space-y-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400">
                    <SlidersHorizontal size={16} />
                    <span className="text-sm font-bold tracking-wide">Filters</span>
                </div>
                <button
                    onClick={reset}
                    className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
                >
                    <RefreshCw size={12} />
                    Reset
                </button>
            </div>

            {/* Source */}
            <div>
                <label className="text-xs text-gray-400 uppercase tracking-widest mb-2 block">Source</label>
                <div className="flex flex-col gap-1.5">
                    {(["all", "semantic", "arxiv"] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilters({ source: s })}
                            className={`text-left text-sm px-3 py-1.5 rounded-lg transition-all ${filters.source === s
                                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                }`}
                        >
                            {s === "all" ? "All Sources" : s === "semantic" ? "Semantic Scholar" : "arXiv"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Open Access */}
            <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Open Access Only</span>
                <button
                    onClick={() => setFilters({ openAccessOnly: !filters.openAccessOnly })}
                    className={`relative w-10 h-5 rounded-full transition-all ${filters.openAccessOnly ? "bg-emerald-500" : "bg-white/10"
                        }`}
                >
                    <div
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${filters.openAccessOnly ? "left-5" : "left-0.5"
                            }`}
                    />
                </button>
            </div>

            {/* Year Range */}
            <div>
                <label className="text-xs text-gray-400 uppercase tracking-widest mb-2 block">Year Range</label>
                <div className="flex gap-2 items-center">
                    <input
                        type="number"
                        placeholder="From"
                        min={1990}
                        max={2025}
                        value={filters.yearFrom ?? ""}
                        onChange={(e) => setFilters({ yearFrom: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-emerald-500/50 transition-colors"
                    />
                    <span className="text-gray-500 text-xs">–</span>
                    <input
                        type="number"
                        placeholder="To"
                        min={1990}
                        max={2025}
                        value={filters.yearTo ?? ""}
                        onChange={(e) => setFilters({ yearTo: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-emerald-500/50 transition-colors"
                    />
                </div>
            </div>

            {/* Min Citations */}
            <div>
                <label className="text-xs text-gray-400 uppercase tracking-widest mb-2 block">
                    Min Citations
                </label>
                <input
                    type="number"
                    placeholder="e.g. 50"
                    min={0}
                    value={filters.minCitations ?? ""}
                    onChange={(e) =>
                        setFilters({ minCitations: e.target.value ? parseInt(e.target.value) : null })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-emerald-500/50 transition-colors"
                />
            </div>
        </div>
    );
}
