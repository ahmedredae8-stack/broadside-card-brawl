import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Crosshair, Shield, Swords, X, Zap } from "lucide-react";

import { CaptainAvatar } from "@/components/GameSprite";
import ShieldOverlay, { type ShieldState } from "@/shields/ShieldOverlay";
import WeaponsLayer, { type WeaponsApi } from "@/fx/weapons/WeaponsLayer";
import { playFireEvent, type DuelFireEvent, type DuelHit, type PlayCtx } from "@/fx/weapons/playFireEvent";
import { BattleSea, type BattleSeaApi } from "@/components/battle/BattleSea";
import { CFG, SHIELDS, WEAPONS, mulberry, newState, type DuelState, type Side } from "@/game/duel";
import { fleetCatalog } from "@/lib/fleetCatalog";
import { SEA_WORLDS, loadSeaWorldId, getSeaWorld } from "@/lib/seaWorld";
import { playSfx } from "@/lib/sound";
import type { Player } from "@/lib/player";

/** Standard war loadout until owned weapons are recorded per ship. Same for both captains: fair duels. */
export const LOADOUT = {
  ships: [
    { weapons: ["cannon", "mortar"], spot: 0 },
    { weapons: ["cannon", "missile"], spot: 1 },
    { weapons: ["cannon", "torpedo"], spot: 0 },
  ],
  shields: [1, 2, 3],
};

export const powerOf = (p: Pick<Player, "score">) => 1000 + (p.score ?? 0);

/* ── Clash rules: real-time energy and cards. Damage numbers come from duel.js WEAPONS/SHIELDS. ── */
export const MANA_MAX = 10;
export const MATCH_SECONDS = 120;
export const OVERTIME_AT = 30; // last 30s: energy flows twice as fast
export const MANA_PER_SEC = 0.75;
export type CardId = "cannon" | "missile" | "mortar" | "torpedo" | "shield" | "royal";
export const CARDS: { id: CardId; cost: number; name: string; icon: string; note: string }[] = [
  { id: "cannon", cost: 2, name: "المدفع", icon: "💣", note: `ضرر ${WEAPONS["cannon"]!.dmg}` },
  { id: "missile", cost: 3, name: "الصواريخ", icon: "🚀", note: "تتبع الهدف" },
  { id: "mortar", cost: 4, name: "الهاون", icon: "💥", note: `ضرر ${WEAPONS["mortar"]!.dmg} + شظايا` },
  { id: "torpedo", cost: 5, name: "الطوربيد", icon: "🔱", note: "يخترق الدروع" },
  { id: "shield", cost: 3, name: SHIELDS[2]!.name, icon: "🛡️", note: "يصد ضربة" },
  { id: "royal", cost: 6, name: "الدرع الملكي", icon: "👑", note: "يعكس الضرر" },
];
export const cardCost = (id: CardId) => CARDS.find((c) => c.id === id)!.cost;
export const manaRate = (secondsLeft: number) => MANA_PER_SEC * (secondsLeft <= OVERTIME_AT ? 2 : 1);

/** Lab controls (admin battle studio). */
export type LabOpts = { infinite: boolean; bot: boolean; outcome: "auto" | "hit" | "miss" | "blocked"; dmgX: number; regenX: number };

const hashSeed = (s: string) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const worldFor = (p: Player) => SEA_WORLDS[hashSeed(p.id) % SEA_WORLDS.length]!;
const other = (s: Side): Side => (s === "a" ? "b" : "a");

type Float = { id: number; side: Side; ship: number; text: string; tone: "dmg" | "block" | "miss" | "info" | "crit" };
type ShieldFx = Record<string, { state: ShieldState; trig: number }>;

export function BattleScreen({ me, foe, onClose, lab, labKey }: { me: Player; foe: Player; onClose: () => void; lab?: LabOpts; labKey?: number }) {
  const seed = useMemo(() => hashSeed(`${me.id}|${foe.id}|${Date.now()}`), [me.id, foe.id]);
  const [stage, setStage] = useState<"vs" | "arena">(lab ? "arena" : "vs");
  return stage === "vs"
    ? <VsScreen me={me} foe={foe} onGo={() => setStage("arena")} onClose={onClose} />
    : <Arena key={labKey ?? 0} me={me} foe={foe} seed={seed} onClose={onClose} lab={lab} />;
}

/* ── Epic face-off: storm, captains clash in the middle, war cry, 3-2-1 ── */
function VsScreen({ me, foe, onGo, onClose }: { me: Player; foe: Player; onGo: () => void; onClose: () => void }) {
  const [t, setT] = useState(0); // tenths of a second
  useEffect(() => {
    const id = window.setInterval(() => setT((v) => v + 1), 100);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    if (t === 9) playSfx("click", 1);
    if (t === 22) playSfx("click", 0.9);
    if (t === 34 || t === 44 || t === 54) playSfx("hover", 0.8);
    if (t >= 64) onGo();
  }, [t, onGo]);
  const count = t < 34 ? null : t < 44 ? 3 : t < 54 ? 2 : t < 64 ? 1 : null;
  return (
    <div className="bt-root bt-vs bt-storm" dir="rtl" role="dialog" aria-label="بدء المعركة">
      <div className="bt-lightning" aria-hidden="true" />
      <div className="bt-rain" aria-hidden="true" />
      <button type="button" className="tos-x bt-close" aria-label="انسحاب" onClick={onClose}><X className="h-4 w-4" /></button>
      <p className="bt-kicker">نداء الحرب</p>
      <div className={t >= 9 ? "bt-vs-row clashed" : "bt-vs-row"}>
        <VsCard p={me} label="أنت" side="a" />
        <div className="bt-vs-mid">
          <strong className={t >= 9 ? "bt-vs-word slam" : "bt-vs-word"}>VS</strong>
          {t >= 9 && <span className="bt-sparks" aria-hidden="true" />}
        </div>
        <VsCard p={foe} label="الخصم" side="b" />
      </div>
      <div className="bt-vs-stage" aria-live="polite">
        {t >= 22 && count === null && t < 64 && <strong className="bt-warcry">إلى المدافع!</strong>}
        {count !== null && <b className="bt-count" key={count}>{count}</b>}
      </div>
      <button type="button" className="tos-btn bt-skip" onClick={onGo}>ابدأ الآن</button>
    </div>
  );
}

function VsCard({ p, label, side }: { p: Player; label: string; side: Side }) {
  return (
    <div className={`bt-vs-card bt-vs-card-${side}`}>
      <CaptainAvatar seed={p.avatar_index ?? 0} url={p.avatar_url} className="bt-vs-photo" />
      <small>{label}</small>
      <strong>{p.name}</strong>
      <span><Swords className="h-3.5 w-3.5" /> {powerOf(p).toLocaleString("ar")}</span>
    </div>
  );
}

/* ── Real-time arena: energy fills, cards fire instantly, both captains act at once ── */
function Arena({ me, foe, seed, onClose, lab }: { me: Player; foe: Player; seed: number; onClose: () => void; lab?: LabOpts | undefined }) {
  const rnd = useRef(mulberry(seed)).current;
  const [view, setView] = useState<DuelState>(() => newState({ first: "a", a: LOADOUT, b: LOADOUT }));
  const live = useRef(view);
  const [mana, setMana] = useState({ a: 4, b: 4 });
  const manaRef = useRef({ a: 4, b: 4 });
  const [left, setLeft] = useState(MATCH_SECONDS);
  const [card, setCard] = useState<CardId | null>(null);
  const [over, setOver] = useState<Side | "draw" | null>(null);
  const [floats, setFloats] = useState<Float[]>([]);
  const [shieldFx, setShieldFx] = useState<ShieldFx>({});
  const [banner, setBanner] = useState<{ text: string; id: number } | null>(null);
  const shieldsLeft = useRef({ a: 3, b: 3 });
  const busy = useRef<Record<string, boolean>>({});
  const queue = useRef<Promise<void>>(Promise.resolve());
  const root = useRef<HTMLDivElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const seas = useRef<HTMLDivElement>(null);
  const layer = useRef<WeaponsApi>(null);
  const top = useRef<BattleSeaApi>(null);
  const bottom = useRef<BattleSeaApi>(null);
  const topBox = useRef<HTMLDivElement>(null);
  const bottomBox = useRef<HTMLDivElement>(null);
  const fid = useRef(0);
  const firing = useRef<{ side: Side; ship: number } | null>(null);
  const labRef = useRef(lab);
  labRef.current = lab;
  const overRef = useRef(over);
  overRef.current = over;

  const myWorld = getSeaWorld(loadSeaWorldId());
  const foeWorld = worldFor(foe);
  const hull = fleetCatalog[0]!.hull;

  const commitView = (fn: (s: DuelState) => void) => { const n = structuredClone(live.current); fn(n); live.current = n; setView(n); };
  const float = (side: Side, ship: number, text: string, tone: Float["tone"]) => {
    const id = ++fid.current;
    setFloats((f) => [...f, { id, side, ship, text, tone }]);
    window.setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 1400);
  };
  const shout = (text: string) => { const id = ++fid.current; setBanner({ text, id }); window.setTimeout(() => setBanner((b) => (b?.id === id ? null : b)), 1500); };
  const shieldState = (side: Side, ship: number, s: ShieldState) => setShieldFx((m) => ({ ...m, [`${side}${ship}`]: { state: s, trig: (m[`${side}${ship}`]?.trig ?? 0) + 1 } }));

  const at = (side: Side, ship: number, spot: number, lift: number) => {
    const r = root.current!.getBoundingClientRect();
    const p = (side === "b" ? topBox : bottomBox).current!.getBoundingClientRect();
    const q = (side === "b" ? top : bottom).current!.point(ship, spot, lift);
    return { x: p.left - r.left + q.x, y: p.top - r.top + q.y };
  };

  // Clock + energy. Lab: optional infinite energy and faster regen.
  useEffect(() => {
    if (over) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now(), dt = (now - last) / 1000; last = now;
      const L = labRef.current;
      setLeft((s) => {
        const next = L ? s : Math.max(0, s - dt);
        const rate = manaRate(next) * (L?.regenX ?? 1) * dt;
        const m = manaRef.current;
        m.a = L?.infinite ? MANA_MAX : Math.min(MANA_MAX, m.a + rate);
        m.b = Math.min(MANA_MAX, m.b + rate);
        setMana({ ...m });
        if (next <= 0) finish();
        return next;
      });
    }, 100);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over]);

  const hpSum = (s: DuelState, side: Side) => s[side].ships.reduce((x, y) => x + Math.max(0, y.hp), 0);
  const finish = () => {
    if (overRef.current) return;
    const s = live.current, a = hpSum(s, "a"), b = hpSum(s, "b");
    const w: Side | "draw" = a === b ? "draw" : a > b ? "a" : "b";
    setOver(w);
    playSfx("click", 1);
  };
  const checkEnd = () => {
    const s = live.current;
    if (labRef.current) {
      // Lab: refloat a sunk fleet so testing never stops.
      (["a", "b"] as Side[]).forEach((side) => {
        if (s[side].ships.every((x) => !x.alive)) window.setTimeout(() => commitView((n) => n[side].ships.forEach((x) => { x.alive = true; x.hp = x.max; x.shield = null; })), 2200);
      });
      return;
    }
    if (s.a.ships.every((x) => !x.alive) || s.b.ships.every((x) => !x.alive)) window.setTimeout(finish, 1800);
  };

  /** Cinematic death cam: slow-mo, camera dives to the wreck, war shout. */
  const deathCam = (side: Side, ship: number) => {
    const s = seas.current, r = root.current;
    if (!s || !r) return;
    const p = at(side, ship, live.current[side].ships[ship]!.spot, 0.4);
    const sr = s.getBoundingClientRect(), rr = r.getBoundingClientRect();
    const ox = p.x - (sr.left - rr.left), oy = p.y - (sr.top - rr.top);
    s.style.transformOrigin = `${ox}px ${oy}px`;
    s.animate([{ transform: "scale(1)", filter: "saturate(1)" }, { transform: "scale(1.7)", filter: "saturate(.5) contrast(1.2)", offset: 0.3 }, { transform: "scale(1.7)", filter: "saturate(.5) contrast(1.2)", offset: 0.75 }, { transform: "scale(1)", filter: "saturate(1)" }], { duration: 2200, easing: "cubic-bezier(.2,.8,.2,1)" });
    top.current?.pause(320); bottom.current?.pause(320);
    flash.current?.animate([{ opacity: 0.85 }, { opacity: 0 }], { duration: 500 });
    root.current?.animate([{ transform: "translate(9px,-5px)" }, { transform: "translate(-8px,4px)" }, { transform: "translate(4px,2px)" }, { transform: "none" }], { duration: 600 });
    shout(side === "b" ? "سفينة العدو غرقت!" : "سفينتك تغرق!");
    playSfx("click", 1);
    window.setTimeout(() => playSfx("click", 0.7), 280);
  };

  const damage = (side: Side, ship: number, dmg: number) => {
    let died = false;
    commitView((n) => { const s = n[side].ships[ship]!; if (!s.alive) return; s.hp = Math.max(0, s.hp - dmg); if (s.hp === 0) { s.alive = false; s.shield = null; died = true; } });
    if (died) { float(side, ship, "غرقت!", "crit"); deathCam(side, ship); checkEnd(); }
  };

  /** Build a duel fire event from current positions (same numbers as duel.js), honouring lab overrides. */
  const strike = (side: Side, ship: number, weapon: string, target: number): DuelFireEvent => {
    const def = other(side), T = live.current[def].ships[target]!;
    const wp = WEAPONS[weapon]!;
    const L = side === "a" ? labRef.current : undefined;
    const mult = L?.dmgX ?? 1;
    // The enemy captain may slip aside at the last second (spot weapons only).
    let spot = T.spot;
    const dodge = !L && wp.aim === "spot" && rnd() < (def === "b" ? 0.22 : 0.15);
    let kind: DuelHit["kind"] = "hit";
    let dmg = Math.round(wp.dmg * mult);
    const tier = T.shield?.tier;
    const forced = L?.outcome && L.outcome !== "auto" ? L.outcome : null;
    if (forced === "miss" || (!forced && dodge && !wp.splash)) { kind = "miss"; dmg = 0; if (dodge) spot = T.spot ? 0 : 1; }
    else if (!forced && dodge && wp.splash) { kind = "splash"; dmg = Math.round(wp.splash * mult); }
    if (forced === "blocked" || (!forced && kind !== "miss" && tier && SHIELDS[tier]!.blocks.includes(wp.type))) {
      const t = tier ?? 1;
      const reflect = SHIELDS[t]!.reflect ? { ship, dmg: Math.round(dmg * SHIELDS[t]!.reflect) } : undefined;
      return { t: "fire", side, ship, weapon, aim: { ship: target, spot: T.spot }, hits: [{ side: def, ship: target, spot: T.spot, kind: "blocked", dmg: 0, tier: t, ...(reflect ? { reflect } : {}) }] };
    }
    return { t: "fire", side, ship, weapon, aim: { ship: target, spot: kind === "miss" ? (T.spot ? 0 : 1) : T.spot }, hits: [{ side: def, ship: target, spot, kind, dmg }] };
  };

  const fire = (ev: DuelFireEvent) => {
    const key = `${ev.side}${ev.ship}`;
    busy.current[key] = true;
    const run = async () => {
      if (overRef.current || !layer.current) return;
      const ctx: PlayCtx = {
        layer: layer.current,
        launchPoint: (side, ship, kind) => at(side, ship, live.current[side].ships[ship]!.spot, kind === "waterline" ? 0 : 0.8),
        spotCenter: (side, ship, spot) => at(side, ship, spot, 0.45),
        onMissileImpact: (_i, e) => { const h = e.hits[0]; if (h && h.kind !== "miss" && h.kind !== "blocked") float(h.side, h.ship, "−10", "dmg"); },
        onUnsupported: () => undefined,
        onImpact: (e) => {
          for (const h of e.hits) {
            if (h.kind === "blocked") {
              shieldState(h.side, h.ship, h.reflect ? "reflect" : "hit");
              float(h.side, h.ship, h.reflect ? "انعكاس!" : "صدّ الدرع!", "block");
              commitView((n) => { const s = n[h.side].ships[h.ship]!; if (s.shield) { s.shield.hits -= 1; if (s.shield.hits <= 0) { shieldState(h.side, h.ship, "break"); window.setTimeout(() => commitView((m) => { m[h.side].ships[h.ship]!.shield = null; }), 600); } } });
              if (h.reflect) { const r = h.reflect; float(e.side, r.ship, `↩ −${r.dmg}`, "dmg"); damage(e.side, r.ship, r.dmg); }
            } else if (h.kind === "miss") float(h.side, h.ship, "طاشت!", "miss");
            else {
              if (e.weapon !== "missile") float(h.side, h.ship, h.kind === "splash" ? `شظايا −${h.dmg}` : `−${h.dmg}`, h.dmg >= 36 ? "crit" : "dmg");
              (h.side === "b" ? top : bottom).current?.kick(h.ship, 0.02, 0.008);
              damage(h.side, h.ship, h.dmg);
            }
          }
        },
      };
      firing.current = { side: ev.side, ship: ev.ship };
      try { await playFireEvent(ev, ctx); } finally { firing.current = null; busy.current[key] = false; }
    };
    queue.current = queue.current.then(run, run);
  };

  const gunner = (side: Side, weapon: string) => live.current[side].ships.findIndex((s, i) => s.alive && s.weapons.some((w) => w.id === weapon) && !busy.current[`${side}${i}`]);

  /** Spend energy and play a card. Returns false when it can't be played. */
  const play = (side: Side, id: CardId, target: number): boolean => {
    const cost = cardCost(id), m = manaRef.current;
    if (overRef.current || m[side] < cost) return false;
    if (id === "shield" || id === "royal") {
      const s = live.current[side].ships[target];
      if (!s?.alive || s.shield) return false;
      if (!(side === "a" && labRef.current) && shieldsLeft.current[side] <= 0) return false;
      const tier = id === "royal" ? 5 : 2;
      shieldsLeft.current[side] -= 1;
      m[side] -= cost; setMana({ ...m });
      commitView((n) => { n[side].ships[target]!.shield = { tier, hits: SHIELDS[tier]!.hits }; });
      shieldState(side, target, "spawn");
      float(side, target, "درع!", "block");
      playSfx("click", 0.6);
      return true;
    }
    const g = gunner(side, id);
    const t = live.current[other(side)].ships[target];
    if (g < 0 || !t?.alive) return false;
    m[side] -= cost; setMana({ ...m });
    fire(strike(side, g, id, target));
    return true;
  };

  // Enemy bot: watches its energy and plays cards like a captain would.
  useEffect(() => {
    if (over) return;
    const id = window.setInterval(() => {
      if (labRef.current && !labRef.current.bot) return;
      const s = live.current, m = manaRef.current.b;
      const mineAlive = s.b.ships.map((x, i) => ({ x, i })).filter((o) => o.x.alive);
      const foes = s.a.ships.map((x, i) => ({ x, i })).filter((o) => o.x.alive);
      if (!mineAlive.length || !foes.length) return;
      const hurt = mineAlive.filter((o) => !o.x.shield && o.x.hp <= o.x.max * 0.5).sort((p, q) => p.x.hp - q.x.hp)[0];
      if (hurt && m >= 3 && shieldsLeft.current.b > 0 && rnd() < 0.5) { play("b", m >= 6 && rnd() < 0.4 ? "royal" : "shield", hurt.i); return; }
      const weak = [...foes].sort((p, q) => p.x.hp - q.x.hp)[0]!;
      const shielded = !!weak.x.shield;
      const order: CardId[] = shielded ? ["torpedo", "missile", "cannon"] : m >= 8 ? ["torpedo", "mortar", "missile", "cannon"] : ["mortar", "missile", "cannon"];
      if (rnd() < 0.35) return; // breathe: saves energy for heavier cards
      for (const c of order) if (m >= cardCost(c) && gunner("b", c) >= 0) { play("b", c, weak.i); return; }
    }, 900);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over]);

  const hooks = {
    onShake: (a: number, ms: number) => root.current?.animate([{ transform: `translate(${a}px,${-a / 2}px)` }, { transform: `translate(${-a}px,${a / 2}px)` }, { transform: "translate(0,0)" }], { duration: ms, easing: "ease-out" }),
    onZoom: (s: number, ms: number) => seas.current?.animate([{ transform: "scale(1)" }, { transform: `scale(${s})` }, { transform: "scale(1)" }], { duration: ms, easing: "ease-out" }),
    onFlash: (a: number, ms: number) => flash.current?.animate([{ opacity: a }, { opacity: 0 }], { duration: ms }),
    onHitStop: (ms: number) => { top.current?.pause(ms); bottom.current?.pause(ms); },
    onRecoil: (weapon: string) => {
      const f = firing.current; if (!f) return;
      const api = (f.side === "b" ? top : bottom).current;
      if (weapon === "cannon") api?.kick(f.ship, -0.035, 0);
      else if (weapon === "torpedo") api?.kick(f.ship, -0.015, 0.004);
      else api?.kick(f.ship, 0, 0.012);
    },
  };

  const onTarget = (side: Side, i: number) => {
    if (!card) return;
    if (play("a", card, i)) { playSfx("click", 0.7); if (!labRef.current) setCard(null); }
    else playSfx("hover", 0.4);
  };

  const total = CFG.shipHp * 3;
  const isShieldCard = card === "shield" || card === "royal";
  const overtime = !lab && left <= OVERTIME_AT;

  const overlay = (side: Side) => (_g: unknown, point: BattleSeaApi["point"], hullSize: BattleSeaApi["hullSize"]) => view[side].ships.map((s, i) => {
    const hs = hullSize(i);
    const p = point(i, s.spot, 1.05);
    const fx = shieldFx[`${side}${i}`];
    const base = point(i, s.spot, 0);
    const targetable = s.alive && !over && card && (isShieldCard ? side === "a" && !s.shield : side === "b");
    const c = point(i, s.spot, 0.45);
    return (
      <div key={i}>
        {s.alive && (
          <div className={s.hp <= s.max * 0.3 ? "bt-hp low" : "bt-hp"} style={{ left: p.x, top: p.y }}>
            <i style={{ width: `${(s.hp / s.max) * 100}%` }} />
            <b>{s.hp}</b>
          </div>
        )}
        {s.alive && s.shield && (
          <div className="bt-shield" style={{ left: base.x, top: base.y - hs.h * 0.45, width: hs.w * 1.35, height: hs.h * 2.3 }}>
            <ShieldOverlay tier={s.shield.tier as 1 | 2 | 3 | 4 | 5} state={fx?.state ?? "idle"} trigger={fx?.trig ?? 0} width="100%" />
          </div>
        )}
        {floats.filter((f) => f.side === side && f.ship === i).map((f) => (
          <span key={f.id} className={`bt-float bt-float-${f.tone}`} style={{ left: p.x, top: p.y }}>{f.text}</span>
        ))}
        {targetable && (
          <button type="button" className={isShieldCard ? "bt-target bt-target-own" : "bt-target"} style={{ left: c.x, top: c.y, width: hs.w * 1.1, height: hs.h * 1.4 }} onClick={() => onTarget(side, i)} aria-label={isShieldCard ? `درّع سفينتك ${i + 1}` : `اضرب سفينة العدو ${i + 1}`}>
            {isShieldCard ? <Shield /> : <Crosshair />}
          </button>
        )}
      </div>
    );
  });

  const mm = Math.floor(left / 60), ss = Math.floor(left % 60);

  return (
    <div className={overtime ? "bt-root bt-arena bt-overtime" : "bt-root bt-arena"} dir="rtl" ref={root} role="dialog" aria-label="ساحة المعركة">
      <header className="bt-top">
        <SideBar p={foe} hp={hpSum(view, "b")} total={total} />
        <div className="bt-round"><small>{lab ? "المختبر" : overtime ? "طاقة ×2" : "الوقت"}</small><b>{lab ? "∞" : `${mm}:${String(ss).padStart(2, "0")}`}</b></div>
        <button type="button" className="tos-x bt-close" aria-label="انسحاب" onClick={onClose}><X className="h-4 w-4" /></button>
      </header>
      <div className="bt-seas" ref={seas}>
        <div className="bt-panel bt-panel-foe" ref={topBox}>
          <BattleSea ref={top} theme={foeWorld} ships={view.b.ships} hull={hull} mirrored stormy>{overlay("b")}</BattleSea>
          <span className="bt-tag">{foe.name} <Bot className="h-3 w-3" /> <em>⚡{Math.floor(mana.b)}</em></span>
        </div>
        <div className="bt-divider">
          <span className="bt-turn me">{over ? "انتهت المعركة" : card ? (isShieldCard ? "اختر سفينتك لتدريعها" : "اضغط سفينة العدو!") : "اختر بطاقة"}</span>
        </div>
        <div className="bt-panel bt-panel-me" ref={bottomBox}>
          <BattleSea ref={bottom} theme={myWorld} ships={view.a.ships} hull={hull} stormy>{overlay("a")}</BattleSea>
          <span className="bt-tag">{me.name}</span>
        </div>
      </div>
      <WeaponsLayer ref={layer} {...hooks} />
      <div className="bt-flash" ref={flash} />
      {banner && <strong className="bt-shout" key={banner.id}>{banner.text}</strong>}

      {!over && (
        <footer className="bt-deck">
          <div className="bt-mana" aria-label={`الطاقة ${Math.floor(mana.a)} من ${MANA_MAX}`}>
            <Zap className="bt-mana-ico" />
            <div className="bt-mana-track">
              <i style={{ width: `${(mana.a / MANA_MAX) * 100}%` }} />
              {Array.from({ length: MANA_MAX - 1 }, (_, k) => <s key={k} style={{ left: `${((k + 1) / MANA_MAX) * 100}%` }} />)}
            </div>
            <b>{Math.floor(mana.a)}</b>
          </div>
          <div className="bt-cards">
            {CARDS.map((c) => {
              const isShield = c.id === "shield" || c.id === "royal";
              const noShip = !isShield && gunner("a", c.id) < 0 && !view.a.ships.some((s) => s.alive && s.weapons.some((w) => w.id === c.id));
              const outOfShields = isShield && !lab && shieldsLeft.current.a <= 0;
              const ready = mana.a >= c.cost && !noShip && !outOfShields;
              return (
                <button key={c.id} type="button" className={`bt-card bt-card-${c.id}${card === c.id ? " on" : ""}${ready ? " ready" : ""}`} disabled={noShip || outOfShields} onClick={() => { setCard(card === c.id ? null : c.id); playSfx("click", 0.5); }} aria-pressed={card === c.id}>
                  <span className="bt-card-cost">{c.cost}</span>
                  <span className="bt-card-art" aria-hidden="true">{c.icon}</span>
                  <strong>{c.name}</strong>
                  <small>{outOfShields ? "نفدت" : c.note}</small>
                  {!ready && !noShip && !outOfShields && <i className="bt-card-fill" style={{ height: `${100 - Math.min(100, (mana.a / c.cost) * 100)}%` }} />}
                </button>
              );
            })}
          </div>
          {!lab && <p className="bt-hint">دروعك المتبقية: {shieldsLeft.current.a} — {overtime ? "الطاقة تتدفق بسرعة مضاعفة!" : "الطاقة تمتلئ تلقائياً"}</p>}
        </footer>
      )}

      {over && (
        <div className="bt-result" role="status">
          <h2 className={over === "a" ? "win" : ""}>{over === "a" ? "انتصار!" : over === "b" ? "هزيمة" : "تعادل"}</h2>
          <p>{hpSum(view, "a")} ضد {hpSum(view, "b")} نقطة صمود</p>
          <button type="button" className="tos-btn" onClick={onClose}>العودة للبحر</button>
        </div>
      )}
    </div>
  );
}

function SideBar({ p, hp, total }: { p: Player; hp: number; total: number }) {
  return (
    <div className="bt-side">
      <CaptainAvatar seed={p.avatar_index ?? 0} url={p.avatar_url} className="bt-side-photo" />
      <div><strong>{p.name}</strong><span className="bt-side-bar"><i style={{ width: `${(hp / total) * 100}%` }} /></span></div>
    </div>
  );
}
