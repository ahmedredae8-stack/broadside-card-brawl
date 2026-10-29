
import throneCoastImg from "@/assets/scenes/throne-coast.jpg.asset.json";

export type Phase = "day" | "night";

export type Scene = { video: string; poster: string };

/** Ambient soundtrack key played while a world is on screen. */
export type AmbientKey = "waves" | "night" | "winter" | "wall" | "spring" | "city";

export type Theme = {
  id: string;
  name: string;
  day: Scene;
  night: Scene;
  /** Shown while the bay is under attack. */
  burned?: Scene;
  ambient: { day: AmbientKey; night: AmbientKey };
};

export const themes: Theme[] = [
  {
    id: "throne-coast",
    name: "ساحل العرش",
    day: { video: "", poster: throneCoastImg.url },
    night: { video: "", poster: throneCoastImg.url },
    ambient: { day: "waves", night: "night" },
  },
];

export const defaultTheme = themes[0]!;

/** Daylight runs 06:00 → 18:00 on the player's own clock, night the other half. */
export const DAY_START_HOUR = 6;
export const NIGHT_START_HOUR = 18;

export function currentPhase(now: Date | number = Date.now()): Phase {
  const d = typeof now === "number" ? new Date(now) : now;
  const h = d.getHours();
  return h >= DAY_START_HOUR && h < NIGHT_START_HOUR ? "day" : "night";
}

/** Milliseconds left before the world flips between day and night. */
export function msUntilNextPhase(now: Date | number = Date.now()): number {
  const d = typeof now === "number" ? new Date(now) : new Date(now.getTime());
  const next = new Date(d);
  next.setMinutes(0, 0, 0);
  const h = d.getHours();
  if (h < DAY_START_HOUR) next.setHours(DAY_START_HOUR);
  else if (h < NIGHT_START_HOUR) next.setHours(NIGHT_START_HOUR);
  else {
    next.setDate(next.getDate() + 1);
    next.setHours(DAY_START_HOUR);
  }
  return Math.max(1000, next.getTime() - d.getTime());
}

export function phaseLabel(p: Phase) {
  return p === "day" ? "ضوء الشمس" : "ضوء القمر";
}

/** "٣ س ٢٤ د" style countdown to the next flip. */
export function phaseCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return h > 0 ? `${h}س ${m}د` : `${m}د`;
}

export function getScene(theme: Theme, phase: Phase, burning = false): Scene {
  if (burning && theme.burned) return theme.burned;
  return phase === "day" ? theme.day : theme.night;
}

export function getAmbient(theme: Theme, phase: Phase): AmbientKey {
  return phase === "day" ? theme.ambient.day : theme.ambient.night;
}

const KEY = "bay:theme";

export function loadThemeId(): string {
  if (typeof window === "undefined") return defaultTheme.id;
  try {
    const saved = window.localStorage.getItem(KEY);
    return themes.some((t) => t.id === saved) ? saved! : defaultTheme.id;
  } catch {
    return defaultTheme.id;
  }
}

export function saveThemeId(id: string) {
  try {
    window.localStorage.setItem(KEY, id);
  } catch {
    /* ignore */
  }
}

export function getTheme(id: string): Theme {
  return themes.find((t) => t.id === id) ?? defaultTheme;
}

/** Fixed points of interest inside the scene artwork (all worlds share the composition).
 *  x/y = center in %, w/h = invisible tap-area size in % of the stage. */
export const hotspots = [
  { id: "fish", to: "/fish-market", label: "سوق السمك", x: 13, y: 44, w: 26, h: 20 },
  { id: "ship", to: "/shipyard", label: "سوق السفن", x: 82, y: 37, w: 30, h: 22 },
] as const;
