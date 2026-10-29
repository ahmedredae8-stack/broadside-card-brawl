import { useEffect, useRef } from "react";
import { createSeaScene } from "./seaScene";
export type SeaTheme = { id: string; name?: string; bg: string; mask: string; sky?: [number, number, number]; sun?: [number, number, number]; foam?: number };
export type SeaShip = { id: string; src: string; x: number; y: number; width?: number; waterline?: number; visible?: boolean };
export type SeaParams = { amp?: number; spd?: number; ref?: number; sun?: number; foam?: number; rip?: number; paused?: boolean };
export type SeaEngine = { setShips: (s: SeaShip[]) => void };
type Props = {
  theme: SeaTheme;
  ships?: SeaShip[];
  params?: SeaParams;
  className?: string;
  style?: React.CSSProperties;
  /** Receives the live engine so callers can stream ship positions every frame. */
  onEngine?: (e: SeaEngine | null) => void;
};
export default function SeaScene({ theme, ships, params, className, style, onEngine }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const eng = useRef<any>(null);
  useEffect(() => {
    eng.current = createSeaScene(ref.current!, { params });
    onEngine?.(eng.current);
    return () => { onEngine?.(null); eng.current.destroy(); };
  }, []);
  useEffect(() => { eng.current?.setScene(theme); }, [theme.id, theme.bg, theme.mask]);
  useEffect(() => { if (ships) eng.current?.setShips(ships); }, [JSON.stringify(ships ?? null)]);
  useEffect(() => { eng.current?.setParams(params || {}); }, [JSON.stringify(params || {})]);
  return <canvas ref={ref} className={className} style={{ width: "100%", aspectRatio: "1080 / 1935", display: "block", ...style }} />;
}
