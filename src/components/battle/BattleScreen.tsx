import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Crosshair, Shield, Swords, X, Zap } from "lucide-react";

import cannonArt from "@/assets/cards/cannon.jpg";
import mortarArt from "@/assets/cards/mortar.jpg";
import missileArt from "@/assets/cards/missile.jpg";
import torpedoArt from "@/assets/cards/torpedo.jpg";
import fireBarrelArt from "@/assets/cards/fire_barrel.jpg";
import frostShellArt from "@/assets/cards/frost_shell.jpg";
import harpoonArt from "@/assets/cards/harpoon.jpg";
import shieldArt from "@/assets/cards/shield.jpg";
import royalArt from "@/assets/cards/royal.jpg";

import { CaptainAvatar } from "@/components/GameSprite";
import ShieldOverlay, { type ShieldState } from "@/shields/ShieldOverlay";
import WeaponsLayer, { type WeaponsApi } from "@/fx/weapons/WeaponsLayer";
import {
  playFireEvent,
  playBurnEvent,
  playDeadFlames,
  playMoveFail,
  syncIce,
  syncPin,
  type DuelFireEvent,
  type DuelHit,
  type PlayCtx,
} from "@/fx/weapons/playFireEvent";
import { BattleSea, type BattleSeaApi } from "@/components/battle/BattleSea";
import { CFG, SHIELDS, WEAPONS, mulberry, newState, type DuelState, type Side } from "@/game/duel";
import { fleetCatalog } from "@/lib/fleetCatalog";
import { DuelSession, type DuelWire } from "@/lib/duelNet";
import { SEA_WORLDS, loadSeaWorldId, getSeaWorld } from "@/lib/seaWorld";
import { playSfx } from "@/lib/sound";
import type { Player } from "@/lib/player";

/** Standard war loadout until owned weapons are recorded per ship. Same for both captains: fair duels. */
export const LOADOUT = {
  ships: [
    { weapons: ["cannon", "mortar", "fire_barrel"], spot: 0 },
    { weapons: ["cannon", "missile", "harpoon"], spot: 1 },
    { weapons: ["cannon", "torpedo", "frost_shell"], spot: 0 },
  ],
  shields: [1, 2, 3],
};

export const powerOf = (p: Pick<Player, "score">) => 1000 + (p.score ?? 0);

/* ── Clash rules: real-time energy and cards. Damage numbers come from duel.js WEAPONS/SHIELDS. ── */
export const MANA_MAX = 10;
export const MATCH_SECONDS = 120;
export const OVERTIME_AT = 30; // last 30s: energy flows twice as fast
export const MANA_PER_SEC = 0.75;
/** The enemy captain gathers energy a bit slower than the player so duels are winnable. */
export const BOT_MANA_FACTOR = 0.8;
export type CardId = "cannon" | "missile" | "mortar" | "torpedo" | "fire_barrel" | "frost_shell" | "harpoon" | "shield" | "royal";
export const CARDS: { id: CardId; cost: number; name: string; art: string; note: string }[] = [
  { id: "cannon", cost: 2, name: "المدفع", art: cannonArt, note: `ضرر ${WEAPONS["cannon"]!.dmg}` },
  { id: "missile", cost: 3, name: "الصواريخ", art: missileArt, note: "تتبع الهدف" },
  { id: "mortar", cost: 4, name: "الهاون", art: mortarArt, note: `ضرر ${WEAPONS["mortar"]!.dmg} + شظايا` },
  { id: "torpedo", cost: 5, name: "الطوربيد", art: torpedoArt, note: "يخترق الدروع" },
  { id: "fire_barrel", cost: 4, name: "الجمرة", art: fireBarrelArt, note: "حرق 8 لثلاث جولات" },
  { id: "frost_shell", cost: 4, name: "الصقيع", art: frostShellArt, note: "تجميد وضربة حركية ×2" },
  { id: "harpoon", cost: 3, name: "الحربة", art: harpoonArt, note: "تثبيت: لا تفلت من الضربة" },
  { id: "shield", cost: 3, name: SHIELDS[2]!.name, art: shieldArt, note: "يصد ضربة" },
  { id: "royal", cost: 6, name: "الدرع الملكي", art: royalArt, note: "يعكس الضرر" },
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

export function BattleScreen({ me, foe, onClose, lab, labKey, online }: { me: Player; foe: Player; onClose: () => void; lab?: LabOpts; labKey?: number; online?: { matchId: string; role: "host" | "guest" } }) {
  const seed = useMemo(() => hashSeed(`${me.id}|${foe.id}|${Date.now()}`), [me.id, foe.id]);
  const [stage, setStage] = useState<"vs" | "arena">(lab ? "arena" : "vs");
  return stage === "vs"
    ? <VsScreen me={me} foe={foe} onGo={() => setStage("arena")} onClose={onClose} />
    : <Arena key={labKey ?? 0} me={me} foe={foe} seed={seed} onClose={onClose} lab={lab} online={online} />;
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
function Arena({ me, foe, seed, onClose, lab, online }: { me: Player; foe: Player; seed: number; onClose: () => void; lab?: LabOpts | undefined; online?: { matchId: string; role: "host" | "guest" } | undefined }) {
  const rnd = useRef(mulberry(seed)).current;
  const [view, setView] = useState<DuelState>(() => newState({ first: "a", a: LOADOUT, b: LOADOUT }));
  const live = useRef(view);
  const [mana, setMana] = useState({ a: 4, b: 4 });
  const manaRef = useRef({ a: 4, b: 4 });
  const [left, setLeft] = useState(MATCH_SECONDS);
  const [card, setCard] = useState<CardId | null>(null);
  const [dropHot, setDropHot] = useState<string | null>(null);
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

  // Live duel: my canonical side (host plays "a") and the network session.
  const myS: Side = online?.role === "guest" ? "b" : "a";
  const foeS: Side = other(myS);
  const session = useRef<DuelSession | null>(null);
  const [foeMana, setFoeMana] = useState(4);
  const onlineRef = useRef(online);
  onlineRef.current = online;

  const myWorld = getSeaWorld(loadSeaWorldId());
  const foeWorld = worldFor(foe);
  const hull = fleetCatalog[0]!.hull;

  // Live duel: open the battle channel and replay every play the rival captain makes.
  useEffect(() => {
    if (!online) return;
    const s = DuelSession.open(online.matchId, online.role, {
      onEvent: (ev: DuelWire) => {
        if (ev.t === "fire") { setFoeMana((v) => Math.max(0, v - ev.cost)); fire(ev.ev); }
        else if (ev.t === "shield") {
          setFoeMana((v) => Math.max(0, v - ev.cost));
          if (shieldsLeft.current[ev.side] > 0) shieldsLeft.current[ev.side] -= 1;
          commitView((n) => { const t = n[ev.side].ships[ev.ship]; if (t?.alive && !t.shield) t.shield = { tier: ev.tier, hits: SHIELDS[ev.tier]!.hits }; });
          shieldState(ev.side, ev.ship, "spawn");
          float(ev.side, ev.ship, "درع!", "block");
        } else if (ev.t === "burn") {
          const L = layer.current;
          if (!L) return;
          void playBurnEvent({ t: "burn", side: ev.side, ship: ev.ship, dmg: ev.dmg }, {
            layer: L,
            shipCenter,
            onBurn: (e) => { float(e.side, e.ship, `حرق −${e.dmg}`, "dmg"); damage(e.side, e.ship, e.dmg); },
          });
          commitView((n) => { const t = n[ev.side].ships[ev.ship]; if (t?.alive) t.burn = Math.max(0, ev.burnLeft); });
          syncAuras();
        } else if (ev.t === "move") {
          commitView((n) => { const t = n[ev.side].ships[ev.ship]; if (t?.alive) t.spot = ev.spot; });
          playSfx("click", 0.4);
        } else if (ev.t === "leave") {
          if (!overRef.current) { shout("انسحب الخصم!"); window.setTimeout(finish, 400); }
        }
      },
      onFoeGone: () => { if (!overRef.current) { shout("انقطع اتصال الخصم!"); window.setTimeout(finish, 400); } },
      onError: () => shout("تعذّر الاتصال بغرفة Playroom — تحقّق من إعداد معرف اللعبة"),
    });
    session.current = s;
    return () => { s.close(); session.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online?.matchId]);

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
    const p = (side === foeS ? topBox : bottomBox).current!.getBoundingClientRect();
    const q = (side === foeS ? top : bottom).current!.point(ship, spot, lift);
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
        if (online) m[myS] = Math.min(MANA_MAX, m[myS] + rate);
        else {
          m.a = L?.infinite ? MANA_MAX : Math.min(MANA_MAX, m.a + rate);
          m.b = Math.min(MANA_MAX, m.b + rate * BOT_MANA_FACTOR);
        }
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
    shout(side === foeS ? "سفينة العدو غرقت!" : "سفينتك تغرق!");
    playSfx("click", 1);
    window.setTimeout(() => playSfx("click", 0.7), 280);
  };

  const damage = (side: Side, ship: number, dmg: number) => {
    let died = false;
    commitView((n) => { const s = n[side].ships[ship]!; if (!s.alive) return; s.hp = Math.max(0, s.hp - dmg); if (s.hp === 0) { s.alive = false; s.shield = null; s.burn = 0; s.frozen = false; s.lock = 0; died = true; } });
    if (died) {
      // Sudfires die with their ship: flames out, ice melts, harpoon drops.
      if (layer.current) playDeadFlames(side, ship, layer.current);
      float(side, ship, "غرقت!", "crit"); deathCam(side, ship); checkEnd();
    }
  };

  /** Build a duel fire event from current positions (same numbers as duel.js), honouring lab overrides. */
  const strike = (side: Side, ship: number, weapon: string, target: number): DuelFireEvent => {
    const def = other(side), T = live.current[def].ships[target]!;
    const wp = WEAPONS[weapon]!;
    const L = side === "a" ? labRef.current : undefined;
    const mult = L?.dmgX ?? 1;
    // The enemy captain may slip aside at the last second (spot weapons only) — but a frozen or harpooned ship cannot dodge.
    let spot = T.spot;
    const pinned = T.frozen || T.lock > 0;
    // Aimed cards always land: no random dodges (a dropped card must feel like a hit).
    void pinned; void rnd;
    const dodge = false;
    let kind: DuelHit["kind"] = "hit";
    let dmg = Math.round(wp.dmg * mult);
    const tags: string[] = [];
    const tier = T.shield?.tier;
    const forced = L?.outcome && L.outcome !== "auto" ? L.outcome : null;
    if (forced === "miss" || (!forced && dodge && !wp.splash)) { kind = "miss"; dmg = 0; if (dodge) spot = T.spot ? 0 : 1; }
    else if (!forced && dodge && wp.splash) { kind = "splash"; dmg = Math.round(wp.splash * mult); }
    else if (!forced && wp.type === "kinetic" && T.frozen) { dmg *= 2; tags.push("تحطّم ×2"); }
    if (forced === "blocked" || (!forced && (kind === "hit" || kind === "splash") && tier && SHIELDS[tier]!.blocks.includes(wp.type))) {
      const t = tier ?? 1;
      const reflect = SHIELDS[t]!.reflect ? { ship, dmg: Math.round(dmg * SHIELDS[t]!.reflect) } : undefined;
      return { t: "fire", side, ship, weapon, aim: { ship: target, spot: T.spot }, hits: [{ side: def, ship: target, spot: T.spot, kind: "blocked", dmg: 0, tier: t, tags, ...(reflect ? { reflect } : {}) }] };
    }
    if (kind === "hit" || kind === "splash") {
      if (wp.burn) tags.push("حرق");
      if (wp.freeze) tags.push("تجميد");
      if (wp.pin) tags.push("تثبيت");
    }
    return { t: "fire", side, ship, weapon, aim: { ship: target, spot: kind === "miss" ? (T.spot ? 0 : 1) : T.spot }, hits: [{ side: def, ship: target, spot, kind, dmg, tags }] };
  };

  const shipCenter = (side: Side, ship: number) => at(side, ship, live.current[side].ships[ship]!.spot, 0.35);

  /** Keep ongoing auras (burning flames, ice, harpoon ropes) honest with the live state after every round of events. */
  const syncAuras = () => {
    const L = layer.current;
    if (!L) return;
    syncIce(live.current, { layer: L, shipCenter });
    syncPin(live.current, { layer: L, shipCenter, launchPoint: (side, ship, kind) => at(side, ship, live.current[side].ships[ship]!.spot, kind === "waterline" ? 0 : 0.8) });
  };

  const fire = (ev: DuelFireEvent) => {
    const key = `${ev.side}${ev.ship}`;
    busy.current[key] = true;
    const run = async () => {
      if (overRef.current || !layer.current) return;
      const ctx: PlayCtx = {
        layer: layer.current,
        launchPoint: (side, ship, kind) => at(side, ship, live.current[side].ships[ship]!.spot, kind === "waterline" ? 0 : 0.8),
        // Impacts land on the ship's live hull (where it actually floats now), never on empty water.
        spotCenter: (side, ship) => shipCenter(side, ship),
        shipCenter,
        onMissileImpact: (_i, e) => { const h = e.hits[0]; if (h && h.kind !== "miss" && h.kind !== "blocked") float(h.side, h.ship, "−10", "dmg"); },
        onUnsupported: () => undefined,
        onImpact: (e) => {
          for (const h of e.hits) {
            if (h.kind === "blocked") {
              shieldState(h.side, h.ship, h.reflect ? "reflect" : "hit");
              float(h.side, h.ship, h.reflect ? "انعكاس!" : "صدّ الدرع!", "block");
              commitView((n) => { const s = n[h.side].ships[h.ship]!; if (s.shield) { s.shield.hits -= 1; if (s.shield.hits <= 0) { shieldState(h.side, h.ship, "break"); window.setTimeout(() => commitView((m) => { m[h.side].ships[h.ship]!.shield = null; }), 600); } } });
              if (h.reflect) { const r = h.reflect; float(e.side, r.ship, `↩ −${r.dmg}`, "dmg"); damage(e.side, r.ship, r.dmg); }
            } else if (h.kind === "miss") {
              float(h.side, h.ship, "طاشت!", "miss");
              // A frozen or pinned ship strains against its shell but cannot slip aside.
              if (layer.current) {
                const L = layer.current;
                if (live.current[h.side].ships[h.ship]!.frozen) playMoveFail({ side: h.side, ship: h.ship, reason: "مجمّدة" }, L);
                else if (live.current[h.side].ships[h.ship]!.lock > 0) playMoveFail({ side: h.side, ship: h.ship, reason: "مثبّتة" }, L);
              }
            } else {
              if (e.weapon !== "missile") float(h.side, h.ship, h.kind === "splash" ? `شظايا −${h.dmg}` : `−${h.dmg}`, h.dmg >= 36 ? "crit" : "dmg");
              (h.side === foeS ? top : bottom).current?.kick(h.ship, 0.02, 0.008);
              // Statuses land at impact: fire sets the ship ablaze, ice freezes it, the harpoon pins it; a shattering blow cracks the ice.
              const tag = (t: string) => h.tags?.includes(t);
              commitView((n) => {
                const s = n[h.side].ships[h.ship]!;
                if (!s.alive) return;
                if (tag("حرق")) s.burn = CFG.burnRounds;
                if (tag("تجميد")) { s.frozen = true; s.lock = 1; }
                if (tag("تثبيت")) s.lock = 1;
                if (tag("تحطّم ×2")) { s.frozen = false; s.lock = 0; }
              });
              if (tag("تجميد")) float(h.side, h.ship, "تجمّدت!", "info");
              else if (tag("تثبيت")) float(h.side, h.ship, "تثبّتت!", "info");
              else if (tag("حرق")) float(h.side, h.ship, "اشتعلت!", "crit");
              damage(h.side, h.ship, h.dmg);
            }
          }
        },
      };
      firing.current = { side: ev.side, ship: ev.ship };
      try { await playFireEvent(ev, ctx); } finally { firing.current = null; busy.current[key] = false; syncAuras(); }
    };
    // Fire instantly: shots no longer wait for earlier projectiles to land.
    void run();
  };

  // Prefer an idle gunner; if every armed ship is mid-shot the card still fires (queued) instead of bouncing back.
  const gunner = (side: Side, weapon: string) => {
    const ships = live.current[side].ships;
    const idle = ships.findIndex((s, i) => s.alive && s.weapons.some((w) => w.id === weapon) && !busy.current[`${side}${i}`]);
    return idle >= 0 ? idle : ships.findIndex((s) => s.alive && s.weapons.some((w) => w.id === weapon));
  };

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
      if (online && side === myS) session.current?.send({ t: "shield", side, ship: target, tier, cost });
      return true;
    }
    const g = gunner(side, id);
    const t = live.current[other(side)].ships[target];
    if (g < 0 || !t?.alive) return false;
    m[side] -= cost; setMana({ ...m });
    const ev = strike(side, g, id, target);
    fire(ev);
    if (online && side === myS) session.current?.send({ t: "fire", ev, cost });
    return true;
  };

  // Enemy bot: watches its energy and plays cards like a captain would (offline duels only).
  useEffect(() => {
    if (over || online) return;
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
      const order: CardId[] = shielded
        ? ["torpedo", "missile", "cannon", "harpoon"]
        : m >= 8 ? ["torpedo", "mortar", "missile", "cannon", "frost_shell", "fire_barrel", "harpoon"]
        : ["mortar", "missile", "cannon", "fire_barrel", "frost_shell", "harpoon"];
      if (rnd() < 0.55) return; // breathe: saves energy for heavier cards
      for (const c of order) if (m >= cardCost(c) && gunner("b", c) >= 0) { play("b", c, weak.i); return; }
    }, 1500);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over]);

  // Ember burn: burning ships take their burn pulse on a steady clock (duel.js burns at round start).
  useEffect(() => {
    if (over) return;
    const id = window.setInterval(() => {
      const s = live.current;
      (["a", "b"] as Side[]).filter((side) => !online || side === myS).forEach((side) => s[side].ships.forEach((sh, i) => {
        if (!sh.alive || sh.burn <= 0 || busy.current[`${side}${i}`]) return;
        queue.current = queue.current.then(async () => {
          if (overRef.current || !layer.current) return;
          if (!live.current[side].ships[i]!.alive || live.current[side].ships[i]!.burn <= 0) return;
          await playBurnEvent({ t: "burn", side, ship: i, dmg: CFG.burnDamage }, {
            layer: layer.current,
            shipCenter,
            onBurn: (e) => { float(e.side, e.ship, `حرق −${e.dmg}`, "dmg"); damage(e.side, e.ship, e.dmg); },
          });
          commitView((n) => { const t = n[side].ships[i]!; if (t.alive) t.burn = Math.max(0, t.burn - 1); });
          if (online && side === myS) session.current?.send({ t: "burn", side, ship: i, dmg: CFG.burnDamage, burnLeft: Math.max(0, live.current[side].ships[i]!.burn) });
          syncAuras();
        });
      }));
    }, 4200);
    return () => window.clearInterval(id);
  }, [over]);

  const hooks = {
    onShake: (a: number, ms: number) => root.current?.animate([{ transform: `translate(${a}px,${-a / 2}px)` }, { transform: `translate(${-a}px,${a / 2}px)` }, { transform: "translate(0,0)" }], { duration: ms, easing: "ease-out" }),
    onZoom: (s: number, ms: number) => seas.current?.animate([{ transform: "scale(1)" }, { transform: `scale(${s})` }, { transform: "scale(1)" }], { duration: ms, easing: "ease-out" }),
    onFlash: (a: number, ms: number) => flash.current?.animate([{ opacity: a }, { opacity: 0 }], { duration: ms }),
    onHitStop: (ms: number) => { top.current?.pause(ms); bottom.current?.pause(ms); },
    onRecoil: (weapon: string) => {
      const f = firing.current; if (!f) return;
      const api = (f.side === foeS ? top : bottom).current;
      if (weapon === "cannon") api?.kick(f.ship, -0.035, 0);
      else if (weapon === "torpedo") api?.kick(f.ship, -0.015, 0.004);
      else api?.kick(f.ship, 0, 0.012);
    },
  };

  const onTarget = (_side: Side, i: number, forced?: CardId) => {
    const c = forced ?? card;
    if (!c) return;
    setDropHot(null);
    if (play(myS, c, i)) { playSfx("click", 0.7); if (!labRef.current) setCard(null); }
    else { playSfx("hover", 0.4); if (manaRef.current.a < cardCost(c)) shout("طاقة غير كافية"); }
  };
  const onTargetRef = useRef(onTarget);
  onTargetRef.current = onTarget;

  // Pointer drag: press a card and drop it on a ship (touch and mouse). A tap still selects/toggles.
  const drag = useRef<{ id: CardId; sx: number; sy: number; moved: boolean } | null>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const [dragArt, setDragArt] = useState<string | null>(null);
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current, g = ghostRef.current;
      if (!d || !g) return;
      if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 14) return;
      if (!d.moved) {
        d.moved = true;
        setCard(d.id);
        setDragArt(CARDS.find((c) => c.id === d.id)!.art);
        g.style.display = "grid";
      }
      g.style.left = `${e.clientX}px`;
      g.style.top = `${e.clientY}px`;
      const t = (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest("[data-bt-target]") as HTMLElement | null;
      setDropHot(t ? `${t.dataset["side"]}${t.dataset["ship"]}` : null);
    };
    const up = (e: PointerEvent) => {
      const d = drag.current, g = ghostRef.current;
      drag.current = null;
      if (g) { g.style.display = "none"; }
      setDropHot(null);
      if (!d) return;
      setDragArt(null);
      if (!d.moved) return; // tap: the click handler toggles the selection
      const t = (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest("[data-bt-target]") as HTMLElement | null;
      if (t) { onTargetRef.current(t.dataset["side"] as Side, Number(t.dataset["ship"]), d.id); return; }
      // Generous drop: anywhere over the right sea picks the nearest living ship.
      const side: Side = d.id === "shield" || d.id === "royal" ? myS : foeS;
      const box = (side === foeS ? topBox : bottomBox).current, r = root.current;
      if (!box || !r) return;
      const br = box.getBoundingClientRect(), rr = r.getBoundingClientRect();
      if (e.clientY < br.top - 30 || e.clientY > br.bottom + 30) return;
      let best = -1, bd = Infinity;
      live.current[side].ships.forEach((s, i) => {
        if (!s.alive) return;
        const p = at(side, i, s.spot, 0.45);
        const dd = Math.hypot(p.x + rr.left - e.clientX, p.y + rr.top - e.clientY);
        if (dd < bd) { bd = dd; best = i; }
      });
      if (best >= 0) onTargetRef.current(side, best, d.id);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); };
  }, []);

  const total = CFG.shipHp * 3;
  const isShieldCard = card === "shield" || card === "royal";
  const overtime = !lab && left <= OVERTIME_AT;

  const overlay = (side: Side) => (_g: unknown, point: BattleSeaApi["point"], hullSize: BattleSeaApi["hullSize"]) => view[side].ships.map((s, i) => {
    const hs = hullSize(i);
    const p = point(i, s.spot, 1.05);
    const fx = shieldFx[`${side}${i}`];
    const base = point(i, s.spot, 0);
    const targetable = s.alive && !over && card && (isShieldCard ? side === myS && !s.shield : side === foeS);
    const c = point(i, s.spot, 0.35);
    const movable = side === myS && s.alive && !over && !card && !s.frozen && !(s.lock > 0);
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
          <button
            type="button"
            data-bt-target="1"
            data-side={side}
            data-ship={i}
            className={`${isShieldCard ? "bt-target bt-target-own" : "bt-target"}${dropHot === `${side}${i}` ? " hot" : ""}`}
            style={{ left: c.x, top: c.y, width: hs.w * 1.1, height: hs.h * 1.4 }}
            onClick={() => onTarget(side, i)}
            aria-label={isShieldCard ? `درّع سفينتك ${i + 1}` : `اضرب سفينة العدو ${i + 1}`}
          >
            {isShieldCard ? <Shield /> : <Crosshair />}
          </button>
        )}
        {movable && (
          <button
            type="button"
            className="bt-move"
            style={{ left: c.x, top: c.y, width: hs.w * 1.1, height: hs.h * 1.4 }}
            onClick={() => { const ns = s.spot ? 0 : 1; commitView((n) => { const t = n[side].ships[i]!; t.spot = ns; }); if (online && side === myS) session.current?.send({ t: "move", side, ship: i, spot: ns }); playSfx("click", 0.4); }}
            aria-label={`حرّك سفينتك ${i + 1}`}
          >
            <span>⇄</span>
          </button>
        )}
      </div>
    );
  });

  const mm = Math.floor(left / 60), ss = Math.floor(left % 60);

  return (
    <div className={overtime ? "bt-root bt-arena bt-overtime" : "bt-root bt-arena"} dir="rtl" ref={root} role="dialog" aria-label="ساحة المعركة">
      <header className="bt-top">
        <SideBar p={foe} hp={hpSum(view, foeS)} total={total} />
        <div className="bt-round"><small>{lab ? "المختبر" : overtime ? "طاقة ×2" : "الوقت"}</small><b>{lab ? "∞" : `${mm}:${String(ss).padStart(2, "0")}`}</b></div>
        <button type="button" className="tos-x bt-close" aria-label="انسحاب" onClick={() => { if (online) session.current?.send({ t: "leave" }); onClose(); }}><X className="h-4 w-4" /></button>
      </header>
      <div className="bt-seas" ref={seas}>
        <div className="bt-panel bt-panel-foe" ref={topBox}>
          <BattleSea ref={top} theme={foeWorld} ships={view[foeS].ships} hull={hull} mirrored stormy>{overlay(foeS)}</BattleSea>
          <span className="bt-tag">{foe.name} {!online && <Bot className="h-3 w-3" />} <em>⚡{Math.floor(online ? foeMana : mana[foeS])}</em></span>
        </div>
        <div className="bt-divider">
          <span className="bt-turn me">{over ? "انتهت المعركة" : card ? (isShieldCard ? "اسحب الدرع على سفينتك" : "اسحب البطاقة على سفينة العدو!") : "اسحب بطاقة أو اخترها"}</span>
        </div>
        <div className="bt-panel bt-panel-me" ref={bottomBox}>
          <BattleSea ref={bottom} theme={myWorld} ships={view[myS].ships} hull={hull} stormy>{overlay(myS)}</BattleSea>
          <span className="bt-tag">{me.name}</span>
        </div>
      </div>
      <div className="bt-fx-layer"><WeaponsLayer ref={layer} {...hooks} /></div>
      <div className="bt-flash" ref={flash} />
      <div className="bt-ghost" ref={ghostRef} aria-hidden="true">{dragArt && <img src={dragArt} alt="" draggable={false} />}</div>
      {banner && <strong className="bt-shout" key={banner.id}>{banner.text}</strong>}

      {!over && (
        <footer className="bt-deck">
          <div className="bt-mana" aria-label={`الطاقة ${Math.floor(mana[myS])} من ${MANA_MAX}`}>
            <Zap className="bt-mana-ico" />
            <div className="bt-mana-track">
              <i style={{ width: `${(mana[myS] / MANA_MAX) * 100}%` }} />
              {Array.from({ length: MANA_MAX - 1 }, (_, k) => <s key={k} style={{ left: `${((k + 1) / MANA_MAX) * 100}%` }} />)}
            </div>
            <b>{Math.floor(mana[myS])}</b>
          </div>
          <div className="bt-cards">
            {CARDS.map((c) => {
              const isShield = c.id === "shield" || c.id === "royal";
              const noShip = !isShield && gunner(myS, c.id) < 0 && !view[myS].ships.some((s) => s.alive && s.weapons.some((w) => w.id === c.id));
              const outOfShields = isShield && !lab && shieldsLeft.current[myS] <= 0;
              const ready = mana[myS] >= c.cost && !noShip && !outOfShields;
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`bt-card bt-card-${c.id}${card === c.id ? " on" : ""}${ready ? " ready" : ""}`}
                  disabled={noShip || outOfShields}
                  onPointerDown={(e) => { if (ready && e.button !== 2) drag.current = { id: c.id, sx: e.clientX, sy: e.clientY, moved: false }; }}
                  onClick={() => { if (drag.current) return; setCard(card === c.id ? null : c.id); playSfx("click", 0.5); }}
                  aria-pressed={card === c.id}
                >
                  <span className="bt-card-cost">{c.cost}</span>
                  <span className="bt-card-art" aria-hidden="true"><img src={c.art} alt="" width={1024} height={1024} loading="lazy" draggable={false} /></span>
                  <strong>{c.name}</strong>
                  <small>{outOfShields ? "نفدت" : c.note}</small>
                  {!ready && !noShip && !outOfShields && <i className="bt-card-fill" style={{ height: `${100 - Math.min(100, (mana[myS] / c.cost) * 100)}%` }} />}
                </button>
              );
            })}
          </div>
          {!lab && <p className="bt-hint">دروعك المتبقية: {shieldsLeft.current[myS]} — {overtime ? "الطاقة تتدفق بسرعة مضاعفة!" : online ? "معركة حيّة ضد قبطان حقيقي" : "الطاقة تمتلئ تلقائياً"}</p>}
        </footer>
      )}

      {over && (
        <div className="bt-result" role="status">
          <h2 className={over === myS ? "win" : ""}>{over === myS ? "انتصار!" : over === foeS ? "هزيمة" : "تعادل"}</h2>
          <p>{hpSum(view, myS)} ضد {hpSum(view, foeS)} نقطة صمود</p>
          <button type="button" className="tos-btn" onClick={() => { if (online) session.current?.send({ t: "leave" }); onClose(); }}>العودة للبحر</button>
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
