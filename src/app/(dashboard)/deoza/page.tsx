"use client";

import { motion } from "framer-motion";

export default function DeozaPage() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Base Background Layer */}
            <div className="fixed inset-0 bg-[#05010d] -z-20"></div>

            {/* Background Orbs */}
            <div className="absolute bottom-0 left-0 w-[750px] h-[750px] bg-emerald-600/65 rounded-full blur-[170px] -z-10 animate-pulse"></div>

            <motion.h1
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-7xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-white tracking-widest font-orbitron"
            >
                DEOZA
            </motion.h1>

            <p className="text-gray-400 text-xl font-light tracking-wide">
                Coming Soon
            </p>
        </main>
    );
}
