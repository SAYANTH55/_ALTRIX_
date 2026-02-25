"use client";

import { useMemo } from 'react';
import { Settings2, Volume2, Users, Briefcase } from 'lucide-react';
import { Tone, Audience, Formality } from '@/lib/antigravity';

interface ControlPanelProps {
    tone: Tone;
    setTone: (t: Tone) => void;
    audience: Audience;
    setAudience: (a: Audience) => void;
    formality: Formality;
    setFormality: (f: Formality) => void;
    disabled: boolean;
}

export default function ControlPanel({
    tone, setTone,
    audience, setAudience,
    formality, setFormality,
    disabled
}: ControlPanelProps) {

    const tones: Tone[] = ['Neutral', 'Polite', 'Empathetic', 'Assertive', 'Friendly', 'Formal'];
    const audiences: Audience[] = ['General Reader', 'Student', 'Professional', 'Expert'];
    const formalities: Formality[] = ['Low', 'Medium', 'High'];

    return (
        <div className="flex flex-wrap gap-4 mb-8 justify-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">

            {/* Tone Selector */}
            <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-3">
                <Volume2 size={16} className="text-secondary opacity-70" />
                <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as Tone)}
                    disabled={disabled}
                    className="bg-transparent text-sm outline-none cursor-pointer hover:text-accent transition-colors"
                >
                    {tones.map(t => <option key={t} value={t} className="bg-black text-white">{t}</option>)}
                </select>
            </div>

            {/* Audience Selector */}
            <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-3">
                <Users size={16} className="text-secondary opacity-70" />
                <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value as Audience)}
                    disabled={disabled}
                    className="bg-transparent text-sm outline-none cursor-pointer hover:text-accent transition-colors"
                >
                    {audiences.map(a => <option key={a} value={a} className="bg-black text-white">{a}</option>)}
                </select>
            </div>

            {/* Formality Selector */}
            <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-3">
                <Briefcase size={16} className="text-secondary opacity-70" />
                <select
                    value={formality}
                    onChange={(e) => setFormality(e.target.value as Formality)}
                    disabled={disabled}
                    className="bg-transparent text-sm outline-none cursor-pointer hover:text-accent transition-colors"
                >
                    {formalities.map(f => <option key={f} value={f} className="bg-black text-white">{f} Formality</option>)}
                </select>
            </div>
        </div>
    );
}
