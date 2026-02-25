import { create } from "zustand";

interface HistoryPanelStore {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
}

export const useHistoryPanel = create<HistoryPanelStore>((set) => ({
    isOpen: false,
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
    toggle: () => set((s) => ({ isOpen: !s.isOpen })),
}));
