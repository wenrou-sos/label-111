import { create } from "zustand";
import { addMonths, format, subMonths } from "date-fns";

interface FilterState {
  start: string;
  end: string;
  tier: string;
  league: string;
  channel: string;
  setStart: (v: string) => void;
  setEnd: (v: string) => void;
  setTier: (v: string) => void;
  setLeague: (v: string) => void;
  setChannel: (v: string) => void;
  reset: () => void;
  setRange: (range: string) => void;
}

const today = new Date();
const threeMonthsAgo = subMonths(today, 3);

const defaultStart = format(threeMonthsAgo, "yyyy-MM-dd");
const defaultEnd = format(today, "yyyy-MM-dd");

export const useFilterStore = create<FilterState>((set) => ({
  start: defaultStart,
  end: defaultEnd,
  tier: "all",
  league: "all",
  channel: "all",
  setStart: (v) => set({ start: v }),
  setEnd: (v) => set({ end: v }),
  setTier: (v) => set({ tier: v }),
  setLeague: (v) => set({ league: v }),
  setChannel: (v) => set({ channel: v }),
  reset: () => set({ start: defaultStart, end: defaultEnd, tier: "all", league: "all", channel: "all" }),
  setRange: (range) => {
    const now = new Date();
    let start = defaultStart;
    let end = defaultEnd;
    if (range === "7d") {
      start = format(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");
    } else if (range === "30d") {
      start = format(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");
    } else if (range === "90d") {
      start = format(subMonths(now, 3), "yyyy-MM-dd");
    } else if (range === "1y") {
      start = format(subMonths(now, 12), "yyyy-MM-dd");
    }
    set({ start, end });
  },
}));
