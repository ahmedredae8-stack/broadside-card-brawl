import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
// @ts-ignore  (ملفات JS)
import { createCannonFx } from "./cannonFx";
// @ts-ignore
import { createMortarFx } from "./mortarFx";
// @ts-ignore
import { createMissileFx } from "./missileFx";
// @ts-ignore
import { createTorpedoFx } from "./torpedoFx";
// @ts-ignore
import { createFireFx } from "./fireFx";
// @ts-ignore
import { createFrostFx } from "./frostFx";
// @ts-ignore
import { createHarpoonFx } from "./harpoonFx";

export type WeaponId = "cannon" | "mortar" | "missile" | "torpedo" | "fire_barrel" | "frost_shell" | "harpoon";
export type Outcome = "hit" | "miss" | "blocked" | "splash";
export type Pt = { x: number; y: number };
export type FireArgs = {
  weapon: WeaponId;
  from: Pt;                       // نقطة خروج المقذوف (فوهة على السطح، أو خط الماء للطوربيد)
  to: Pt;                         // مركز الهدف بالبكسل داخل هذه الطبقة
  outcome?: Outcome;              // hits[i].kind من حدث fire في duel.js
  shieldColor?: string;           // عند blocked
  track?: () => Pt;               // اختياري: موضع الهدف الحالي إن تحرك (صواريخ وطوربيد)
  onImpact?: () => void;          // لحظة الاصطدام الفعلية (اخصم الحياة هنا)
  onMissileImpact?: (index: number, outcome: Outcome) => void; // للصواريخ: عند كل صاروخ
  pin?: { key: string; track?: () => Pt };                      // للحربة: عند الإصابة تُثبَّت السفينة (key = "a:0") ويبقى الحبل مشدودًا
  fromTrack?: () => Pt;                                         // للحربة: موضع فوهة المهاجم الحالي (للحبل). بدونه يُستعمل from الثابت
  freeze?: { key: string; track?: () => Pt };                  // للصقيع: عند الإصابة تتجمد السفينة (key = "a:0") وتتبع track
  burn?: { key: string; track?: () => Pt; rounds?: number }; // للجمرة: عند الإصابة تشتعل السفينة (key = "a:0" مثلًا) وتتبع track
};
export type WeaponsApi = {
  fire: (a: FireArgs) => Promise<void>; // يكتمل بعد انتهاء أثر الاصطدام
  clear: () => void;
  setTimeScale: (v: number) => void;
  setSalvo: (n: number) => void;        // عدد الصواريخ (1 إلى 5)
  stats: () => Record<string, any>;     // عدد الجسيمات الحية لكل سلاح (للقياس)
  // الحرق المستمر (الجمرة): 3 جولات. المفتاح يميّز السفينة، مثل "b:1".
  ignite: (key: string, o: { track?: () => Pt; pos?: Pt; rounds?: number }) => void;
  burnTick: (key: string, o?: { track?: () => Pt }) => number; // مع حدث burn: نبضة لهب، ويعيد الجولات المتبقية
  extinguish: (key: string, mode?: "end" | "dead") => void;    // "dead" عند تدمير السفينة
  burning: () => string[];
  // التجميد (الصقيع). المفتاح نفسه "side:ship".
  freeze: (key: string, o?: { track?: () => Pt; pos?: Pt; instant?: boolean }) => void; // instant: بلا نمو (لاستعادة حالة)
  thaw: (key: string, mode?: "melt" | "dead") => void;  // ذوبان، أو "dead" عند تدمير السفينة
  shatter: (key: string) => boolean;                     // ضربة حركية على سفينة متجمدة (تحطّم ×2)
  shiver: (key: string) => void;                         // moveFail «مجمّدة»
  frozen: () => string[];
  // التثبيت (الحربة). المفتاح نفسه "side:ship".
  pin: (key: string, o?: { track?: () => Pt; fromTrack?: () => Pt; from?: Pt; pos?: Pt; ang?: number; instant?: boolean }) => void; // instant: بلا ارتجاج بداية (لاستعادة حالة)
  unpin: (key: string, mode?: "free" | "dead") => void;  // تخرج الحربة وتُسحب، أو "dead" عند تدمير السفينة
  shiverPin: (key: string) => void;                       // moveFail «مثبّتة»
  pinned: () => string[];
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
const FACTORY: Record<WeaponId, any> = { cannon: createCannonFx, mortar: createMortarFx, missile: createMissileFx, torpedo: createTorpedoFx, fire_barrel: createFireFx, frost_shell: createFrostFx, harpoon: createHarpoonFx };

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
      return get(a.weapon).fire({ from: a.from, to: a.to, outcome, shieldColor: a.shieldColor, track: a.track, burn: a.burn, freeze: a.freeze, pin: a.pin, fromTrack: a.fromTrack });
    },
    // تنبيه: clear() يطفئ الحرائق المشتعلة أيضًا. استدعه عند نهاية المعركة فقط، لا بين الجولات.
    clear: () => Object.values(engines.current).forEach((e: any) => e.clear()),
    setTimeScale: (v) => Object.values(engines.current).forEach((e: any) => e.setTimeScale(v)),
    setSalvo: (n) => get("missile").setSalvo(n),
    ignite: (key, o) => get("fire_barrel").ignite(key, o),
    burnTick: (key, o) => get("fire_barrel").burnTick(key, o),
    extinguish: (key, mode) => engines.current.fire_barrel?.extinguish(key, mode),
    burning: () => engines.current.fire_barrel?.burning() ?? [],
    freeze: (key, o) => get("frost_shell").freeze(key, o),
    thaw: (key, mode) => engines.current.frost_shell?.thaw(key, mode),
    shatter: (key) => engines.current.frost_shell?.shatter(key) ?? false,
    shiver: (key) => engines.current.frost_shell?.shiver(key),
    frozen: () => engines.current.frost_shell?.frozen() ?? [],
    pin: (key, o) => get("harpoon").pin(key, o),
    unpin: (key, mode) => engines.current.harpoon?.release(key, mode),
    shiverPin: (key) => engines.current.harpoon?.shiver(key),
    pinned: () => engines.current.harpoon?.pinned() ?? [],
    stats: () => Object.fromEntries(Object.entries(engines.current).map(([k, e]: any) => [k, e.stats ? e.stats() : null])),
  }));

  return <div ref={box} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />;
});
export default WeaponsLayer;
