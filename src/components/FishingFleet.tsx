import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import type { SeaEngine } from "@/components/SeaScene";
import { X } from "lucide-react";

import { fleetCatalog, hulls, type ShipPose } from "@/lib/fleetCatalog";
import { Anchor, Sailboat, Users, Coins } from "lucide-react";
import { CREW_ART, CREW_ART_MAP } from "@/lib/art";

import { FleetCalibrator } from "@/components/FleetCalibrator";
import { Button } from "@/components/ui/button";
import { CREWS } from "@/lib/items";
import { cachedLanes, defaultLanes, fetchLanes, type Lane } from "@/lib/fleetLayout";
import { fmt } from "@/lib/ships";
import { playSfx } from "@/lib/sound";
import { useArtworkMap } from "@/lib/artwork";
import { resolveShipArtwork } from "@/lib/shipArtwork";
import { FISH, rollHaul, saveHaul } from "@/lib/catches";
import catchArt from "@/assets/catch-return.jpg";

type ShipState = "docked" | "sailingOut" | "turning" | "casting" | "fishing" | "hauling" | "sailingHome" | "sold";
type FleetShip = { id: number; state: ShipState };
type ShipStyle = CSSProperties & {
  "--ship-x": string;
  "--ship-y": string;
  "--ship-size": string;
  "--ship-dx": string;
  "--ship-dy": string;
  "--ship-delay": string;
};

/** Three hulls of the first boat on the water, each on its own lane. */
const initialFleet: FleetShip[] = [
  { id: 1, state: "docked" },
  { id: 2, state: "docked" },
  { id: 3, state: "docked" },
];
const delays = ["0ms", "420ms", "860ms"];



/** States where the hull sits at the far end of its lane. */
const atSea: ShipState[] = ["sailingOut", "turning", "casting", "fishing", "hauling"];
/** States where the bow points back toward the shore. */
const facingShore: ShipState[] = ["turning", "casting", "fishing", "hauling", "sailingHome"];
const busyStates: ShipState[] = ["sailingOut", "turning", "casting", "hauling", "sailingHome"];

export function FishingFleet({ themeId, themeName, seaEngine }: { themeId: string; themeName: string; seaEngine?: RefObject<SeaEngine | null> }) {
  const layer = useRef<HTMLDivElement>(null);
  const artwork = useArtworkMap();
  const [ships, setShips] = useState(initialFleet);
  const [lanes, setLanes] = useState<Lane[]>(defaultLanes);
  const [assetsReady, setAssetsReady] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [crewFor, setCrewFor] = useState<number | null>(null);
  const [sellFor, setSellFor] = useState<number | null>(null);
  /** Owner tool preview: which of the six hulls to show, poses and spray. */
  const [hullIndex, setHullIndex] = useState(0);
  const [spray, setSpray] = useState(true);
  const [poseOverride, setPoseOverride] = useState<ShipPose | null>(null);
  // Lane IDs identify instances, not catalog products: all starter boats use ship-1.
  const catalogId = [1, 2, 5, 6, 7, 10][hullIndex] ?? 1;
  const bundledHull = fleetCatalog.find((s) => s.id === catalogId)?.hull ?? hulls[hullIndex] ?? hulls[0] ?? "";
  const activeHull = resolveShipArtwork(artwork, catalogId, "idle", bundledHull);
  const timers = useRef<number[]>([]);
  /** The sea always shows the first boat of the catalog, drawn inside the water by the engine. */
  const seaHull = bundledHull;

  // Stream each hull's on-screen spot into the WebGL sea so it sinks into the waves.
  useEffect(() => {
    if (!seaEngine) return;
    let raf = 0, last = performance.now();
    // Per-hull turn progress (0 = facing the sea, 1 = facing the shore): the hull narrows, mirrors, widens back.
    const turn = new Map<string, number>();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const host = layer.current, eng = seaEngine.current;
      if (!host || !eng) return;
      const r = host.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const list = Array.from(host.querySelectorAll<HTMLElement>("[data-sea-ship]")).map((el) => {
        const b = el.getBoundingClientRect();
        const id = el.dataset["seaShip"]!;
        const want = el.dataset["shipFlip"] === "1" ? 1 : 0;
        let t = turn.get(id) ?? want;
        t = want > t ? Math.min(want, t + dt / 0.82) : Math.max(want, t - dt / 0.82);
        turn.set(id, t);
        const squash = Math.max(0.08, Math.abs(Math.cos(Math.PI * t)));
        return {
          id,
          src: seaHull,
          x: (b.left + b.width / 2 - r.left) / r.width,
          y: (b.top + b.height * 0.72 - r.top) / r.height,
          width: (b.width / r.width) * 0.92,
          squash,
          waterline: 0.86,
          flip: t > 0.5,
        };
      });
      eng.setShips(list);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); seaEngine.current?.setShips([]); };
  }, [seaEngine, seaHull]);
  const [haul, setHaul] = useState<ReturnType<typeof rollHaul> | null>(null);
  const [haulSaved, setHaulSaved] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    const image = new Image();
    image.src = activeHull;
    void image.decode().catch(() => undefined).then(() => {
      if (active) setAssetsReady(true);
    });

    setLanes(cachedLanes(themeId));
    void fetchLanes(themeId).then((published) => {
      if (active) setLanes(published);
    });
    return () => {
      active = false;
      timers.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, [themeId]);

  const update = (id: number, state: ShipState) => {
    setShips((current) => current.map((ship) => (ship.id === id ? { ...ship, state } : ship)));
  };

  const later = (callback: () => void, delay: number) => {
    timers.current.push(window.setTimeout(callback, delay));
  };

  const sail = (ship: FleetShip) => {
    setSelected(null);
    playSfx("click", 0.55);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("reduce-game-motion");
    if (ship.state === "docked") {
      if (reducedMotion) {
        update(ship.id, "fishing");
        return;
      }
      update(ship.id, "sailingOut");
      later(() => update(ship.id, "turning"), 2300);
      later(() => update(ship.id, "casting"), 3150);
      later(() => update(ship.id, "fishing"), 4600);
      return;
    }
    if (ship.state === "fishing") {
      const landed = () => {
        update(ship.id, "docked");
        const h = rollHaul();
        setHaul(h);
        void saveHaul(h).then((ok) => setHaulSaved(ok));
        // "إشعارات عودة السفن" setting: flash the tab title when the hull returns.
        if (typeof localStorage !== "undefined" && localStorage.getItem("ib.notify") !== "off" && document.hidden) {
          document.title = "⚓ عاد القارب بالصيد! — عرش البحار";
          const restore = () => { document.title = "عرش البحار — Throne of Seas"; window.removeEventListener("focus", restore); };
          window.addEventListener("focus", restore);
        }
      };
      if (reducedMotion) { landed(); return; }
      update(ship.id, "hauling");
      later(() => update(ship.id, "sailingHome"), 1500);
      later(landed, 3900);
    }
  };

  /** Owner tool preview: send every docked ship out on its new lane. */
  const testSail = () => {
    ships.forEach((ship, index) => {
      if (ship.state === "docked") later(() => sail(ship), index * 260);
    });
  };

  return (
    <div ref={layer} className={`fleet-layer ${assetsReady ? "fleet-ready" : ""} ${seaEngine ? "fleet-in-sea" : ""}`} aria-label="أسطول الصيد" aria-busy={!assetsReady}>
      {ships.map((ship, index) => {
        if (ship.state === "sold") return null;
        const lane = lanes[index];
        if (!lane) return null;
        const busy = busyStates.includes(ship.state);
        const frame: ShipPose = poseOverride ?? (ship.state === "casting" ? "cast" : ship.state === "fishing" ? "submerged" : ship.state === "hauling" ? "haul" : "idle");
        const style: ShipStyle = {
          "--ship-x": `${lane.dockX}%`,
          "--ship-y": `${lane.dockY}%`,
          "--ship-size": String(lane.size),
          "--ship-dx": `calc(${(lane.fishX - lane.dockX).toFixed(2)} * 1cqw)`,
          "--ship-dy": `calc(${(lane.fishY - lane.dockY).toFixed(2)} * 1cqh)`,
          "--ship-delay": delays[index] ?? "0ms",
        };
        const laneClasses = [
          "fleet-ship",
          `fleet-ship-${ship.state}`,
          atSea.includes(ship.state) ? "fleet-ship-at-sea" : "",
          ship.state === "sailingOut" || ship.state === "sailingHome" ? "fleet-ship-moving" : "",
        ].filter(Boolean).join(" ");
        return (
          <div key={ship.id} className={laneClasses} style={style} data-sea-ship={ship.id} data-ship-flip={facingShore.includes(ship.state) ? "1" : "0"}>
            {selected === ship.id && !busy && (
              <div className="ship-actions" role="menu" aria-label={`أوامر السفينة ${ship.id}`}>
                <button type="button" role="menuitem" className="ship-orb ship-orb-sail" onClick={() => sail(ship)} title={ship.state === "docked" ? "الذهاب للصيد" : "العودة للميناء"}>
                  <i>{ship.state === "docked" ? <Sailboat /> : <Anchor />}</i>
                  <span>{ship.state === "docked" ? "إبحار" : "رجوع"}</span>
                </button>
                <button type="button" role="menuitem" className="ship-orb ship-orb-crew" onClick={() => { setSelected(null); setCrewFor(ship.id); playSfx("click", 0.65); }} title="تفقد الطاقم">
                  <i><Users /></i>
                  <span>الطاقم</span>
                </button>
                <button type="button" role="menuitem" className="ship-orb ship-orb-sell" onClick={() => { setSelected(null); setSellFor(ship.id); playSfx("click", 0.65); }} title="بيع السفينة">
                  <i><Coins /></i>
                  <span>بيع</span>
                </button>
              </div>
            )}
            <Button
              variant="ghost"
              className="ship-hitbox"
              disabled={busy}
              aria-label={`السفينة ${ship.id}${busy ? " تتحرك" : ""}`}
              onClick={() => { setSelected((current) => current === ship.id ? null : ship.id); playSfx("click", 0.6); }}
            >
              <span className={`ship-flip ${facingShore.includes(ship.state) ? "ship-flip-turned" : ""}`} aria-hidden="true">
                <span className="ship-bob">
                  <img
                    src={resolveShipArtwork(artwork, catalogId, frame, bundledHull)}
                    className="ship-frame ship-frame-active"
                    alt=""
                    width={1024}
                    height={640}
                    draggable={false}
                  />

                </span>
              </span>
              <span className="sr-only">سفينة الصيد {ship.id}</span>
              {ship.state === "fishing" && <span className="fishing-ripple" />}
            </Button>
          </div>
        );
      })}

      <FleetCalibrator
        lanes={lanes}
        onChange={setLanes}
        onTest={testSail}
        themeId={themeId}
        themeName={themeName}
        hullIndex={hullIndex}
        onHullChange={setHullIndex}
        spray={spray}
        onSprayChange={setSpray}
        pose={poseOverride}
        onPoseChange={setPoseOverride}
      />

      {crewFor !== null && <CrewPanel shipId={crewFor} onClose={() => setCrewFor(null)} />}
      {sellFor !== null && (
        <div className="fleet-modal" role="dialog" aria-modal="true" aria-label="بيع السفينة" onClick={() => setSellFor(null)}>
          <section className="sell-panel" dir="rtl" onClick={(event) => event.stopPropagation()}>
            <img src={activeHull} alt="" width={1024} height={640} />
            <h2>بيع السفينة؟</h2>
            <p>ستحصل على 12,500 عملة ذهبية. سيبقى أسطولك قابلاً للإبحار بالسفن الأخرى.</p>
            <div>
              <Button variant="destructive" onClick={() => { update(sellFor, "sold"); setSellFor(null); playSfx("click", 0.8); }}>تأكيد البيع</Button>
              <Button variant="secondary" onClick={() => setSellFor(null)}>إلغاء</Button>
            </div>
          </section>
        </div>
      )}
      {haul && (
        <div className="fleet-modal" role="dialog" aria-modal="true" aria-label="نتيجة الصيد" onClick={() => setHaul(null)}>
          <section className="tos-haul" dir="rtl" onClick={(e) => e.stopPropagation()}>
            <img className="tos-haul-art" src={catchArt} alt="القارب عاد بالصيد إلى الشاطئ" width={1024} height={640} />
            <h2>عاد القارب بالصيد!</h2>
            <ul>
              {haul.map((h) => { const f = FISH.find((x) => x.id === h.id)!; return <li key={h.id}><img src={f.img} alt="" /><strong>{f.name}</strong><span>×{h.qty}</span></li>; })}
            </ul>
            <p>{haulSaved === false ? "سجّل دخولك لحفظ صيدك في سوق السمك" : "أُضيف الصيد إلى سوق السمك"}</p>
            <button type="button" className="tos-btn" onClick={() => setHaul(null)}>استلام</button>
          </section>
        </div>
      )}
    </div>
  );
}

function CrewPanel({ shipId, onClose }: { shipId: number; onClose: () => void }) {
  const [active, setActive] = useState<string | null>(null);
  const art = useArtworkMap();
  return (
    <div className="daily-overlay" role="dialog" aria-modal="true" aria-label={`طاقم السفينة ${shipId}`} onClick={onClose} dir="rtl" style={{ pointerEvents: "auto" }}>
      <div className="daily-panel crew-war" onClick={(event) => event.stopPropagation()}>
        <button type="button" aria-label="إغلاق" onClick={onClose} className="tos-x"><X className="h-4 w-4" /></button>
        <header className="daily-head">
          <span className="daily-kicker">نداء الحرب · السفينة {shipId}</span>
          <h2 className="daily-title">غرفة الطاقم</h2>
          <div className="daily-streak"><b>{active ? 1 : 0}</b><span>/ 1 بحار على السطح</span></div>
        </header>
        <ul className="crew-war-list">
          {CREWS.map((crew, index) => {
            const on = active === crew.id;
            return (
              <li key={crew.id} className={on ? "crew-war-card on" : "crew-war-card"} style={{ animationDelay: `${index * 90}ms` }}>
                <span className="crew-war-photo"><img src={art[`store:crew-${crew.id}:idle`] || CREW_ART_MAP[crew.id] || CREW_ART[index % CREW_ART.length]} alt="" /></span>
                <strong>{crew.name}</strong>
                <small>{crew.desc}</small>
                <span className="crew-war-meta">{crew.hours} ساعات · {fmt(crew.price)}</span>
                <button type="button" className="tos-btn crew-war-btn" disabled={on} onClick={() => { setActive(crew.id); playSfx("click", 0.8); }}>
                  {on ? "على السطح ⚔" : "جنّده"}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
