"use client";

import { AntiGravityOutput } from "@/lib/antigravity";
import { CheckCircle2 } from "lucide-react";

interface OutputDisplayProps {
    result: AntiGravityOutput | null;
}

export default function OutputDisplay({ result }: OutputDisplayProps) {
    if (!result) return null;

    return (
        <div className="w-full mt-10">
            <div className="bg-[#0b1220] border border-purple-500/20 rounded-lg p-6">
                <h3 className="flex items-center gap-2 text-purple-400 text-sm mb-4">
                    <CheckCircle2 size={16} />
                    Humanized Output
                </h3>

                <p className="text-white whitespace-pre-wrap leading-relaxed">
                    {result.humanizedText}
                </p>
            </div>
        </div>
    );
}