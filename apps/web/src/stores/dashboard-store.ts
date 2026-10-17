import { create } from "zustand";

type DashboardState = {
  query: string;
  paletteOpen: boolean;
  newOpen: boolean;
  setQuery: (query: string) => void;
  setPaletteOpen: (open: boolean) => void;
  togglePalette: () => void;
  setNewOpen: (open: boolean) => void;
  reset: () => void;
};

// Dashboard screen UI only: the forms filter and which overlays are open. Form data lives in `forms-store.ts`.
export const useDashboardStore = create<DashboardState>()((set) => ({
  query: "",
  paletteOpen: false,
  newOpen: false,

  setQuery: (query) => set({ query }),
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  togglePalette: () => set((s) => ({ paletteOpen: !s.paletteOpen })),
  setNewOpen: (newOpen) => set({ newOpen }),
  reset: () => set({ query: "", paletteOpen: false, newOpen: false }),
}));
