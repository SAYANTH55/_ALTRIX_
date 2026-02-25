"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Zap, Layers, Cpu, Clock } from "lucide-react";
import { useHistoryPanel } from "@/lib/history-store";

const navItems = [
    { name: "Sentic", path: "/sentic", icon: Zap, color: "text-purple-400" },
    { name: "Alamix", path: "/alamix", icon: Layers, color: "text-blue-400" },
    { name: "Deoza", path: "/deoza", icon: Cpu, color: "text-emerald-400" },
];

export default function NavigationRail() {
    const pathname = usePathname();
    const { toggle } = useHistoryPanel();

    // Only show history button on tool pages (not landing)
    const onToolPage = navItems.some((item) => pathname.startsWith(item.path));

    return (
        <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="fixed left-0 top-0 h-full w-20 flex flex-col items-center py-8 z-50 bg-white/5 backdrop-blur-xl border-r border-white/10"
        >
            <Link href="/" className="mb-12 p-2 hover:bg-white/10 rounded-xl transition-all relative group" aria-label="Dashboards">
                <Home className="text-white/70 hover:text-white" />

                {/* Home Tooltip */}
                <span className="absolute left-14 top-1/2 -translate-y-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10 ml-2">
                    Dashboards
                </span>
            </Link>

            <div className="flex flex-col gap-8 w-full items-center flex-1">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.path);
                    const Icon = item.icon;

                    return (
                        <Link key={item.name} href={item.path} className="relative group w-full flex justify-center">
                            {isActive && (
                                <motion.div
                                    layoutId="activeNav"
                                    className="absolute left-0 w-1 h-8 bg-white rounded-r-full top-1/2 -translate-y-1/2 shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                                />
                            )}

                            <div className={`p-3 rounded-xl transition-all duration-300 relative ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                                <Icon
                                    size={24}
                                    className={`transition-all duration-300 ${isActive ? item.color : 'text-gray-400 group-hover:text-gray-200'}`}
                                />

                                {/* Tooltip */}
                                <span className="absolute left-14 top-1/2 -translate-y-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10 ml-2">
                                    {item.name}
                                </span>

                                {/* Glow effect on hover */}
                                <div className={`absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity ${item.color.replace('text-', 'bg-')}/20 -z-10`} />
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* History button — bottom of rail, only on tool pages */}
            {onToolPage && (
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={toggle}
                    className="relative group p-3 rounded-xl hover:bg-white/5 transition-all"
                    title="History"
                >
                    <Clock size={22} className="text-gray-400 group-hover:text-white transition-colors" />
                    <span className="absolute left-14 top-1/2 -translate-y-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10 ml-2">
                        History
                    </span>
                </motion.button>
            )}
        </motion.div>
    );
}
