"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const cards = [
  {
    name: "SENTIC",
    path: "/sentic",
    desc: "Humanize AI Text",
    gradient: "from-purple-600 to-indigo-600",
    delay: 0,
    image: "/sentic.png"
  },
  {
    name: "ALAMIX",
    path: "/alamix",
    desc: "Research Analyst",
    gradient: "from-blue-600 to-cyan-600",
    delay: 0.1,
    image: "/alamix.png"
  },
  {
    name: "DEOZA",
    path: "/deoza",
    desc: "Coming Soon",
    gradient: "from-emerald-600 to-teal-600",
    delay: 0.2,
    image: null // DEOZA keeps the orb for now
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[#05010d] selection:bg-purple-500/30">

      {/* Animation Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes breathe {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        .animate-breathe {
          animation: breathe 7s ease-in-out infinite;
        }
        @keyframes flow {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
        }
        .animate-flow {
            animation: flow 4s ease-in-out infinite;
        }
      `}} />

      {/* --- BACKGROUND LAYERS --- */}
      {/* 1. Base Dark Layer */}
      <div className="fixed inset-0 bg-[#05010d] -z-50"></div>

      {/* 2. Vibrant Orbs - Using FIXED to ensure visibility */}
      <div className="fixed top-[-20%] left-[-10%] w-[1000px] h-[1000px] bg-purple-600/40 rounded-full blur-[180px] -z-40 animate-pulse pointer-events-none mix-blend-screen"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[1000px] h-[1000px] bg-indigo-600/40 rounded-full blur-[180px] -z-40 animate-pulse delay-1000 pointer-events-none mix-blend-screen"></div>

      {/* 3. Extra Ambient Glow for "Breathtaking" effect */}
      <div className="fixed top-[20%] left-[20%] w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[150px] -z-40 animate-pulse delay-700 pointer-events-none"></div>

      <div className="z-10 w-full max-w-7xl flex flex-col items-center">
        {/* Title */}
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-7xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-white tracking-widest font-orbitron text-center drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]"
        >
          ALTRIX
        </motion.h1>

        {/* Subtitle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-16"
        >
          <span className="text-2xl font-extralight tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white/60 to-purple-300 animate-breathe text-center px-4">
            Choose your path
          </span>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full px-4 perspective-1000">
          {cards.map((card) => (
            <Link href={card.path} key={card.name} className="group relative w-full">
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: card.delay, duration: 0.8 }}
                whileHover={{ y: -10 }}
                className="relative"
              >
                {/* Glow Container */}
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${card.gradient} rounded-[2rem] blur opacity-40 group-hover:opacity-80 transition duration-1000 group-hover:duration-200`}></div>

                {/* Card Content - Darker Background for Contrast */}
                <div className="relative h-[400px] rounded-[2rem] bg-[#0a0a0a]/90 backdrop-blur-md border border-white/5 p-10 flex flex-col items-center justify-center text-center shadow-2xl overflow-hidden">

                  {/* Orb or Image */}
                  <div className="mb-8 relative flex items-center justify-center w-32 h-32">
                    {card.image ? (
                      <div className="relative w-full h-full animate-flow">
                        {/* Glow behind image */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-50 blur-2xl rounded-full`}></div>
                        {/* Use standard img tag for simplicity if next/image config is tricky, or just standard img */}
                        <img
                          src={card.image}
                          alt={card.name}
                          className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] relative z-10"
                        />
                      </div>
                    ) : (
                      <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${card.gradient} opacity-80 group-hover:scale-110 transition-transform duration-500 blur-md group-hover:blur-sm shadow-[0_0_30px_rgba(255,255,255,0.1)]`}></div>
                    )}
                  </div>

                  <h2 className="text-4xl font-bold text-white mb-6 tracking-widest font-orbitron drop-shadow-lg relative z-10">
                    {card.name}
                  </h2>

                  <p className="text-gray-400 font-light tracking-wide group-hover:text-gray-200 transition-colors text-lg relative z-10">
                    {card.desc}
                  </p>

                  <div className="mt-auto px-6 py-2 rounded-full border border-white/10 bg-white/5 text-xs tracking-widest uppercase text-white/50 group-hover:bg-white/10 group-hover:text-white transition-all relative z-10">
                    Enter
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

    </main>
  );
}
