import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UnifiedPaper {
    id: string;
    source: "semantic" | "arxiv";
    title: string;
    authors: string[];
    year: number | null;
    abstract: string;
    citations: number | null;
    pdf: string | null;
    url: string;
    field: string | null;
    openAccess: boolean;
}

export interface SearchFilters {
    source: "all" | "semantic" | "arxiv";
    openAccessOnly: boolean;
    yearFrom: number | null;
    yearTo: number | null;
    minCitations: number | null;
}

interface DeozaStore {
    // Library
    savedPapers: UnifiedPaper[];
    addPaper: (paper: UnifiedPaper) => void;
    removePaper: (id: string) => void;
    isSaved: (id: string) => boolean;

    // Search session state (not persisted)
    searchQuery: string;
    searchResults: UnifiedPaper[];
    filters: SearchFilters;
    isSearching: boolean;
    setSearchQuery: (q: string) => void;
    setSearchResults: (results: UnifiedPaper[]) => void;
    setFilters: (f: Partial<SearchFilters>) => void;
    setIsSearching: (v: boolean) => void;
}

const defaultFilters: SearchFilters = {
    source: "all",
    openAccessOnly: false,
    yearFrom: null,
    yearTo: null,
    minCitations: null,
};

export const useDeozaStore = create<DeozaStore>()(
    persist(
        (set, get) => ({
            // Library (persisted)
            savedPapers: [],
            addPaper: (paper) =>
                set((state) => ({
                    savedPapers: state.savedPapers.some((p) => p.id === paper.id)
                        ? state.savedPapers
                        : [paper, ...state.savedPapers],
                })),
            removePaper: (id) =>
                set((state) => ({
                    savedPapers: state.savedPapers.filter((p) => p.id !== id),
                })),
            isSaved: (id) => get().savedPapers.some((p) => p.id === id),

            // Search (not persisted — session only)
            searchQuery: "",
            searchResults: [],
            filters: defaultFilters,
            isSearching: false,
            setSearchQuery: (q) => set({ searchQuery: q }),
            setSearchResults: (results) => set({ searchResults: results }),
            setFilters: (f) =>
                set((state) => ({ filters: { ...state.filters, ...f } })),
            setIsSearching: (v) => set({ isSearching: v }),
        }),
        {
            name: "deoza-library",
            partialize: (state) => ({ savedPapers: state.savedPapers }),
        }
    )
);
