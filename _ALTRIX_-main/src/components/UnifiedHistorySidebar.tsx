"use client";

import { useEffect, useState } from "react";
import { X, Clock, Trash2 } from "lucide-react";
import { useHistoryPanel } from "@/lib/history-store";
import { motion, AnimatePresence } from "framer-motion";

// ─── Sentic ───────────────────────────────────────────────────────
export interface SenticHistoryItem {
    id: string;
    type: "sentic";
    original: string;
    humanized: string;
    timestamp: string;
}

// ─── Alamix ───────────────────────────────────────────────────────
export interface AlamixHistoryItem {
    id: string;
    type: "alamix";
    fileName: string;
    title: string;
    authors: string;
    timestamp: string;
}

// ─── Deoza ────────────────────────────────────────────────────────
export interface DeozaHistoryItem {
    id: string;
    type: "deoza";
    query: string;
    resultCount: number;
    timestamp: string;
}

type AnyHistoryItem = SenticHistoryItem | AlamixHistoryItem | DeozaHistoryItem;

export function addSenticHistory(original: string, humanized: string) {
    const item: SenticHistoryItem = {
        id: Date.now().toString(),
        type: "sentic",
        original,
        humanized,
        timestamp: new Date().toISOString(),
    };
    const stored = localStorage.getItem("sentic_history");
    const hist: SenticHistoryItem[] = stored ? JSON.parse(stored) : [];
    localStorage.setItem("sentic_history", JSON.stringify([item, ...hist].slice(0, 20)));
}

export function addAlamixHistory(fileName: string, title: string, authors: string) {
    const item: AlamixHistoryItem = {
        id: Date.now().toString(),
        type: "alamix",
        fileName,
        title,
        authors,
        timestamp: new Date().toISOString(),
    };
    const stored = localStorage.getItem("alamix_history");
    const hist: AlamixHistoryItem[] = stored ? JSON.parse(stored) : [];
    localStorage.setItem("alamix_history", JSON.stringify([item, ...hist].slice(0, 20)));
}

export function addDeozaHistory(query: string, resultCount: number) {
    const item: DeozaHistoryItem = {
        id: Date.now().toString(),
        type: "deoza",
        query,
        resultCount,
        timestamp: new Date().toISOString(),
    };
    const stored = localStorage.getItem("deoza_history");
    const hist: DeozaHistoryItem[] = stored ? JSON.parse(stored) : [];
    // deduplicate same query
    const deduped = hist.filter((h) => h.query.toLowerCase() !== query.toLowerCase());
    localStorage.setItem("deoza_history", JSON.stringify([item, ...deduped].slice(0, 30)));
}

interface Props {
    tool: "sentic" | "alamix" | "deoza";
    /** For SENTIC: restore a prior result */
    onSenticSelect?: (item: SenticHistoryItem) => void;
    /** For ALAMIX: re-run search */
    onDeozaSelect?: (query: string) => void;
}

const LABELS: Record<string, { label: string; color: string }> = {
    sentic: { label: "SENTIC History", color: "text-purple-400" },
    alamix: { label: "ALAMIX History", color: "text-blue-400" },
    deoza: { label: "DEOZA History", color: "text-emerald-400" },
};

export default function UnifiedHistorySidebar({ tool, onSenticSelect, onDeozaSelect }: Props) {
    const { isOpen, close } = useHistoryPanel();
    const [items, setItems] = useState<AnyHistoryItem[]>([]);

    const storageKey = `${tool}_history`;

    useEffect(() => {
        if (!isOpen) return;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            try { setItems(JSON.parse(stored)); } catch { setItems([]); }
        } else {
            setItems([]);
        }
    }, [isOpen, storageKey]);

    const deleteItem = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const next = items.filter((i) => i.id !== id);
        setItems(next);
        localStorage.setItem(storageKey, JSON.stringify(next));
    };

    const clearAll = () => {
        localStorage.removeItem(storageKey);
        setItems([]);
    };

    const handleClick = (item: AnyHistoryItem) => {
        if (item.type === "sentic" && onSenticSelect) {
            onSenticSelect(item);
            close();
        }
        if (item.type === "deoza" && onDeozaSelect) {
            onDeozaSelect(item.query);
            close();
        }
    };

    const { label, color } = LABELS[tool];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        key="overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                        onClick={close}
                    />

                    {/* Drawer */}
                    <motion.div
                        key="drawer"
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", damping: 28, stiffness: 300 }}
                        className="fixed top-0 left-20 h-full w-80 bg-gray-900/95 backdrop-blur-xl border-r border-white/10 z-50 flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
                            <div className={`flex items-center gap-2 ${color}`}>
                                <Clock size={18} />
                                <h2 className="font-bold text-sm tracking-widest uppercase">{label}</h2>
                            </div>
                            <button onClick={close} className="text-gray-400 hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Items */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {items.length === 0 ? (
                                <div className="text-center text-gray-500 py-10 text-sm italic">
                                    No history yet.
                                </div>
                            ) : (
                                items.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => handleClick(item)}
                                        className={`relative group bg-white/5 border border-white/5 rounded-xl p-3 transition-all cursor-pointer hover:bg-white/10 ${item.type === "sentic" || item.type === "deoza" ? "hover:border-purple-500/20" : ""}`}
                                    >
                                        {/* Delete */}
                                        <button
                                            onClick={(e) => deleteItem(e, item.id)}
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 bg-black/40 rounded p-0.5"
                                        >
                                            <Trash2 size={11} />
                                        </button>

                                        <p className="text-[10px] text-gray-500 mb-1.5">
                                            {new Date(item.timestamp).toLocaleString()}
                                        </p>

                                        {item.type === "sentic" && (
                                            <>
                                                <p className="text-sm text-gray-200 line-clamp-2 font-medium">{item.humanized}</p>
                                                <p className="text-[10px] text-purple-400/60 mt-1.5 truncate border-t border-white/5 pt-1.5">
                                                    Original: {item.original}
                                                </p>
                                            </>
                                        )}

                                        {item.type === "alamix" && (
                                            <>
                                                <p className="text-sm text-blue-200 font-semibold line-clamp-2">{item.title || item.fileName}</p>
                                                {item.authors && (
                                                    <p className="text-[10px] text-gray-400 mt-1 truncate">{item.authors}</p>
                                                )}
                                                <p className="text-[10px] text-blue-400/50 mt-1">{item.fileName}</p>
                                            </>
                                        )}

                                        {item.type === "deoza" && (
                                            <>
                                                <p className="text-sm text-emerald-300 font-medium">"{item.query}"</p>
                                                <p className="text-[10px] text-gray-500 mt-1">{item.resultCount} results</p>
                                            </>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {items.length > 0 && (
                            <div className="p-4 border-t border-white/10 bg-black/20 shrink-0">
                                <button
                                    onClick={clearAll}
                                    className="w-full py-2 flex items-center justify-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-sm border border-transparent hover:border-red-500/20"
                                >
                                    <Trash2 size={14} />
                                    Clear History
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
