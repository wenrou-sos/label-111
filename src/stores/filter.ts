import { create } from "zustand";
import { addMonths, format, subMonths } from "date-fns";

function getRangeDates(range: string, ref = new Date()) {
  let start = format(subMonths(ref, 3), "yyyy-MM-dd");
  let end = format(ref, "yyyy-MM-dd");
  if (range === "7d") {
    start = format(new Date(ref.getTime() - 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");
  } else if (range === "30d") {
    start = format(new Date(ref.getTime() - 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");
  } else if (range === "90d") {
    start = format(subMonths(ref, 3), "yyyy-MM-dd");
  } else if (range === "1y") {
    start = format(subMonths(ref, 12), "yyyy-MM-dd");
  }
  return { start, end };
}

interface FilterState {
  start: string;
  end: string;
  tier: string;
  league: string;
  channel: string;
  compareMode: boolean;
  compareStart: string;
  compareEnd: string;
  setStart: (v: string) => void;
  setEnd: (v: string) => void;
  setTier: (v: string) => void;
  setLeague: (v: string) => void;
  setChannel: (v: string) => void;
  reset: () => void;
  setRange: (range: string) => void;
  setCompareMode: (v: boolean) => void;
  setCompareStart: (v: string) => void;
  setCompareEnd: (v: string) => void;
  setCompareRange: (range: string) => void;
}

const today = new Date();
const defaultMain = getRangeDates("90d", today);
const compareRef = new Date(defaultMain.start + "T00:00:00");
compareRef.setDate(compareRef.getDate() - 1);
const defaultCompare = getRangeDates("90d", compareRef);

const defaultStart = defaultMain.start;
const defaultEnd = defaultMain.end;

export const useFilterStore = create<FilterState>((set) => ({
  start: defaultStart,
  end: defaultEnd,
  tier: "all",
  league: "all",
  channel: "all",
  compareMode: false,
  compareStart: defaultCompare.start,
  compareEnd: defaultCompare.end,
  setStart: (v) => set({ start: v }),
  setEnd: (v) => set({ end: v }),
  setTier: (v) => set({ tier: v }),
  setLeague: (v) => set({ league: v }),
  setChannel: (v) => set({ channel: v }),
  reset: () =>
    set({
      start: defaultStart,
      end: defaultEnd,
      tier: "all",
      league: "all",
      channel: "all",
      compareMode: false,
      compareStart: defaultCompare.start,
      compareEnd: defaultCompare.end,
    }),
  setRange: (range) => {
    const r = getRangeDates(range);
    set({ start: r.start, end: r.end });
  },
  setCompareMode: (v) => set({ compareMode: v }),
  setCompareStart: (v) => set({ compareStart: v }),
  setCompareEnd: (v) => set({ compareEnd: v }),
  setCompareRange: (range) => {
    const r = getRangeDates(range);
    set({ compareStart: r.start, compareEnd: r.end });
  },
}));

export { getRangeDates };
