"use client";

import { useState, useRef } from 'react';
import { Sparkles, Upload, FileText, AlertCircle, X, FileType, CheckCircle2 } from 'lucide-react';

interface InputSectionProps {
    input: string;
    setInput: (value: string) => void;
    onProcess: () => void;
    isProcessing: boolean;
}

export default function InputSection({ input, setInput, onProcess, isProcessing }: InputSectionProps) {
    const [mode, setMode] = useState<'paste' | 'upload'>('paste');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const processFile = async (file: File) => {
        setUploadError(null);

        // Validation
        if (!file.name.toLowerCase().endsWith('.pdf') && !file.name.toLowerCase().endsWith('.docx')) {
            setUploadError("Invalid file type. Please upload a PDF or DOCX file.");
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            setUploadError("File size exceeds 10MB limit.");
            return;
        }

        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:8000/extract-text', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to extract text");
            }

            const data = await response.json();

            if (data.text) {
                setInput(data.text);
                setMode('paste'); // Switch back to paste mode to show extracted text
                // Optional: Show a success toast or notification here
            } else {
                setUploadError("No text could be extracted from the document.");
            }

        } catch (err: any) {
            console.error("Upload error:", err);
            setUploadError(err.message || "Failed to upload document. Is the backend running?");
        } finally {
            setIsUploading(false);
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const onButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="w-full max-w-4xl mx-auto mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Mode Switcher */}
            <div className="flex gap-4 mb-4">
                <button
                    onClick={() => setMode('paste')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'paste'
                            ? 'bg-white/10 text-white border border-white/20'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <FileText size={16} /> Paste Text
                </button>
                <button
                    onClick={() => setMode('upload')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'upload'
                            ? 'bg-white/10 text-white border border-white/20'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <Upload size={16} /> Upload Document
                </button>
            </div>

            <div className="glass-panel rounded-2xl p-1 focus-within:ring-2 ring-accent/50 transition-all duration-300 relative overflow-hidden">

                {mode === 'paste' ? (
                    <>
                        <textarea
                            className="w-full h-64 bg-transparent text-lg p-6 outline-none resize-none placeholder-gray-500 font-light leading-relaxed"
                            placeholder="Paste your AI-generated text here to humanize it..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                        <div className="flex justify-between items-center px-4 py-3 border-t border-white/5 bg-black/20 rounded-b-xl">
                            <span className="text-secondary text-xs font-mono uppercase tracking-wider opacity-60">
                                {input.length} chars
                            </span>
                            <button
                                onClick={onProcess}
                                disabled={isProcessing || !input.trim()}
                                className={`
                                    flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all duration-300
                                    ${isProcessing || !input.trim()
                                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                        : 'bg-white text-black hover:bg-gray-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                                    }
                                `}
                            >
                                {isProcessing ? (
                                    <>
                                        <span className="animate-spin">✦</span> Processing
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={16} /> Humanize Text
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                ) : (
                    <div
                        className={`
                            h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-all duration-300
                            ${dragActive ? 'border-accent bg-accent/5' : 'border-white/10 hover:border-white/20 hover:bg-white/5'}
                        `}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        {isUploading ? (
                            <div className="text-center space-y-4">
                                <div className="animate-spin text-accent w-8 h-8 mx-auto border-2 border-current border-t-transparent rounded-full" />
                                <p className="text-gray-400">Reading document...</p>
                            </div>
                        ) : (
                            <div className="text-center space-y-4 max-w-sm px-4">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.docx"
                                    onChange={handleChange}
                                />
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                                    <FileType className="text-gray-400" size={32} />
                                </div>
                                <div>
                                    <p className="text-lg font-medium text-white mb-1">
                                        Drag & drop your file here
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Support for .pdf and .docx up to 10MB
                                    </p>
                                </div>
                                <button
                                    onClick={onButtonClick}
                                    className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
                                >
                                    Browse Files
                                </button>
                                {uploadError && (
                                    <div className="flex items-center gap-2 justify-center text-red-400 text-sm mt-4 bg-red-400/10 p-2 rounded">
                                        <AlertCircle size={14} />
                                        {uploadError}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
            {/* Info Footnote for Upload Mode */}
            {mode === 'upload' && (
                <div className="flex justify-center mt-4 space-x-6 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5"><CheckCircle2 size={12} /> Automatic OCR</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 size={12} /> Word Count Check</span>
                </div>
            )}
        </div>
    );
}
