import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from "react";
import SeaScene, { type SeaEngine, type SeaTheme } from "@/components/SeaScene";
import type { DuelShip } from "@/game/duel";

/** Visible band of the 1428×2560 sea image: centred on the open water. */
const ASPECT = 2560 / 1428;
const FOCUS = 0.72;

/**
 * Battle formation: every ship sails its own row (depth lane).
 * Row 0 = vanguard (closest to the enemy), row 2 = rear flagship. Each row has two spots (A/B).
 * Farther rows are drawn smaller for depth.
 */
const ROWS = [
  { y: 0.64, w: 0.13, x: [0.3, 0.62] },
  { y: 0.73, w: 0.15, x: [0.22, 0.7] },
  { y: 0.83, w: 0.17, x: [0.34, 0.78] },
];
export const SHIP_Y = ROWS[1]!.y;
const row = (ship: number) => ROWS[ship] ?? ROWS[1]!;

/** Horizontal slot (uv) for ship i standing in spot A(0) / B(1). */
export const slotX = (ship: number, spot: number) => row(ship).x[spot ? 1 : 0]!;

export type SeaGeom = { w: number; h: number; top: number; H: number };
export type BattleSeaApi = {
  /** Point on screen (px, relative to this panel) for a ship slot; lift = fraction of hull height above the waterline. */
  point: (ship: number, spot: number, lift: number) => { x: number; y: number };
  /** Hull size on screen in px (for shields that must wrap the whole ship). */
  hullSize: (ship: number) => { w: number; h: number };
  pause: (ms: number) => void;
  /** Physical shove of a hull (uv units): recoil when firing, jolt when hit. */
  kick: (ship: number, dx: number, dy: number) => void;
};

type Props = {
  theme: SeaTheme;
  ships: DuelShip[];
  hull: string;
  /** Enemy sea is mirrored so their bows face ours. */
  mirrored?: boolean;
  stormy?: boolean;
  children?: (geom: SeaGeom, point: BattleSeaApi["point"], hullSize: BattleSeaApi["hullSize"]) => ReactNode;
};

export const BattleSea = forwardRef<BattleSeaApi, Props>(function BattleSea({ theme, ships, hull, mirrored, stormy, children }, ref) {
  const box = useRef<HTMLDivElement>(null);
  const eng = useRef<SeaEngine | null>(null);
  const [geom, setGeom] = useState<SeaGeom>({ w: 400, h: 300, top: 0, H: 700 });
  const xs = useRef<number[]>([]);
  const kicks = useRef<{ dx: number; dy: number }[]>([]);
  const sink = useRef<number[]>([]);
  const shipsRef = useRef(ships);
  shipsRef.current = ships;
  const pausedUntil = useRef(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = box.current!;
    const apply = () => {
      const w = el.clientWidth, h = el.clientHeight, H = w * ASPECT;
      setGeom({ w, h, H, top: h / 2 - FOCUS * H });
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Glide hulls between spots (eased, frame-rate independent) and feed them into the water.
  useEffect(() => {
    let raf = 0, last = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const frozen = Date.now() < pausedUntil.current;
      const list = shipsRef.current;
      const out = list.map((s, i) => {
        const r = row(i);
        const target = slotX(i, s.spot);
        const cur = xs.current[i] ?? target;
        const next = frozen ? cur : cur + (target - cur) * (1 - Math.exp(-dt * 4.2));
        xs.current[i] = next;
        const k = kicks.current[i] ?? { dx: 0, dy: 0 };
        if (!frozen) { const d = Math.exp(-dt * 7); k.dx *= d; k.dy *= d; }
        kicks.current[i] = k;
        let sk = sink.current[i] ?? 0;
        if (!s.alive && !frozen) sk = Math.min(1, sk + dt * 0.7);
        if (s.alive) sk = 0;
        sink.current[i] = sk;
        return { id: `s${i}`, src: hull, x: next + k.dx, y: r.y + k.dy + sk * 0.05, width: r.w * (1 - sk * 0.25), waterline: 0.86 - sk * 0.5, visible: s.alive || sk < 1 };
      });
      eng.current?.setShips(out);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hull]);

  const point: BattleSeaApi["point"] = (ship, spot, lift) => {
    const r = row(ship);
    const ux = xs.current[ship] !== undefined && spot === shipsRef.current[ship]?.spot ? xs.current[ship]! : slotX(ship, spot);
    const sx = (mirrored ? 1 - ux : ux) * geom.w;
    const hullH = r.w * geom.w * 0.55;
    return { x: sx, y: geom.top + r.y * geom.H - lift * hullH };
  };
  const hullSize: BattleSeaApi["hullSize"] = (ship) => { const r = row(ship); return { w: r.w * geom.w, h: r.w * geom.w * 0.55 }; };

  useImperativeHandle(ref, () => ({
    point,
    hullSize,
    pause: (ms) => {
      pausedUntil.current = Date.now() + ms;
      setPaused(true);
      window.setTimeout(() => { if (Date.now() >= pausedUntil.current) setPaused(false); }, ms + 10);
    },
    kick: (ship, dx, dy) => {
      const k = kicks.current[ship] ?? { dx: 0, dy: 0 };
      k.dx += mirrored ? -dx : dx; k.dy += dy;
      kicks.current[ship] = k;
    },
  }));

  const params = stormy ? { amp: 1.6, spd: 1.4, foam: 1.2, rip: 1.5, ref: 1.3, paused } : { paused };

  return (
    <div ref={box} className="bt-sea">
      <div className="bt-sea-canvas" style={{ top: geom.top, height: geom.H, transform: mirrored ? "scaleX(-1)" : undefined }}>
        <SeaScene theme={theme} params={params} onEngine={(e) => (eng.current = e)} style={{ aspectRatio: "auto", height: "100%" }} />
      </div>
      {children?.(geom, point, hullSize)}
    </div>
  );
});
