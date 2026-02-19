"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Upload, FileText, Check, X, Loader2, Copy, Download,
    ChevronDown, ChevronUp, AlertCircle, RefreshCw,
    MessageSquare, Send, Sparkles, BookOpen, Layers
} from "lucide-react";
import { jsPDF } from "jspdf";
import { parsePdf, parseDocx, parseTxt } from "@/lib/file-processing";

// Types for Academic Results
interface AcademicResult {
    paperOverview: {
        title: string;
        authors: string;
        year: string;
        journal: string;
    };
    abstract: string;
    introduction?: string;
    literatureReview?: string;
    aim: string[];
    objectives: string[];
    problemStatement: string;
    researchGap: string;
    existingSystem: string;
    proposedSystem: string;
    methodology: {
        dataset: string;
        algorithms: string;
        tools: string;
        metrics: string;
    };
    results: string;
    discussion?: string;
    conclusion: string;
    futureWork: string[];
    limitations: string;
    references?: string[];
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export default function AlamixPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStep, setProcessingStep] = useState(0);
    const [result, setResult] = useState<AcademicResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copiedSection, setCopiedSection] = useState<string | null>(null);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        overview: true,
        abstract: true,
        intro: true,
        litReview: true,
        aim: true,
        objectives: true,
        problem: true,
        gap: true,
        proposed: true,
        results: true,
        discussion: true,
        conclusion: true,
        future: true,
        limitations: true,
        references: true
    });

    // New features state
    const [showGenDoc, setShowGenDoc] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState("");
    const [isChatLoading, setIsChatLoading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const processingMessages = [
        "Analyzing document structure...",
        "Extracting academic components...",
        "Verifying content consistency...",
        "Finalizing research insights..."
    ];

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            processSelectedFile(selectedFile);
        }
    };

    const processSelectedFile = (selectedFile: File) => {
        const allowedTypes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ];

        if (!allowedTypes.includes(selectedFile.type)) {
            setError("This document does not appear to be a research paper. Please upload PDF or Word files.");
            return;
        }

        setError(null);
        setFile(selectedFile);
        simulateUpload(selectedFile);
    };

    const simulateUpload = (selectedFile: File) => {
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            setUploadProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                startProcessing(selectedFile);
            }
        }, 50);
    };

    const startProcessing = async (targetFile?: File) => {
        const docToProcess = targetFile || file;
        if (!docToProcess) return;

        setIsProcessing(true);
        setError(null);
        setProcessingStep(0);

        try {
            // Step 1: Text Extraction from local file
            setProcessingStep(1);
            // Step 1: Text Extraction via Python Backend
            setProcessingStep(1);

            const formData = new FormData();
            formData.append("file", docToProcess);

            // Using the Python backend via Next.js proxy (avoids CORS/mixed content)
            const extractResponse = await fetch("/api/python/extract-text", {
                method: "POST",
                body: formData,
            });

            if (!extractResponse.ok) {
                const errorText = await extractResponse.text();
                let errorDetails = "";
                try {
                    const errorJson = JSON.parse(errorText);
                    errorDetails = errorJson.detail || errorJson.error;
                } catch (e) {
                    errorDetails = errorText.substring(0, 200); // Fallback to raw text (first 200 chars)
                }
                throw new Error(errorDetails || `Text extraction failed: ${extractResponse.statusText}.`);
            }

            const extractData = await extractResponse.json();
            const extractedText = extractData.text;

            if (!extractedText || extractedText.length < 100) {
                throw new Error("The document seems to be empty or contains insufficient text for analysis.");
            }

            // Step 2-4: Analysis via API (Simulating multi-step UI)
            setProcessingStep(2);
            const response = await fetch('/api/alamix/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: extractedText.substring(0, 50000) })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to analyze document.");
            }

            setProcessingStep(3);
            const academicData = await response.json();

            setResult(academicData);
            setIsProcessing(false);
        } catch (err: unknown) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : "An error occurred during processing. Please try again.";
            setError(errorMessage);
            setIsProcessing(false);
        }
    };

    const handleSendMessage = () => {
        if (!userInput.trim() || !result) return;

        const newUserMessage: ChatMessage = { role: 'user', content: userInput };
        setChatMessages(prev => [...prev, newUserMessage]);
        setUserInput("");
        setIsChatLoading(true);

        // Mock Chatbot Logic based on results
        setTimeout(() => {
            let response = "";
            const query = newUserMessage.content.toLowerCase();

            if (query.includes("methodology") || query.includes("how it works")) {
                response = `Based on the paper, the proposed methodology involves ${result.proposedSystem}. It specifically uses ${result.methodology.algorithms} and was tested on the ${result.methodology.dataset}.`;
            } else if (query.includes("aim") || query.includes("goal")) {
                response = `The primary aims explicitly stated in the document are: ${result.aim.join(", ")}.`;
            } else if (query.includes("future") || query.includes("scope")) {
                response = `The author suggests several future directions, including: ${result.futureWork.join("; ")}.`;
            } else if (query.includes("who") || query.includes("author")) {
                response = `The paper titled "${result.paperOverview.title}" was authored by ${result.paperOverview.authors}.`;
            } else if (query.includes("what is alamix")) {
                response = "ALAMIX is a dedicated research paper intelligence system designed to extract high-fidelity academic insights with zero hallucination, serving as a thesis companion and publication analysis engine.";
            } else {
                response = "As an academic assistant, I've analyzed the paper and found that your question pertains to specific domain knowledge. While the paper doesn't explicitly discuss this in depth, typical research in this field suggests focusing on structural integrity and stylistic variance. For queries strictly about this document, please refer to the Results or Conclusion sections.";
            }

            setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
            setIsChatLoading(false);
        }, 1000);
    };

    const copyToClipboard = (section: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedSection(section);
        setTimeout(() => setCopiedSection(null), 2000);
    };

    const downloadPDF = () => {
        if (!result) return;
        const doc = new jsPDF();
        const margin = 20;
        const pageWidth = 210;
        const contentWidth = pageWidth - (2 * margin);
        let y = 20;

        const addNewPageIfNeeded = (height: number) => {
            if (y + height > 280) {
                doc.addPage();
                y = 20;
            }
        };

        const addSection = (title: string, content: string | string[], isLarge = false) => {
            doc.setFont("times", "bold");
            doc.setFontSize(isLarge ? 14 : 12);
            addNewPageIfNeeded(10);
            doc.text(title, margin, y);
            y += isLarge ? 8 : 6;

            doc.setFont("times", "normal");
            doc.setFontSize(11);

            if (Array.isArray(content)) {
                content.forEach((item, i) => {
                    const bullet = `  • ${item}`;
                    const splitText = doc.splitTextToSize(bullet, contentWidth);
                    addNewPageIfNeeded(splitText.length * 5);
                    doc.text(splitText, margin, y);
                    y += splitText.length * 5;
                });
            } else {
                const splitText = doc.splitTextToSize(content, contentWidth);
                addNewPageIfNeeded(splitText.length * 5);
                // Simple justification simulation
                doc.text(splitText, margin, y, { align: "justify", maxWidth: contentWidth });
                y += splitText.length * 5 + 4;
            }
            y += 4;
        };

        // Title Page / Header
        doc.setFont("times", "bold");
        doc.setFontSize(18);
        const titleLines = doc.splitTextToSize("Structured Research Paper Analysis", contentWidth);
        doc.text(titleLines, pageWidth / 2, y, { align: "center" });
        y += (titleLines.length * 8) + 10;

        doc.setFontSize(12);
        doc.text(`Original Title: ${result.paperOverview.title}`, margin, y);
        y += 8;

        doc.setFontSize(12);
        doc.text(`Authors: ${result.paperOverview.authors}`, margin, y);
        y += 8;
        doc.text(`Year: ${result.paperOverview.year} | Publication: ${result.paperOverview.journal}`, margin, y);
        y += 15;

        // Content
        addSection("1. Abstract", result.abstract);
        addSection("2. Introduction", result.introduction || "Not available");
        addSection("3. Literature Review", result.literatureReview || "Not available");
        addSection("4. Aim of the Study", result.aim);
        addSection("5. Specific Objectives", result.objectives);
        addSection("6. Problem Statement", result.problemStatement);
        addSection("7. Research Gap Analysis", result.researchGap);
        addSection("8. Existing System", result.existingSystem || "Not mentioned in the document");
        addSection("9. Proposed System / Methodology", result.proposedSystem);
        addSection("10. Methodology Summary", [
            `Dataset: ${result.methodology.dataset}`,
            `Algorithms: ${result.methodology.algorithms}`,
            `Tools: ${result.methodology.tools}`,
            `Metrics: ${result.methodology.metrics}`
        ]);
        addSection("11. Results & Findings", result.results);
        addSection("12. Discussion", result.discussion || "Not available");
        addSection("13. Conclusion", result.conclusion);
        addSection("14. Future Scope", result.futureWork);
        addSection("15. Limitations", result.limitations || "Not mentioned in the document");
        if (result.references && result.references.length > 0) {
            addSection("16. References", result.references);
        }

        doc.save(`${result.paperOverview.title.substring(0, 20)}_Analysis.pdf`);
    };

    return (
        <main className="min-h-screen flex flex-col items-center p-8 relative overflow-x-hidden">
            {/* Base Background Layer */}
            <div className="fixed inset-0 bg-[#020617] -z-20"></div>

            {/* Background Orbs */}
            <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-blue-900/40 rounded-full blur-[180px] -z-10 animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-900/30 rounded-full blur-[150px] -z-10 animate-pulse delay-1000"></div>

            {/* Content Container */}
            <div className="w-full max-w-6xl z-10 flex flex-col items-center">

                {/* Header */}
                <motion.header
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-center mb-16"
                >
                    <div className="inline-block relative mb-4">
                        <h1 className="text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-white to-blue-400 tracking-[0.25em] font-orbitron">
                            ALAMIX
                        </h1>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
                    </div>
                    <p className="text-blue-300 text-xl font-light tracking-[0.3em] uppercase mb-4">
                        RESEARCH ANALYST
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        <span className="h-[1px] w-12 bg-blue-500/30"></span>
                        <span className="px-5 py-1.5 rounded-full bg-blue-500/5 border border-blue-500/20 text-blue-400 text-[10px] font-bold tracking-[0.2em] uppercase backdrop-blur-sm">
                            Extracting meaning. Preserving truth.
                        </span>
                        <span className="h-[1px] w-12 bg-blue-500/30"></span>
                    </div>
                </motion.header>

                {!result && !isProcessing && (
                    <motion.div
                        initial={{ scale: 0.98, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-full max-w-2xl mt-10"
                    >
                        {/* Error Message */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="mb-8 overflow-hidden"
                                >
                                    <div className="flex items-center gap-4 p-5 bg-red-500/5 border border-red-500/20 rounded-2xl text-red-400 backdrop-blur-xl">
                                        <div className="p-2 bg-red-500/10 rounded-lg">
                                            <AlertCircle size={20} />
                                        </div>
                                        <p className="text-sm font-medium tracking-wide">{error}</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Upload Card */}
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                const droppedFile = e.dataTransfer.files[0];
                                if (droppedFile) processSelectedFile(droppedFile);
                            }}
                            className="relative group"
                        >
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-blue-600/20 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-700"></div>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="relative bg-[#020617]/40 backdrop-blur-2xl border border-white/5 p-16 rounded-[2rem] flex flex-col items-center border-dashed border-2 group-hover:border-blue-500/30 transition-all cursor-pointer overflow-hidden shadow-2xl"
                            >
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent animate-scan"></div>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    accept=".pdf,.docx"
                                />

                                <div className="mb-8 p-8 rounded-full bg-blue-500/5 border border-blue-500/10 group-hover:bg-blue-500/10 group-hover:border-blue-500/30 transition-all duration-500 relative">
                                    <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <Upload size={56} className="text-blue-400 relative z-10 group-hover:scale-110 transition-transform duration-500" />
                                </div>

                                <h3 className="text-3xl font-bold text-white mb-3 tracking-tight">Analyze Document</h3>
                                <p className="text-blue-200/50 text-center max-w-sm mb-10 text-lg font-light leading-relaxed">
                                    Analyze PDF or Word research papers with absolute academic integrity.
                                </p>

                                <div className="flex gap-6">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-blue-300 text-xs font-bold tracking-[0.2em]">PDF</div>
                                        <span className="text-[10px] text-gray-500 uppercase font-bold">Standard</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-blue-300 text-xs font-bold tracking-[0.2em]">DOCX</div>
                                        <span className="text-[10px] text-gray-500 uppercase font-bold">Extended</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {file && (
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="mt-12 p-6 bg-blue-500/5 border border-blue-500/10 rounded-[1.5rem] flex items-center justify-between backdrop-blur-md"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                        <FileText size={24} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-base tracking-tight truncate max-w-[250px]">{file.name}</p>
                                        <p className="text-blue-300/40 text-xs font-medium uppercase tracking-widest">{(file.size / 1024 / 1024).toFixed(2)} MB • Ready for analysis</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                    <button
                                        onClick={() => {
                                            setFile(null);
                                            setUploadProgress(0);
                                        }}
                                        className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-full transition-all"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {isProcessing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center py-24"
                    >
                        <div className="relative mb-12">
                            <div className="absolute inset-0 bg-blue-500/20 blur-[40px] rounded-full animate-pulse"></div>
                            <Loader2 size={100} className="text-blue-500 animate-spin relative z-10" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 bg-blue-500/10 rounded-full border border-blue-500/20 animate-ping"></div>
                            </div>
                        </div>
                        <div className="text-center space-y-4">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={processingStep}
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -20, opacity: 0 }}
                                    className="space-y-2"
                                >
                                    <h4 className="text-2xl font-bold text-white tracking-wide">
                                        {processingMessages[processingStep]}
                                    </h4>
                                    <p className="text-blue-300/40 text-sm font-bold uppercase tracking-[0.3em]">
                                        Phase {processingStep + 1} of {processingMessages.length}
                                    </p>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}

                {result && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="w-full mt-8"
                    >
                        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12 border-b border-white/5 pb-8">
                            <div className="space-y-2">
                                <h2 className="text-4xl font-bold text-white tracking-tight font-orbitron">Intelligence Report</h2>
                                <p className="text-blue-300/60 font-medium tracking-wide">Analysis generated on {new Date().toLocaleDateString()} • Research Grade</p>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowGenDoc(true)}
                                    className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-white text-sm font-black tracking-widest uppercase transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_40px_rgba(37,99,235,0.5)] active:scale-95"
                                >
                                    <BookOpen size={18} className="text-white group-hover:scale-110 transition-transform" />
                                    Generate Academic Document
                                </button>
                                <button
                                    onClick={() => {
                                        setResult(null);
                                        setFile(null);
                                        setUploadProgress(0);
                                    }}
                                    className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/5 hover:border-white/20 rounded-2xl text-white text-sm font-bold transition-all backdrop-blur-xl group"
                                >
                                    <RefreshCw size={18} />
                                    New Analysis
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            <div className="lg:col-span-4 flex flex-col gap-8 sticky top-8">
                                <AcademicCard
                                    title="Paper Overview"
                                    isOpen={expandedSections.overview}
                                    onToggle={() => toggleSection('overview')}
                                >
                                    <div className="space-y-6">
                                        <InfoItem label="Research Title" value={result.paperOverview.title} highlight />
                                        <InfoItem label="Principal Authors" value={result.paperOverview.authors} />
                                        <div className="grid grid-cols-2 gap-4">
                                            <InfoItem label="Year" value={result.paperOverview.year} />
                                            <InfoItem label="Publication" value={result.paperOverview.journal} />
                                        </div>
                                    </div>
                                </AcademicCard>

                                <AcademicCard
                                    title="Methodology Context"
                                    isOpen={expandedSections.methodology}
                                    onToggle={() => toggleSection('methodology')}
                                >
                                    <div className="space-y-6">
                                        <InfoItem label="Target Dataset" value={result.methodology.dataset} />
                                        <InfoItem label="Core Algorithms" value={result.methodology.algorithms} />
                                        <InfoItem label="Operational Tools" value={result.methodology.tools} />
                                        <InfoItem label="Success Metrics" value={result.methodology.metrics} />
                                    </div>
                                </AcademicCard>
                            </div>

                            <div className="lg:col-span-8 flex flex-col gap-8">
                                <AcademicCard
                                    title="Abstract"
                                    isOpen={expandedSections.abstract}
                                    onToggle={() => toggleSection('abstract')}
                                    onCopy={() => copyToClipboard('abstract', result.abstract)}
                                    isCopied={copiedSection === 'abstract'}
                                >
                                    <p className="text-blue-100/80 leading-relaxed text-lg font-light italic selection:bg-blue-500/30">
                                        {result.abstract || "Abstract not found in document"}
                                    </p>
                                </AcademicCard>

                                <AcademicCard
                                    title="Introduction"
                                    isOpen={expandedSections.intro}
                                    onToggle={() => toggleSection('intro')}
                                >
                                    <p className="text-gray-300 leading-relaxed text-lg">
                                        {result.introduction || "Introduction not extracted."}
                                    </p>
                                </AcademicCard>

                                <AcademicCard
                                    title="Literature Review"
                                    isOpen={expandedSections.litReview}
                                    onToggle={() => toggleSection('litReview')}
                                >
                                    <p className="text-gray-300 leading-relaxed text-lg whitespace-pre-line">
                                        {result.literatureReview || "Literature review not extracted."}
                                    </p>
                                </AcademicCard>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <AcademicCard
                                        title="Aim of Study"
                                        isOpen={expandedSections.aim}
                                        onToggle={() => toggleSection('aim')}
                                        onCopy={() => copyToClipboard('aim', result.aim.join("\n"))}
                                        isCopied={copiedSection === 'aim'}
                                    >
                                        <ul className="space-y-4">
                                            {result.aim.length > 0 ? (
                                                result.aim.map((a, i) => (
                                                    <li key={i} className="flex gap-4 items-start">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
                                                        <span className="text-gray-300 leading-snug">{a}</span>
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="text-gray-500 italic">Aim not explicitly stated</li>
                                            )}
                                        </ul>
                                    </AcademicCard>

                                    <AcademicCard
                                        title="Specific Objectives"
                                        isOpen={expandedSections.objectives}
                                        onToggle={() => toggleSection('objectives')}
                                    >
                                        <ul className="space-y-4">
                                            {result.objectives.length > 0 ? (
                                                result.objectives.map((obj, i) => (
                                                    <li key={i} className="flex gap-4 items-start pb-4 border-b border-white/5 last:border-0 last:pb-0">
                                                        <span className="font-orbitron font-bold text-blue-500 text-xs mt-0.5">0{i + 1}</span>
                                                        <span className="text-gray-300 leading-snug">{obj}</span>
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="text-gray-500 italic">Objectives not explicitly listed</li>
                                            )}
                                        </ul>
                                    </AcademicCard>
                                </div>

                                <AcademicCard
                                    title="Problem Statement"
                                    isOpen={expandedSections.problem}
                                    onToggle={() => toggleSection('problem')}
                                >
                                    <div className="p-6 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                                        <p className="text-blue-100/80 leading-relaxed text-lg">
                                            {result.problemStatement || "Problem statement not explicitly defined"}
                                        </p>
                                    </div>
                                </AcademicCard>

                                <AcademicCard
                                    title="Research Gap Analysis"
                                    isOpen={expandedSections.gap}
                                    onToggle={() => toggleSection('gap')}
                                >
                                    <div className="flex gap-6 items-start">
                                        <div className="shrink-0 p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                                            <AlertCircle size={24} className="text-indigo-400" />
                                        </div>
                                        <p className="text-indigo-200/90 leading-relaxed text-lg font-medium">
                                            {result.researchGap || "Research gap not explicitly mentioned"}
                                        </p>
                                    </div>
                                </AcademicCard>

                                <AcademicCard
                                    title="Proposed System Architecture"
                                    isOpen={expandedSections.proposed}
                                    onToggle={() => toggleSection('proposed')}
                                >
                                    <p className="text-gray-300 leading-relaxed text-lg">
                                        {result.proposedSystem || "Proposed system not discussed"}
                                    </p>
                                </AcademicCard>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <AcademicCard
                                        title="Key Results & Findings"
                                        isOpen={expandedSections.results}
                                        onToggle={() => toggleSection('results')}
                                    >
                                        <p className="text-gray-300 leading-relaxed">
                                            {result.results || "Results section not found"}
                                        </p>
                                    </AcademicCard>

                                    <AcademicCard
                                        title="Final Conclusion"
                                        isOpen={expandedSections.conclusion}
                                        onToggle={() => toggleSection('conclusion')}
                                    >
                                        <p className="text-gray-300 leading-relaxed italic border-l-2 border-blue-500/30 pl-6">
                                            {result.conclusion || "Conclusion not found"}
                                        </p>
                                    </AcademicCard>
                                </div>

                                <AcademicCard
                                    title="Discussion"
                                    isOpen={expandedSections.discussion}
                                    onToggle={() => toggleSection('discussion')}
                                >
                                    <p className="text-gray-300 leading-relaxed text-lg">
                                        {result.discussion || "Discussion not extracted."}
                                    </p>
                                </AcademicCard>

                                {result.references && result.references.length > 0 && (
                                    <AcademicCard
                                        title="References"
                                        isOpen={expandedSections.references}
                                        onToggle={() => toggleSection('references')}
                                    >
                                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                            {result.references.map((ref, i) => (
                                                <p key={i} className="text-sm text-gray-400 pl-4 border-l border-white/5 hover:border-blue-500/50 transition-colors">
                                                    {ref}
                                                </p>
                                            ))}
                                        </div>
                                    </AcademicCard>
                                )}

                                {result.futureWork && result.futureWork.length > 0 && (
                                    <AcademicCard
                                        title="Expanded Future Scope"
                                        isOpen={expandedSections.future}
                                        onToggle={() => toggleSection('future')}
                                    >
                                        <div className="space-y-4">
                                            {result.futureWork.map((work, i) => (
                                                <div key={i} className="flex gap-4 items-start p-4 bg-blue-500/5 rounded-xl border border-blue-500/10">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                                                        <Sparkles size={14} className="text-blue-400" />
                                                    </div>
                                                    <p className="text-blue-100/70 leading-relaxed font-medium tracking-tight">
                                                        {work}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </AcademicCard>
                                )}

                                {result.limitations && (
                                    <AcademicCard
                                        title="Identified Limitations"
                                        isOpen={expandedSections.limitations}
                                        onToggle={() => toggleSection('limitations')}
                                    >
                                        <div className="flex gap-6 items-start">
                                            <div className="shrink-0 p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
                                                <AlertCircle size={24} className="text-red-400" />
                                            </div>
                                            <p className="text-gray-300 leading-relaxed text-lg">
                                                {result.limitations}
                                            </p>
                                        </div>
                                    </AcademicCard>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Academic Document Generator Modal */}
            <AnimatePresence>
                {showGenDoc && result && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-[#020617]/90 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-5xl h-[90vh] bg-white rounded-[2rem] shadow-2xl flex flex-col overflow-hidden text-black"
                            style={{ fontFamily: '"Times New Roman", Times, serif' }}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-12 py-6 border-b border-gray-100 bg-gray-50/50">
                                <div className="flex items-center gap-4">
                                    <BookOpen size={24} className="text-blue-600" />
                                    <h3 className="text-xl font-bold tracking-tight text-gray-900">Structured Research Paper Analysis</h3>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => downloadPDF()}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all text-sm"
                                    >
                                        <Download size={18} />
                                        Export PDF
                                    </button>
                                    <button
                                        onClick={() => setShowGenDoc(false)}
                                        className="p-2.5 hover:bg-gray-200 text-gray-400 hover:text-gray-900 rounded-xl transition-all"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Document Content */}
                            <div className="flex-1 overflow-y-auto p-20 px-32 bg-white selection:bg-blue-100">
                                <div className="max-w-3xl mx-auto space-y-12 text-justify">
                                    <header className="text-center space-y-4 mb-16">
                                        <h1 className="text-3xl font-bold uppercase tracking-wide">Structured Research Paper Analysis</h1>
                                        <div className="h-px w-32 bg-gray-300 mx-auto"></div>
                                        <p className="text-xl italic">{result.paperOverview.title}</p>
                                        <div className="text-lg">
                                            <p className="font-bold">{result.paperOverview.authors}</p>
                                            <p className="text-gray-600">Published: {result.paperOverview.year} | {result.paperOverview.journal}</p>
                                        </div>
                                    </header>

                                    <DocSection title="1. Abstract" content={result.abstract} />
                                    <DocSection title="2. Introduction" content={result.introduction || "N/A"} />
                                    <DocSection title="3. Literature Review" content={result.literatureReview || "N/A"} />
                                    <DocSection title="4. Aim of the Study" content={result.aim} isList />
                                    <DocSection title="5. Specific Objectives" content={result.objectives} isList numbered />
                                    <DocSection title="6. Problem Statement" content={result.problemStatement} />
                                    <DocSection title="7. Research Gap" content={result.researchGap} />
                                    <DocSection title="8. Existing System" content={result.existingSystem || "Existing system not discussed in the document."} />
                                    <DocSection title="9. Proposed System / Methodology" content={result.proposedSystem} />
                                    <DocSection title="10. Methodology Details" content={[
                                        `Dataset: ${result.methodology.dataset}`,
                                        `Algorithms: ${result.methodology.algorithms}`,
                                        `Tools: ${result.methodology.tools}`,
                                        `Evaluation Metrics: ${result.methodology.metrics}`
                                    ]} isList />
                                    <DocSection title="11. Results & Findings" content={result.results} />
                                    <DocSection title="12. Discussion" content={result.discussion || "N/A"} />
                                    <DocSection title="13. Conclusion" content={result.conclusion} />
                                    <DocSection title="14. Future Scope & Enhancements" content={result.futureWork} isList />
                                    <DocSection title="15. Limitations" content={result.limitations || "Limitations section not found in document."} />
                                    {result.references && <DocSection title="16. References" content={result.references} isList />}

                                    <footer className="mt-20 pt-8 border-t border-gray-100 text-center text-xs text-gray-400">
                                        <p>© {new Date().getFullYear()} ALAMIX Research Intelligence Engine. Generated with academic integrity.</p>
                                    </footer>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Research Chatbot UI */}
            <div className="fixed bottom-8 right-8 z-[90]">
                <AnimatePresence>
                    {showChat && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="absolute bottom-20 right-0 w-[400px] h-[600px] bg-[#020617]/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
                        >
                            {/* Chat Header */}
                            <div className="p-6 bg-blue-600 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                        <Sparkles size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold leading-tight">Research Assistant</h4>
                                        <p className="text-blue-100/60 text-[10px] font-bold uppercase tracking-widest">Context: {result?.paperOverview.title.substring(0, 30)}...</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowChat(false)} className="text-white/60 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {chatMessages.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-center px-4">
                                        <div className="p-4 bg-blue-500/10 rounded-2xl mb-4">
                                            <Layers size={32} className="text-blue-500/50" />
                                        </div>
                                        <h5 className="text-white font-bold mb-2">Academic Context Ready</h5>
                                        <p className="text-gray-500 text-sm">Ask anything about the methodology, results, or theoretical domain of the paper.</p>
                                    </div>
                                )}
                                {chatMessages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                            : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-none'
                                            }`}>
                                            <p className="text-sm leading-relaxed">{msg.content}</p>
                                        </div>
                                    </div>
                                ))}
                                {isChatLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none">
                                            <Loader2 size={16} className="text-blue-500 animate-spin" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Chat Input */}
                            <div className="p-6 border-t border-white/5 bg-white/[0.02]">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Ask context-aware question..."
                                        value={userInput}
                                        onChange={(e) => setUserInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 pr-12 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        className={`absolute right-2 top-1.5 p-1.5 rounded-lg transition-all ${userInput.trim() ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500'}`}
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowChat(!showChat)}
                    className={`p-5 rounded-full shadow-2xl transition-all duration-500 ${showChat ? 'bg-red-500 rotate-90' : 'bg-blue-600'}`}
                >
                    {showChat ? <X size={28} className="text-white" /> : <MessageSquare size={28} className="text-white" />}
                </motion.button>
            </div>

            <style jsx global>{`
                @keyframes scan {
                    0% { top: 0; opacity: 0; }
                    50% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                .animate-scan {
                    animation: scan 3s linear infinite;
                }
                @keyframes gradient-x {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                .animate-gradient-x {
                    background-size: 200% 100%;
                    animation: gradient-x 10s ease infinite;
                }
                ::-webkit-scrollbar {
                    width: 8px;
                }
                ::-webkit-scrollbar-track {
                    background: transparent;
                }
                ::-webkit-scrollbar-thumb {
                    background: rgba(59, 130, 246, 0.1);
                    border-radius: 10px;
                }
                ::-webkit-scrollbar-thumb:hover {
                    background: rgba(59, 130, 246, 0.2);
                }
            `}</style>
        </main>
    );
}

function DocSection({ title, content, isList = false, numbered = false }: { title: string, content: string | string[], isList?: boolean, numbered?: boolean }) {
    return (
        <section className="space-y-4">
            <h2 className="text-xl font-bold border-b border-gray-100 pb-2">{title}</h2>
            {isList ? (
                <ul className={`space-y-3 ${numbered ? 'list-decimal pl-5' : 'list-disc pl-5'}`}>
                    {(content as string[]).map((item, i) => (
                        <li key={i} className="leading-relaxed">{item}</li>
                    ))}
                </ul>
            ) : (
                <p className="leading-relaxed">{content as string}</p>
            )}
        </section>
    );
}

function AcademicCard({ title, children, isOpen, onToggle, onCopy, isCopied }: { title: string, children: React.ReactNode, isOpen?: boolean, onToggle?: () => void, onCopy?: () => void, isCopied?: boolean }) {
    return (
        <div className="w-full relative group">
            <div className="absolute -inset-1 bg-blue-500/5 rounded-[2rem] blur-lg opacity-0 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative bg-[#020617]/40 backdrop-blur-3xl border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-500 group-hover:border-white/10">
                <div
                    onClick={onToggle}
                    className="flex items-center justify-between px-8 py-6 cursor-pointer border-b border-white/5 bg-white/[0.02]"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
                        <h3 className="text-sm font-black text-blue-400 uppercase tracking-[0.25em] font-orbitron">{title}</h3>
                    </div>
                    <div className="flex items-center gap-4">
                        {onCopy && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onCopy(); }}
                                className={`p-2 rounded-xl transition-all duration-300 ${isCopied ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'}`}
                                title="Copy Section"
                            >
                                {isCopied ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                        )}
                        <div className={`transition-transform duration-500 ${isOpen ? 'rotate-180 text-blue-400' : 'text-gray-600'}`}>
                            <ChevronDown size={20} />
                        </div>
                    </div>
                </div>
                <AnimatePresence initial={false}>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                        >
                            <div className="p-8">
                                {children}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function InfoItem({ label, value, highlight }: { label: string, value: string, highlight?: boolean }) {
    return (
        <div className="space-y-2">
            <span className="text-[10px] text-blue-300/30 uppercase tracking-[0.2em] font-black">{label}</span>
            <p className={`leading-tight ${highlight ? 'text-white text-xl font-bold tracking-tight' : 'text-blue-100/70 text-base font-medium'}`}>
                {value || "Not mentioned in the document"}
            </p>
        </div>
    );
}
