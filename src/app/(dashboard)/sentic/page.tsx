"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
    processText,
    Tone,
    Audience,
    Formality,
    AntiGravityOutput,
} from "@/lib/antigravity";
import { parsePdf, parseDocx, parseTxt, fileToBase64 } from '@/lib/file-processing';
import { Clipboard, ClipboardPaste, Check, Upload, FileText, X, Mic, History, StopCircle, Home as HomeIcon, Volume2 } from "lucide-react";
import ExportDropdown from "@/components/ExportDropdown";
import HistorySidebar from "@/components/HistorySidebar";

export default function Home() {
    const [text, setText] = useState("");
    const [tone, setTone] = useState<Tone>("Neutral");
    const [audience, setAudience] = useState<Audience>("General Reader");
    const [formality, setFormality] = useState<Formality>("Medium");

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AntiGravityOutput | null>(null);
    const [copied, setCopied] = useState(false);

    const [showSummarizeModal, setShowSummarizeModal] = useState(false);
    const [processedFileText, setProcessedFileText] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // New State for Productivity Suite
    const [isRecording, setIsRecording] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [historyTrigger, setHistoryTrigger] = useState(0);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const recognitionRef = useRef<any>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && (window as unknown as { webkitSpeechRecognition: any }).webkitSpeechRecognition) {
            const SpeechRecognition = (window as unknown as { webkitSpeechRecognition: any }).webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            recognition.onresult = (event: any) => {
                let interimTranscript = '';
                let finalTranscript = '';

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                if (finalTranscript) {
                    setText(prev => prev + (prev ? ' ' : '') + finalTranscript);
                }
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            recognition.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsRecording(false);
            };

            recognition.onend = () => {
                setIsRecording(false);
            };

            recognitionRef.current = recognition;
        }

        return () => {
            if (typeof window !== 'undefined') {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const toggleRecording = () => {
        if (!recognitionRef.current) {
            alert("Speech recognition not supported in this browser. Try Chrome.");
            return;
        }

        if (isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
        } else {
            recognitionRef.current.start();
            setIsRecording(true);
        }
    };

    const toggleTTS = () => {
        if (typeof window === 'undefined') return;

        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        } else if (result?.humanizedText) {
            const utterance = new SpeechSynthesisUtterance(result.humanizedText);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);
            utteranceRef.current = utterance;
            setIsSpeaking(true);
            window.speechSynthesis.speak(utterance);
        }
    };

    const addToHistory = (original: string, humanized: string) => {
        const newItem = {
            id: Date.now().toString(),
            original,
            humanized,
            timestamp: new Date().toISOString()
        };

        const stored = localStorage.getItem("sentic_history");
        let history = stored ? JSON.parse(stored) : [];

        // Keep last 10
        history = [newItem, ...history].slice(0, 10);
        localStorage.setItem("sentic_history", JSON.stringify(history));
        setHistoryTrigger(prev => prev + 1); // Trigger update
    };

    async function handleHumanize(mode: 'humanize' | 'summarize' = 'humanize') {
        const textToProcess = mode === 'summarize' ? processedFileText : text;
        if (!textToProcess.trim()) return;

        setLoading(true);
        setShowSummarizeModal(false);

        try {
            if (mode === 'summarize') {
                const response = await fetch('/api/humanize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: textToProcess, mode: 'summarize' })
                });
                const data = await response.json();
                if (data.error) throw new Error(data.error);

                const outputVal = data.humanizedText;
                setResult({
                    humanizedText: outputVal,
                    analysis: { intent: "N/A", tone: "N/A", audience: "N/A", formality: "N/A" },
                    explainability: { intentPreservation: "N/A", toneAdjustments: "N/A", stylisticChanges: "N/A", humanizationTechniques: "N/A" }
                });
                addToHistory(textToProcess, outputVal);

            } else {
                const output = await processText({
                    text: textToProcess,
                    tone,
                    audience,
                    formality,
                });
                setResult(output);
                addToHistory(textToProcess, output.humanizedText);
            }
        } catch (err: unknown) {
            console.error(err);
            const msg = err instanceof Error ? err.message : String(err);
            alert(`Error: ${msg}`);
        } finally {
            setLoading(false);
            if (mode === 'summarize') {
                setText(processedFileText);
            }
        }
    }

    const handlePaste = async () => {
        try {
            const textFromClipboard = await navigator.clipboard.readText();
            setText(textFromClipboard);
        } catch (err) {
            console.error("Failed to paste:", err);
        }
    };

    const handleCopy = async () => {
        if (!result?.humanizedText) return;
        try {
            await navigator.clipboard.writeText(result.humanizedText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            let extractedText = "";

            if (file.type === "application/pdf") {
                extractedText = await parsePdf(file);
            } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
                extractedText = await parseDocx(file);
            } else if (file.type === "text/plain") {
                extractedText = await parseTxt(file);
            } else if (file.type.startsWith("image/")) {
                const base64 = await fileToBase64(file);
                const response = await fetch('/api/humanize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mode: 'extract_image', imageData: base64, mimeType: file.type })
                });
                const data = await response.json();
                if (data.error) throw new Error(data.error);
                extractedText = data.text;
            } else {
                throw new Error("Unsupported file type");
            }

            setProcessedFileText(extractedText);
            setText(extractedText);
            setShowSummarizeModal(true);

        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            alert(`Failed to process file: ${msg}`);
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const wordCount = (val: string) => val.trim() ? val.trim().split(/\s+/).length : 0;
    const charCount = (val: string) => val.length;

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">

            {/* Base Background Layer */}
            <div className="fixed inset-0 bg-[#05010d] -z-20"></div>

            {/* Background Orbs */}
            <div className="absolute top-0 left-0 w-[750px] h-[750px] bg-purple-600/65 rounded-full blur-[170px] -z-10 animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-[750px] h-[750px] bg-indigo-600/65 rounded-full blur-[170px] -z-10 animate-pulse delay-700"></div>

            <HistorySidebar
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
                toggleTrigger={historyTrigger}
                onSelect={(item) => {
                    setText(item.original);
                    setResult({
                        humanizedText: item.humanized,
                        analysis: { intent: "N/A", tone: "N/A", audience: "N/A", formality: "N/A" },
                        explainability: { intentPreservation: "N/A", toneAdjustments: "N/A", stylisticChanges: "N/A", humanizationTechniques: "N/A" }
                    }); // Naive restore
                    setShowHistory(false);
                }}
            />

            {/* History Toggle Button */}
            {!showHistory && (
                <motion.button
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => setShowHistory(true)}
                    className="fixed top-6 left-6 z-50 p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white backdrop-blur-md transition-all shadow-lg hover:shadow-purple-500/20 group"
                    title="History"
                >
                    <History size={24} className="group-hover:text-purple-400 transition-colors" />
                </motion.button>
            )}

            {/* Home / Reset Button */}
            <motion.button
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => {
                    if (confirm("Are you sure you want to reset? Unsaved changes will be lost.")) {
                        window.location.reload();
                    }
                }}
                className="fixed top-6 right-6 z-50 p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white backdrop-blur-md transition-all shadow-lg hover:shadow-purple-500/20 group"
                title="Reset / Home"
            >
                <HomeIcon size={24} className="group-hover:text-purple-400 transition-colors" />
            </motion.button>


            {/* Modal for Summarize/Edit */}
            <AnimatePresence>
                {showSummarizeModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-gray-900/90 border border-purple-500/30 p-8 rounded-2xl max-w-md w-full shadow-2xl relative"
                        >
                            <button onClick={() => setShowSummarizeModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                            <div className="flex justify-center mb-6">
                                <div className="p-4 bg-purple-500/20 rounded-full">
                                    <FileText size={48} className="text-purple-300" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-center text-white mb-2">File Processed</h3>
                            <p className="text-center text-gray-400 mb-8">
                                We extracted the text from your file. Would you like to summarize it or just edit it manually?
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowSummarizeModal(false)}
                                    className="flex-1 py-3 px-4 rounded-xl border border-white/10 hover:bg-white/10 text-white font-medium transition-colors"
                                >
                                    Manual Edit
                                </button>
                                <button
                                    onClick={() => handleHumanize('summarize')}
                                    className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg shadow-purple-900/20 transition-all font-orbitron tracking-wider"
                                >
                                    Summarize
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="z-10 w-full max-w-2xl flex flex-col items-center">
                <motion.h1
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-7xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-white tracking-widest font-orbitron"
                >
                    SENTIC
                </motion.h1>

                <div className="w-full relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg blur opacity-30 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative">
                        {/* Atmospheric Greeting */}
                        <style dangerouslySetInnerHTML={{
                            __html: `
              @keyframes breathe {
                0%, 100% { opacity: 0.3; }
                50% { opacity: 0.7; }
              }
              .animate-breathe {
                animation: breathe 7s ease-in-out infinite;
              }
            `}} />

                        <AnimatePresence>
                            {!text && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                                >
                                    <span className="text-4xl font-extralight tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white/60 to-purple-300 animate-breathe text-center px-4">
                                        Seeking a human touch?
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Button Group: Voice, Upload, Paste */}
                        <div className="absolute top-3 right-3 z-20 flex gap-2">
                            <button
                                onClick={toggleRecording}
                                className={`flex items-center gap-2 bg-white/10 hover:bg-white/20 text-xs font-medium text-white px-3 py-1.5 rounded-md backdrop-blur-md border border-white/10 transition-all ${isRecording ? 'text-red-400 border-red-500/50 animate-pulse bg-red-500/10' : ''}`}
                            >
                                {isRecording ? <StopCircle size={14} /> : <Mic size={14} />}
                                {isRecording ? "Stop" : "Voice"}
                            </button>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                className="hidden"
                                accept=".txt,.pdf,.docx,image/*"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-xs font-medium text-white px-3 py-1.5 rounded-md backdrop-blur-md border border-white/10 transition-all"
                            >
                                <Upload size={14} />
                                Upload
                            </button>

                            <button
                                onClick={handlePaste}
                                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-xs font-medium text-white px-3 py-1.5 rounded-md backdrop-blur-md border border-white/10 transition-all"
                            >
                                <ClipboardPaste size={14} />
                                Paste
                            </button>
                        </div>

                        <textarea
                            className="relative w-full h-96 p-6 pt-12 bg-white/5 backdrop-blur-md text-white border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-xl text-lg placeholder-gray-400 resize-none transition-all scrollbar-hide"
                            placeholder="Paste text or upload a file (PDF, Doc, Image)..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />

                        {/* Stats */}
                        <div className="absolute bottom-3 right-4 text-[10px] text-gray-500 pointer-events-none flex gap-3 uppercase tracking-tighter">
                            <span>Words: {wordCount(text)}</span>
                            <span>Chars: {charCount(text)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 my-8 w-full justify-between">
                    <select
                        className="bg-white/10 text-white p-3 rounded-lg border border-white/10 focus:outline-none focus:border-purple-500 hover:bg-white/20 cursor-pointer backdrop-blur-sm transition-all text-sm font-medium"
                        value={tone}
                        onChange={(e) => setTone(e.target.value as Tone)}
                    >
                        <option className="bg-gray-900">Neutral</option>
                        <option className="bg-gray-900">Polite</option>
                        <option className="bg-gray-900">Friendly</option>
                        <option className="bg-gray-900">Formal</option>
                    </select>

                    <select
                        className="bg-white/10 text-white p-3 rounded-lg border border-white/10 focus:outline-none focus:border-purple-500 hover:bg-white/20 cursor-pointer backdrop-blur-sm transition-all text-sm font-medium"
                        value={audience}
                        onChange={(e) => setAudience(e.target.value as Audience)}
                    >
                        <option className="bg-gray-900">General Reader</option>
                        <option className="bg-gray-900">Student</option>
                        <option className="bg-gray-900">Professional</option>
                        <option className="bg-gray-900">Expert</option>
                    </select>

                    <select
                        className="bg-white/10 text-white p-3 rounded-lg border border-white/10 focus:outline-none focus:border-purple-500 hover:bg-white/20 cursor-pointer backdrop-blur-sm transition-all text-sm font-medium"
                        value={formality}
                        onChange={(e) => setFormality(e.target.value as Formality)}
                    >
                        <option className="bg-gray-900">Low</option>
                        <option className="bg-gray-900">Medium</option>
                        <option className="bg-gray-900">High</option>
                    </select>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleHumanize('humanize')}
                    disabled={loading}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-12 rounded-full shadow-lg hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-orbitron tracking-widest text-lg"
                >
                    {loading ? "Processing..." : "Humanize Text"}
                </motion.button>

                {result && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="mt-10 w-full relative group"
                    >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg blur opacity-30 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative">
                            <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
                                {/* TTS Button */}
                                <button
                                    onClick={toggleTTS}
                                    className={`flex items-center gap-2 bg-white/10 hover:bg-white/20 text-xs font-medium text-white px-3 py-1.5 rounded-md backdrop-blur-md border border-white/10 transition-all ${isSpeaking ? 'text-purple-400 border-purple-500/50 animate-pulse' : ''}`}
                                    title={isSpeaking ? "Stop Speaking" : "Read Aloud"}
                                >
                                    <Volume2 size={14} className={isSpeaking ? "animate-bounce" : ""} />
                                    {isSpeaking ? "Stop" : "Listen"}
                                </button>

                                <ExportDropdown text={result.humanizedText} />

                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-xs font-medium text-white px-3 py-1.5 rounded-md backdrop-blur-md border border-white/10 transition-all"
                                >
                                    {copied ? <Check size={14} className="text-green-400" /> : <Clipboard size={14} />}
                                    {copied ? "Copied" : "Copy"}
                                </button>
                            </div>

                            <textarea
                                readOnly
                                className="relative w-full min-h-[24rem] p-6 pt-12 bg-white/5 backdrop-blur-md text-white border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-xl text-lg placeholder-gray-400 resize-none transition-all scrollbar-hide"
                                value={result.humanizedText}
                            />

                            {/* Stats */}
                            <div className="absolute bottom-3 right-4 text-[10px] text-gray-500 pointer-events-none flex gap-3 uppercase tracking-tighter">
                                <span>Words: {wordCount(result.humanizedText)}</span>
                                <span>Chars: {charCount(result.humanizedText)}</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

        </main>
    );
}
