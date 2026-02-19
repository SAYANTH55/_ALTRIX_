"use client";

import { useState } from "react";
import { Download, FileText, FileType } from "lucide-react";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";

interface ExportDropdownProps {
    text: string;
}

export default function ExportDropdown({ text }: ExportDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);

    const getTimestamp = () => {
        const now = new Date();
        return now.toISOString().replace(/[:.]/g, "-");
    };

    const handleExportPDF = () => {
        if (!text) return;
        const doc = new jsPDF();

        // Split text to fit page
        const splitText = doc.splitTextToSize(text, 180);
        doc.text(splitText, 10, 10);
        doc.save(`Sentic_Output_${getTimestamp()}.pdf`);
        setIsOpen(false);
    };

    const handleExportDOCX = async () => {
        if (!text) return;

        const doc = new Document({
            sections: [
                {
                    properties: {},
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun(text),
                            ],
                        }),
                    ],
                },
            ],
        });

        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Sentic_Output_${getTimestamp()}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block text-left">
            <div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-xs font-medium text-white px-3 py-1.5 rounded-md backdrop-blur-md border border-white/10 transition-all"
                >
                    <Download size={14} />
                    Export
                </button>
            </div>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-gray-900/90 backdrop-blur-xl border border-white/10 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="py-1">
                        <button
                            onClick={handleExportPDF}
                            className="group flex w-full items-center px-4 py-2 text-sm text-gray-200 hover:bg-white/10 hover:text-white transition-colors"
                        >
                            <FileText className="mr-3 h-4 w-4 text-red-400 group-hover:text-red-300" aria-hidden="true" />
                            Export as PDF
                        </button>
                        <button
                            onClick={handleExportDOCX}
                            className="group flex w-full items-center px-4 py-2 text-sm text-gray-200 hover:bg-white/10 hover:text-white transition-colors"
                        >
                            <FileType className="mr-3 h-4 w-4 text-blue-400 group-hover:text-blue-300" aria-hidden="true" />
                            Export as DOCX
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
