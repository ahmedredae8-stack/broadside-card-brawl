import { Anchor, Clock, Fish, Shield, Swords, X } from "lucide-react";
import { tripLabel, WEAPON_AR, type FleetShip } from "@/lib/fleetCatalog";
import { collectTrip, countdown, startTrip, useTrips, type Haul } from "@/lib/fishingTrips";
import { useState } from "react";
import { playSfx } from "@/lib/sound";

const RARITY_CLASS: Record<string, string> = { "شائع": "r0", "غير شائع": "r1", "نادر": "r2", "ملحمي": "r3", "أسطوري": "r4" };

/** Full details for one catalog ship + its fishing trip + empty weapon/shield slots. */
export function ShipCard({ ship, onClose }: { ship: FleetShip & { description?: string }; onClose: () => void }) {
  const d = ship.data;
  const { trips, now } = useTrips();
  const [haul, setHaul] = useState<Haul[] | null>(null);
  const trip = trips[ship.code];
  const left = trip ? trip.endsAt - now : 0;
  const pct = trip ? Math.min(100, ((now - trip.startedAt) / (trip.endsAt - trip.startedAt)) * 100) : 0;

  return (
    <div className="shipcard-overlay" role="dialog" aria-modal="true" aria-label={ship.name} onClick={onClose}>
      <section dir="rtl" className="shipcard" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="shipcard-x" aria-label="إغلاق" onClick={onClose}><X /></button>
        <div className="shipcard-photo"><img src={ship.photo} alt={ship.name} /><span className="shipcard-tier">مستوى {d.tier}</span></div>
        <h3>{ship.name}</h3>
        {ship.description && <p className="shipcard-desc">{ship.description}</p>}
        <dl className="shipcard-stats">
          <div><dt><Anchor />الفئة</dt><dd>{d.class_ar}</dd></div>
          <div><dt><Clock />رحلة الصيد</dt><dd>{tripLabel(ship.tripSeconds)}</dd></div>
          <div><dt><Swords />خانات السلاح</dt><dd>{d.weapon_slots}</dd></div>
          <div><dt><Shield />أقصى درع</dt><dd>{d.shield_max || "—"}</dd></div>
        </dl>
        <h4><Fish />السمك</h4>
        <ul className="shipcard-fish">{d.fishing.fish.map((f) => <li key={f.name_ar} className={RARITY_CLASS[f.rarity_ar]}>{f.name_ar}<small>{f.rarity_ar}</small></li>)}</ul>
        <h4><Swords />الأسلحة المسموحة</h4>
        <p className="shipcard-weapons">{d.weapons.length ? d.weapons.map((w) => WEAPON_AR[w] ?? w).join(" · ") : "لا تحمل سلاحًا"}</p>
        <div className="shipcard-slots">
          {Array.from({ length: d.weapon_slots }, (_, i) => <span key={`w${i}`} className="slot"><Swords />سيأتي السلاح قريبًا</span>)}
          {d.shield_max > 0 && <span className="slot"><Shield />سيأتي الدرع قريبًا</span>}
        </div>
        <div className="shipcard-trip">
          {haul ? (
            <p className="shipcard-haul">صيدك: {haul.map((h) => `${h.name_ar} ×${h.qty}`).join(" · ")}</p>
          ) : trip ? (
            left > 0 ? (
              <><div className="shipcard-bar"><i style={{ width: `${pct}%` }} /></div><b>تعود السفينة بعد {countdown(left)}</b></>
            ) : (
              <button type="button" className="tos-btn" onClick={() => { playSfx("click", 0.8); setHaul(collectTrip(ship.code)); }}>استلام السمك</button>
            )
          ) : (
            <button type="button" className="tos-btn" onClick={() => { playSfx("click", 0.8); startTrip(ship.code); }}>ابدأ رحلة صيد · {tripLabel(ship.tripSeconds)}</button>
          )}
        </div>
      </section>
    </div>
  );
}
