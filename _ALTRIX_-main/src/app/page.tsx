"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Sparkles, BookOpen, Cpu, ArrowRight, ChevronDown } from "lucide-react";

// ─── Data ──────────────────────────────────────────────────────────────────────

const tools = [
  {
    name: "SENTIC",
    path: "/sentic",
    label: "Text Humanizer",
    micro: "Refine and humanize AI-generated content with authenticity.",
    gradient: "from-purple-600 to-indigo-600",
    glow: "purple",
    border: "border-purple-500/20",
    hoverBorder: "group-hover:border-purple-500/50",
    accent: "text-purple-300",
    bg: "bg-purple-500/5",
    delay: 0,
    Icon: Sparkles,
  },
  {
    name: "ALAMIX",
    path: "/alamix",
    label: "Research Analyst",
    micro: "Extract meaning and insight from academic research.",
    gradient: "from-blue-600 to-cyan-600",
    glow: "blue",
    border: "border-blue-500/20",
    hoverBorder: "group-hover:border-blue-500/50",
    accent: "text-blue-300",
    bg: "bg-blue-500/5",
    delay: 0.12,
    Icon: BookOpen,
  },
  {
    name: "DEOZA",
    path: "/deoza",
    label: "Research Intelligence",
    micro: "Generate novel ideas and uncover research opportunities.",
    gradient: "from-emerald-600 to-teal-600",
    glow: "emerald",
    border: "border-emerald-500/20",
    hoverBorder: "group-hover:border-emerald-500/50",
    accent: "text-emerald-300",
    bg: "bg-emerald-500/5",
    delay: 0.24,
    Icon: Cpu,
  },
];

const steps = [
  { n: "01", title: "Input", body: "Input or upload your research content — text, PDF, or document." },
  { n: "02", title: "Process", body: "Analyze, refine, or generate innovation using the right AI engine." },
  { n: "03", title: "Output", body: "Export insights, humanized text, and elevate your research output." },
];

const stats = [
  { label: "Precision Driven", sub: "Fine-tuned for academic accuracy" },
  { label: "Research Focused", sub: "Built for deep analytical workflows" },
  { label: "Built for Thinkers", sub: "Designed for the curious mind" },
];

// ─── Reusable fade-up on scroll ───────────────────────────────────────────────
function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ y: 32, opacity: 0 }}
      animate={inView ? { y: 0, opacity: 1 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Neural lines SVG (subtle background) ────────────────────────────────────
function NeuralLines() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.07]"
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id="ng" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      {[
        "M200,150 Q500,80 800,200 T1100,150",
        "M100,300 Q400,200 700,320 T1100,280",
        "M150,450 Q450,350 750,430 T1050,400",
        "M300,100 Q600,250 900,150",
        "M600,50 Q700,200 600,350",
        "M400,200 L700,300 L900,180",
        "M200,400 L500,300 L800,450",
      ].map((d, i) => (
        <motion.path
          key={i}
          d={d}
          stroke="url(#ng)"
          strokeWidth="1"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 3 + i * 0.4, delay: i * 0.3, ease: "easeInOut" }}
        />
      ))}
      {[[200, 150], [500, 80], [800, 200], [400, 300], [700, 320], [600, 50], [900, 150]].map(([cx, cy], i) => (
        <motion.circle
          key={i}
          cx={cx}
          cy={cy}
          r="3"
          fill="#a855f7"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.4, 1], opacity: [0, 0.8, 0.5] }}
          transition={{ duration: 1, delay: 1 + i * 0.25 }}
        />
      ))}
    </svg>
  );
}

// ─── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-4 justify-center mb-4">
      <span className="h-px w-12 bg-purple-500/30" />
      <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-purple-400/70">{text}</span>
      <span className="h-px w-12 bg-purple-500/30" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-[#05010d] selection:bg-purple-500/30">

      {/* ── Global CSS ── */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes breathe { 0%,100%{opacity:.35} 50%{opacity:.75} }
        .breathe { animation: breathe 7s ease-in-out infinite; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        .float { animation: float 5s ease-in-out infinite; }
        @keyframes scan-h { 0%{transform:scaleX(0);opacity:0} 50%{opacity:1} 100%{transform:scaleX(1);opacity:0} }
        .scan-h { animation: scan-h 2.5s ease-in-out infinite; }
        @keyframes arrow-pulse { 0%,100%{opacity:.3;transform:translateX(0)} 50%{opacity:1;transform:translateX(6px)} }
        .arrow-pulse { animation: arrow-pulse 1.8s ease-in-out infinite; }
        html { scroll-behavior: smooth; }
      ` }} />

      {/* ── Fixed background orbs ── */}
      <div className="fixed top-[-20%] left-[-10%] w-[1000px] h-[1000px] bg-purple-600/40 rounded-full blur-[200px] -z-40 breathe pointer-events-none mix-blend-screen" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[1000px] h-[1000px] bg-indigo-600/35 rounded-full blur-[200px] -z-40 breathe pointer-events-none mix-blend-screen" style={{ animationDelay: "1s" }} />
      <div className="fixed top-[35%] left-[30%] w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[160px] -z-40 pointer-events-none" />
      <div className="fixed inset-0 bg-[#05010d] -z-50" />

      {/* ═══════════════════════════════════════════
          1. HERO
      ════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden">
        <NeuralLines />

        {/* Radial glow behind title */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 px-5 py-1.5 rounded-full border border-purple-500/25 bg-purple-500/5 backdrop-blur-sm text-[10px] font-bold tracking-[0.35em] uppercase text-purple-300"
        >
          Research Intelligence Platform
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-[clamp(5rem,14vw,9rem)] font-bold bg-clip-text text-transparent bg-gradient-to-br from-white via-purple-200 to-purple-400 tracking-[0.18em] font-orbitron leading-none drop-shadow-[0_0_40px_rgba(168,85,247,0.4)]"
        >
          ALTRIX
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mt-4 text-2xl font-extralight tracking-[0.3em] text-white/50 breathe"
        >
          Intelligence. Amplified.
        </motion.p>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.8 }}
          className="mt-6 max-w-xl text-gray-400 font-light leading-relaxed text-base"
        >
          A unified AI research ecosystem designed to humanize, analyze, and innovate with precision.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-10 flex flex-wrap gap-4 justify-center"
        >
          {/* Primary */}
          <a href="#ecosystem" className="group relative px-8 py-3.5 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 blur-xl opacity-50 group-hover:opacity-80 transition-opacity duration-300 scale-110" />
            <span className="relative font-semibold text-sm tracking-widest text-white uppercase flex items-center gap-2">
              Explore the Ecosystem
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </a>

          {/* Secondary */}
          <a
            href="#about"
            className="px-8 py-3.5 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm text-white/60 hover:text-white hover:bg-white/[0.08] hover:border-white/20 transition-all font-semibold text-sm tracking-widest uppercase"
          >
            Learn More
          </a>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-10 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] tracking-[0.3em] text-white/20 uppercase">Scroll</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}>
            <ChevronDown size={16} className="text-white/20" />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          2. ECOSYSTEM (Tool Cards)
      ════════════════════════════════════════════ */}
      <section id="ecosystem" className="relative py-28 px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center">

          <FadeUp>
            <SectionLabel text="The Ecosystem" />
            <p className="text-center text-gray-400 font-light max-w-md mx-auto mb-16 leading-relaxed">
              Three specialized AI engines working together seamlessly.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            {tools.map((tool) => (
              <FadeUp key={tool.name} delay={tool.delay}>
                <Link href={tool.path} className="group block relative">
                  {/* Outer glow */}
                  <div className={`absolute -inset-0.5 bg-gradient-to-r ${tool.gradient} rounded-[2rem] blur opacity-30 group-hover:opacity-70 transition duration-700 group-hover:duration-200`} />

                  {/* Card */}
                  <div className={`relative h-[420px] rounded-[2rem] bg-[#0a0a0a]/90 backdrop-blur-md border ${tool.border} ${tool.hoverBorder} p-10 flex flex-col items-center justify-center text-center shadow-2xl overflow-hidden transition-all duration-500`}>

                    {/* Top scan line */}
                    <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent ${tool.accent.replace('text-', 'via-')} to-transparent scan-h opacity-50`} />

                    {/* Icon */}
                    <div className="mb-8 relative flex items-center justify-center w-28 h-28 float">
                      <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-25 blur-2xl rounded-full`} />
                      <div className={`relative z-10 p-6 rounded-3xl ${tool.bg} border border-white/10 shadow-2xl group-hover:scale-110 transition-transform duration-500`}>
                        <tool.Icon size={44} className={`${tool.accent} drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]`} />
                      </div>
                    </div>

                    {/* Name */}
                    <h2 className="text-3xl font-bold text-white tracking-widest font-orbitron mb-1">{tool.name}</h2>

                    {/* Role label */}
                    <p className={`text-xs font-bold tracking-[0.25em] uppercase ${tool.accent} opacity-70 mb-4`}>{tool.label}</p>

                    {/* Micro description */}
                    <p className="text-gray-500 text-sm font-light leading-relaxed group-hover:text-gray-300 transition-colors max-w-[220px]">
                      {tool.micro}
                    </p>

                    {/* Enter pill */}
                    <div className={`mt-auto px-5 py-1.5 rounded-full border border-white/8 ${tool.bg} text-[10px] tracking-[0.25em] uppercase ${tool.accent} opacity-60 group-hover:opacity-100 transition-all flex items-center gap-2`}>
                      Enter <ArrowRight size={10} />
                    </div>
                  </div>
                </Link>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          3. HOW IT WORKS
      ════════════════════════════════════════════ */}
      <section className="relative py-24 px-6">
        <div className="max-w-5xl mx-auto flex flex-col items-center">

          <FadeUp>
            <SectionLabel text="How It Works" />
            <h2 className="text-center text-3xl font-bold text-white tracking-wide font-orbitron mt-2 mb-16">
              Three Steps. Infinite Clarity.
            </h2>
          </FadeUp>

          <div className="relative w-full flex flex-col md:flex-row items-center gap-0">
            {steps.map((step, i) => (
              <div key={step.n} className="flex-1 flex flex-col md:flex-row items-center w-full">
                <FadeUp delay={i * 0.15} className="flex-1 w-full">
                  {/* Glass panel */}
                  <div className="relative group mx-2">
                    <div className="absolute -inset-px bg-gradient-to-b from-purple-500/20 to-transparent rounded-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative rounded-2xl bg-white/[0.03] border border-white/8 backdrop-blur-md p-8 text-center hover:bg-white/[0.05] transition-all duration-500">
                      <span className="block text-[10px] font-bold tracking-[0.35em] text-purple-400/50 mb-3">STEP {step.n}</span>
                      <h3 className="text-lg font-bold text-white tracking-widest font-orbitron mb-3">{step.title}</h3>
                      <p className="text-gray-500 text-sm font-light leading-relaxed">{step.body}</p>
                    </div>
                  </div>
                </FadeUp>

                {/* Arrow connector */}
                {i < steps.length - 1 && (
                  <div className="hidden md:flex items-center justify-center px-2 shrink-0">
                    <div className="arrow-pulse text-purple-500/40">
                      <ArrowRight size={20} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          4. ABOUT
      ════════════════════════════════════════════ */}
      <section id="about" className="relative py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <FadeUp>
            <div className="relative group">
              <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-purple-500/20 via-transparent to-indigo-500/10 opacity-70" />
              <div className="relative rounded-3xl bg-white/[0.025] border border-white/8 backdrop-blur-xl p-14 text-center">
                <SectionLabel text="About" />
                <h2 className="text-3xl font-bold text-white font-orbitron tracking-wider mt-2 mb-6">
                  What is ALTRIX?
                </h2>

                <p className="text-gray-400 font-light leading-relaxed mb-10 max-w-xl mx-auto text-sm">
                  ALTRIX is a next-generation AI research platform combining humanization, deep analysis, and innovation engines into one cohesive intelligence suite.
                </p>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {stats.map((s, i) => (
                    <div key={i} className="relative group/stat">
                      <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-purple-500/15 to-transparent opacity-0 group-hover/stat:opacity-100 transition-opacity" />
                      <div className="relative rounded-2xl bg-white/[0.03] border border-white/8 p-5">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mx-auto mb-3 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                        <p className="text-white font-semibold text-sm tracking-wide mb-1">{s.label}</p>
                        <p className="text-gray-600 text-xs font-light">{s.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          5. FUTURE VISION
      ════════════════════════════════════════════ */}
      <section className="relative py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <FadeUp>
            <div className="relative group rounded-3xl overflow-hidden">
              {/* Subtle animated gradient border */}
              <div className="absolute -inset-px rounded-3xl bg-gradient-to-r from-purple-600/30 via-indigo-600/20 to-purple-600/30 opacity-60 group-hover:opacity-90 transition-opacity duration-700" />

              <div className="relative rounded-3xl bg-[#07020f]/80 border border-white/5 backdrop-blur-xl p-16 text-center">
                <SectionLabel text="Vision" />
                <h2 className="text-3xl font-bold text-white font-orbitron tracking-wider mt-2 mb-6">
                  The Future of Research Intelligence
                </h2>
                <p className="text-gray-400 font-light leading-relaxed max-w-lg mx-auto text-sm">
                  We are building a fully integrated AI lab environment where creativity, analysis, and authenticity converge.
                </p>

                {/* Animated gradient line */}
                <div className="mt-12 relative h-px w-full overflow-hidden rounded-full">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                  />
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          6. FOOTER
      ════════════════════════════════════════════ */}
      <footer className="relative py-10 px-8">
        {/* Glow separator */}
        <div className="mb-8 h-px w-full bg-gradient-to-r from-transparent via-purple-500/25 to-transparent" />

        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-xs tracking-widest font-orbitron">ALTRIX © 2026</p>

          <div className="flex items-center gap-6">
            {["Privacy", "Terms", "Contact"].map((l) => (
              <a key={l} href="#" className="text-gray-600 hover:text-gray-400 text-xs tracking-widest transition-colors">
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>

    </main>
  );
}
