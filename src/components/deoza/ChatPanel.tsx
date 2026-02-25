"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Loader2, Bot, User } from "lucide-react";

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

interface ChatPanelProps {
    title: string;
    abstract: string;
}

const QUICK_QUESTIONS = [
    "Explain in simple terms",
    "What's the core methodology?",
    "What are the key limitations?",
    "How can I implement this?",
    "What are the research gaps?",
];

export default function ChatPanel({ title, abstract }: ChatPanelProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async (text?: string) => {
        const content = (text ?? input).trim();
        if (!content || loading) return;
        setInput("");

        const userMsg: ChatMessage = { role: "user", content };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setLoading(true);

        try {
            const res = await fetch("/api/deoza/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, abstract, messages: updatedMessages }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
        } catch (err: any) {
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: `Error: ${err.message}` },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-blue-500/10 rounded-lg">
                        <MessageSquare size={18} className="text-blue-400" />
                    </div>
                    <div className="text-left">
                        <p className="text-white font-semibold text-sm">AI Research Chat</p>
                        <p className="text-gray-500 text-xs">Ask anything about this paper</p>
                    </div>
                </div>
                <AnimatePresence>
                    {messages.length > 0 && (
                        <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
                            {messages.length} msg{messages.length > 1 ? "s" : ""}
                        </span>
                    )}
                </AnimatePresence>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden border-t border-white/5"
                    >
                        <div className="flex flex-col h-80">
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {messages.length === 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs text-gray-500 text-center mb-3">Quick questions:</p>
                                        {QUICK_QUESTIONS.map((q) => (
                                            <button
                                                key={q}
                                                onClick={() => sendMessage(q)}
                                                className="w-full text-left text-xs px-3 py-2 rounded-lg bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 text-gray-300 hover:text-white transition-all"
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {messages.map((msg, i) => (
                                    <div
                                        key={i}
                                        className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                                    >
                                        <div className={`p-1.5 rounded-lg shrink-0 h-fit ${msg.role === "user" ? "bg-blue-500/10" : "bg-emerald-500/10"
                                            }`}>
                                            {msg.role === "user"
                                                ? <User size={14} className="text-blue-400" />
                                                : <Bot size={14} className="text-emerald-400" />
                                            }
                                        </div>
                                        <div
                                            className={`text-sm leading-relaxed max-w-[85%] px-3 py-2 rounded-xl ${msg.role === "user"
                                                    ? "bg-blue-500/10 text-blue-100 border border-blue-500/10"
                                                    : "bg-white/5 text-gray-200 border border-white/5"
                                                }`}
                                        >
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}

                                {loading && (
                                    <div className="flex gap-2">
                                        <div className="p-1.5 rounded-lg bg-emerald-500/10 h-fit">
                                            <Bot size={14} className="text-emerald-400" />
                                        </div>
                                        <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/5">
                                            <Loader2 size={14} className="animate-spin text-emerald-400" />
                                        </div>
                                    </div>
                                )}
                                <div ref={bottomRef} />
                            </div>

                            {/* Input */}
                            <div className="p-3 border-t border-white/5 flex gap-2">
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                                    placeholder="Ask about this paper..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500/40 transition-colors"
                                />
                                <button
                                    onClick={() => sendMessage()}
                                    disabled={!input.trim() || loading}
                                    className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-400 disabled:opacity-30 transition-all"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
