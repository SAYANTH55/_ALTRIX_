"use client";

import { useEffect, useState } from "react";
import { X, Clock, Trash2 } from "lucide-react";

interface HistoryItem {
    id: string;
    original: string;
    humanized: string;
    timestamp: string;
}

interface HistorySidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (item: HistoryItem) => void;
    toggleTrigger: number; // Used to trigger reload of history
}

export default function HistorySidebar({ isOpen, onClose, onSelect, toggleTrigger }: HistorySidebarProps) {
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem("sentic_history");
        if (stored) {
            try {
                // eslint-disable-next-line
                setHistory(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }
    }, [isOpen, toggleTrigger]);

    const clearHistory = () => {
        localStorage.removeItem("sentic_history");
        setHistory([]);
    };

    const deleteItem = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const newHistory = history.filter(h => h.id !== id);
        localStorage.setItem("sentic_history", JSON.stringify(newHistory));
        setHistory(newHistory);
    };

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
                    onClick={onClose}
                ></div>
            )}

            {/* Sidebar */}
            <div className={`fixed top-0 left-0 h-full w-80 bg-gray-900/95 backdrop-blur-xl border-r border-white/10 z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl`}>
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-2 text-purple-300">
                        <Clock size={20} />
                        <h2 className="font-orbitron font-bold tracking-wider">HISTORY</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar space-y-3">
                    {history.length === 0 ? (
                        <div className="text-center text-gray-500 py-10 text-sm italic">
                            No history yet. Humanize some text!
                        </div>
                    ) : (
                        history.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => onSelect(item)}
                                className="bg-white/5 border border-white/5 rounded-lg p-3 hover:bg-white/10 hover:border-purple-500/30 transition-all cursor-pointer group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => deleteItem(e, item.id)}
                                        className="text-red-400 hover:text-red-300 bg-black/50 rounded p-1"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400 mb-1">{new Date(item.timestamp).toLocaleString()}</p>
                                <p className="text-sm text-gray-200 line-clamp-2 font-medium">{item.humanized}</p>
                                <div className="mt-2 text-[10px] text-purple-400/70 truncate border-t border-white/5 pt-1">
                                    Orig: {item.original}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="absolute bottom-0 w-full p-4 border-t border-white/10 bg-black/20">
                    <button
                        onClick={clearHistory}
                        className="w-full py-2 flex items-center justify-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-sm font-medium border border-transparent hover:border-red-500/20"
                    >
                        <Trash2 size={16} />
                        Clear History
                    </button>
                </div>
            </div>
        </>
    );
}
