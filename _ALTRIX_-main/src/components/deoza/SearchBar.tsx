"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

interface SearchBarProps {
    defaultValue?: string;
    onSearch?: (query: string) => void;
    autoFocus?: boolean;
    size?: "hero" | "compact";
}

const QUICK_CHIPS = [
    "Transformer attention",
    "LLM alignment",
    "Quantum ML",
    "Graph neural networks",
    "Diffusion models",
    "Federated learning",
];

export default function SearchBar({ defaultValue = "", onSearch, autoFocus, size = "hero" }: SearchBarProps) {
    const [value, setValue] = useState(defaultValue);
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (autoFocus) inputRef.current?.focus();
    }, [autoFocus]);

    const handleSubmit = (q?: string) => {
        const query = (q ?? value).trim();
        if (!query) return;
        if (onSearch) {
            onSearch(query);
        } else {
            router.push(`/deoza/search?q=${encodeURIComponent(query)}`);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
    };

    const isHero = size === "hero";

    return (
        <div className="w-full flex flex-col items-center gap-4">
            <div className={`relative w-full group ${isHero ? "max-w-2xl" : "max-w-full"}`}>
                {/* Neon green glow */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/40 to-teal-500/40 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                <div className={`relative flex items-center bg-white/5 border border-white/10 group-focus-within:border-emerald-500/60 rounded-2xl transition-all duration-300 ${isHero ? "px-6 py-4" : "px-4 py-2.5"}`}>
                    <Search size={isHero ? 22 : 18} className="text-emerald-400 shrink-0 mr-3" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={handleChange}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                        placeholder="Search research papers, topics, or questions..."
                        className={`flex-1 bg-transparent text-white placeholder-gray-500 outline-none ${isHero ? "text-lg" : "text-sm"}`}
                    />
                    {value && (
                        <button onClick={() => setValue("")} className="text-gray-500 hover:text-white transition-colors ml-2">
                            <X size={16} />
                        </button>
                    )}
                    <button
                        onClick={() => handleSubmit()}
                        className={`ml-4 px-5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition-all duration-200 text-sm tracking-wide shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]`}
                    >
                        Search
                    </button>
                </div>
            </div>

            {isHero && (
                <div className="flex flex-wrap gap-2 justify-center">
                    {QUICK_CHIPS.map((chip) => (
                        <button
                            key={chip}
                            onClick={() => { setValue(chip); handleSubmit(chip); }}
                            className="px-3 py-1 text-xs text-emerald-300 border border-emerald-500/20 rounded-full bg-emerald-500/5 hover:bg-emerald-500/15 hover:border-emerald-500/40 transition-all"
                        >
                            {chip}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
