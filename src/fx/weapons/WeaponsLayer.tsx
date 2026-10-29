import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
// @ts-ignore  (ملفات JS)
import { createCannonFx } from "./cannonFx";
// @ts-ignore
import { createMortarFx } from "./mortarFx";
// @ts-ignore
import { createMissileFx } from "./missileFx";
// @ts-ignore
import { createTorpedoFx } from "./torpedoFx";

export type WeaponId = "cannon" | "mortar" | "missile" | "torpedo";
export type Outcome = "hit" | "miss" | "blocked" | "splash";
export type Pt = { x: number; y: number };
export type FireArgs = {
  weapon: WeaponId;
  from: Pt;                       // نقطة خروج المقذوف (فوهة على السطح، أو خط الماء للطوربيد)
  to: Pt;                         // مركز الهدف بالبكسل داخل هذه الطبقة
  outcome?: Outcome;              // hits[i].kind من حدث fire في duel.js
  shieldColor?: string | undefined;           // عند blocked
  track?: () => Pt;               // اختياري: موضع الهدف الحالي إن تحرك (صواريخ وطوربيد)
  onImpact?: () => void;          // لحظة الاصطدام الفعلية (اخصم الحياة هنا)
  onMissileImpact?: (index: number, outcome: Outcome) => void; // للصواريخ: عند كل صاروخ
};
export type WeaponsApi = {
  fire: (a: FireArgs) => Promise<void>; // يكتمل بعد انتهاء أثر الاصطدام
  clear: () => void;
  setTimeScale: (v: number) => void;
  setSalvo: (n: number) => void;        // عدد الصواريخ (1 إلى 5)
  stats: () => Record<string, any>;     // عدد الجسيمات الحية لكل سلاح (للقياس)
};
type Hooks = {
  onShake?: (amplitudePx: number, ms: number) => void;   // اهتزاز الشاشة
  onZoom?: (scale: number, ms: number) => void;          // دفعة تكبير للمشهد (الهاون والصواريخ والطوربيد)
  onFlash?: (alpha: number, ms: number) => void;         // وميض أبيض فوق الشاشة
  onHitStop?: (ms: number) => void;                      // أوقف حركة العالم هذه المدة (البحر والسفن)
  onRecoil?: (weapon: WeaponId, angleRad: number) => void; // ارتداد سفينة المهاجم
  onPhase?: (weapon: WeaponId, phase: number) => void;   // مراحل 1 إلى 5 (للواجهة إن أردت)
  config?: Partial<Record<WeaponId, Record<string, any>>>; // تعديل أرقام أي سلاح
};
const FACTORY: Record<WeaponId, any> = { cannon: createCannonFx, mortar: createMortarFx, missile: createMissileFx, torpedo: createTorpedoFx };

// الطبقة تغطي شاشة المعركة كلها (position:absolute; inset:0) فوق البحر والسفن. المحركات تُنشأ عند أول استعمال لكل سلاح.
const WeaponsLayer = forwardRef<WeaponsApi, Hooks>((props, ref) => {
  const box = useRef<HTMLDivElement>(null);
  const hooks = useRef<Hooks>(props); hooks.current = props;
  const engines = useRef<Partial<Record<WeaponId, any>>>({});
  const pending = useRef<Partial<Record<WeaponId, FireArgs>>>({});
  const size = useRef({ w: 450, h: 500, d: 1 });

  const get = (w: WeaponId) => {
    if (engines.current[w]) return engines.current[w];
    const H = () => hooks.current;
    const e = FACTORY[w](box.current!, {
      config: H().config?.[w],
      onShake: (a: number, ms: number) => H().onShake?.(a, ms),
      onZoom: (s: number, ms: number) => H().onZoom?.(s, ms),
      onFlash: (a: number, ms: number) => H().onFlash?.(a, ms),
      onHitStop: (ms: number) => H().onHitStop?.(ms),
      onRecoil: (ang: number) => H().onRecoil?.(w, ang),
      onPhase: (p: number) => H().onPhase?.(w, p),
      onImpact: () => pending.current[w]?.onImpact?.(),
      onMissileImpact: (i: number, o: Outcome) => pending.current[w]?.onMissileImpact?.(i, o),
    });
    e.resize(size.current.w, size.current.h, size.current.d);
    engines.current[w] = e;
    return e;
  };

  useEffect(() => {
    const root = box.current!;
    const apply = () => {
      size.current = { w: root.clientWidth, h: root.clientHeight, d: Math.min(window.devicePixelRatio || 1, 2) };
      Object.values(engines.current).forEach((e: any) => e.resize(size.current.w, size.current.h, size.current.d));
    };
    apply();
    const ro = new ResizeObserver(apply); ro.observe(root);
    return () => ro.disconnect();
  }, []);

  useImperativeHandle(ref, () => ({
    fire: (a) => {
      pending.current[a.weapon] = a;
      const outcome = a.weapon !== "mortar" && a.outcome === "splash" ? "hit" : a.outcome;
      return get(a.weapon).fire({ from: a.from, to: a.to, outcome, shieldColor: a.shieldColor, track: a.track });
    },
    clear: () => Object.values(engines.current).forEach((e: any) => e.clear()),
    setTimeScale: (v) => Object.values(engines.current).forEach((e: any) => e.setTimeScale(v)),
    setSalvo: (n) => get("missile").setSalvo(n),
    stats: () => Object.fromEntries(Object.entries(engines.current).map(([k, e]: any) => [k, e.stats ? e.stats() : null])),
  }));

  return <div ref={box} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />;
});
export default WeaponsLayer;
