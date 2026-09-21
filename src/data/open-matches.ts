/**
 * Open match sessions — mock data for the Programme & Event page. The final
 * schedule is always announced by the venue via Instagram/WhatsApp, so the UI
 * carries a "sample schedule" note next to these sessions (PRD Fase 3).
 */
import type { Localized } from "./localized";

export interface OpenMatch {
  id: string;
  /** Session day label, e.g. "Sabtu, 26 Sep 2026". */
  day: Localized;
  /** Session hours, e.g. "19.00–21.00". */
  time: string;
  /** Skill level of the session. */
  level: Localized;
  courtNote: Localized;
  spotsTotal: number;
  spotsLeft: number;
}

export const openMatches: OpenMatch[] = [
  {
    id: "open-match-weekend",
    day: { id: "Sabtu, 26 Sep 2026", en: "Saturday, 26 Sep 2026" },
    time: "19.00–21.00",
    level: { id: "Semua level", en: "All levels" },
    courtNote: { id: "Court 1", en: "Court 1" },
    spotsTotal: 8,
    spotsLeft: 5,
  },
  {
    id: "open-match-midweek",
    day: { id: "Rabu, 30 Sep 2026", en: "Wednesday, 30 Sep 2026" },
    time: "20.00–22.00",
    level: { id: "Menengah ke atas", en: "Intermediate & up" },
    courtNote: { id: "Court 2", en: "Court 2" },
    spotsTotal: 8,
    spotsLeft: 2,
  },
  {
    id: "open-match-fun",
    day: { id: "Minggu, 4 Okt 2026", en: "Sunday, 4 Oct 2026" },
    time: "08.00–10.00",
    level: { id: "Pemula & pemain baru", en: "Beginners & new players" },
    courtNote: { id: "Court 1 & 2", en: "Courts 1 & 2" },
    spotsTotal: 8,
    spotsLeft: 0,
  },
];
