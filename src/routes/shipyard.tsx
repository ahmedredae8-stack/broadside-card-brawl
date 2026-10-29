import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { ShipCard } from "@/components/ShipCard";
import { tripLabel } from "@/lib/fleetCatalog";
import { useLiveShips, type LiveShip } from "@/lib/shipOverrides";
import { playSfx } from "@/lib/sound";

export const Route = createFileRoute("/shipyard")({
  head: () => ({
    meta: [
      { title: "سوق السفن — عرش البحار" },
      { name: "description", content: "السفن الأربع عشرة في عرش البحار: من زورق الصياد حتى القائد الذهبي." },
      { property: "og:title", content: "سوق السفن — عرش البحار" },
      { property: "og:description", content: "مستويات السفن ورحلات صيدها وأسلحتها ودروعها." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Shipyard,
});

export function Shipyard() {
  const ships = useLiveShips();
  const [open, setOpen] = useState<LiveShip | null>(null);
  return (
    <div dir="rtl" className="tos-yard">
      <ul className="tos-yard-grid">
        {ships.map((s) => (
          <li key={s.key}>
            <button type="button" className="tos-yard-card" onClick={() => { playSfx("click", 0.6); setOpen(s); }}>
              <span className="tos-yard-tier">م{s.data.tier}</span>
              <img src={s.photo} alt="" loading="lazy" />
              <strong>{s.name}</strong>
              <small>{s.data.class_ar} · رحلة {tripLabel(s.tripSeconds)}</small>
            </button>
          </li>
        ))}
      </ul>
      {open && <ShipCard ship={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
