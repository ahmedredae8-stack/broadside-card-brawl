import { useMemo, useState } from "react";
import { Check, Crown, Gem, Minus, Plus, Shield, ShipWheel, Swords, Users, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GameSprite } from "@/components/GameSprite";
import { CREW_ART, CREW_ART_MAP } from "@/lib/art";
import { CREWS, GEM_PACKS } from "@/lib/items";
import { CARDS } from "@/components/battle/BattleScreen";

/** Store prices for battle weapon cards and shield tiers: stronger effects cost more. */
const CARD_PRICE: Record<string, number> = { cannon: 2_000, harpoon: 6_000, missile: 12_000, mortar: 18_000, fire_barrel: 28_000, frost_shell: 35_000, torpedo: 150 };
const SHIELD_PRICE: Record<number, number> = { 1: 3_000, 2: 12_000, 3: 40_000, 4: 120, 5: 350 };
import ShieldOverlay from "@/shields/ShieldOverlay";
import shieldData from "@/shields/shields.json";
import SeaScene from "@/components/SeaScene";
import { resolveShipArtwork } from "@/lib/shipArtwork";
import { SEA_WORLDS, getSeaWorld, loadSeaWorldId, saveSeaWorldId } from "@/lib/seaWorld";
import { useEffect } from "react";

type ShieldInfo = { tier: 1 | 2 | 3 | 4 | 5; id: string; name_ar: string; blocks: string[]; hits: number; reflect: number };
export const SHIELDS = shieldData.shields as unknown as ShieldInfo[];
const BLOCK_AR: Record<string, string> = { kinetic: "المقذوفات", fire: "النار", ice: "الجليد", electric: "البرق", pierce: "الاختراق", ultimate: "الضربة القاضية" };

function SeaWorlds() {
  const [id, setId] = useState(SEA_WORLDS[0]!.id);
  useEffect(() => setId(loadSeaWorldId()), []);
  const world = getSeaWorld(id);
  return (
    <>
      <p className="store-section-note">بحر حي يتحرك مع سفينتك — اختر عالمك</p>
      <div className="sea-world-live"><SeaScene theme={world} ships={[]} style={{ aspectRatio: "16 / 10", width: "100%" }} /><span>{world.name}</span></div>
      <ul className="store-grid store-worlds">
        {SEA_WORLDS.map((w) => (
          <li key={w.id}>
            <Button variant="ghost" onClick={() => { playSfx("click", 0.6); setId(w.id); saveSeaWorldId(w.id); }} className={w.id === id ? "store-product world-card selected" : "store-product world-card"}>
              <span className="world-preview"><img src={w.thumb} alt="" loading="lazy" /></span>
              <span className="product-copy"><strong>{w.name}</strong><small>{w.id === id ? "العالم الحالي" : "مجاني"}</small></span>
              {w.id === id && <Check className="product-check" />}
            </Button>
          </li>
        ))}
      </ul>
    </>
  );
}
import { tripLabel } from "@/lib/fleetCatalog";
import { useLiveShips, type LiveShip } from "@/lib/shipOverrides";
import { ShipCard } from "@/components/ShipCard";
import { fmt } from "@/lib/ships";

import { currentPhase, phaseLabel, themes } from "@/lib/themes";
import { playSfx } from "@/lib/sound";
import { useArtworkMap } from "@/lib/artwork";

type StoreTab = "gems" | "crew" | "weapons" | "armor" | "ships" | "worlds";
type Product = {
  id: string;
  title: string;
  desc: string;
  price: number;
  currency: "coin" | "gem";
  art: React.ReactNode;
};

const sectionTitle: Record<StoreTab, string> = {
  gems: "الجواهر",
  crew: "الطواقم",
  weapons: "الأسلحة",
  armor: "الدروع",
  ships: "السفن",
  worlds: "الخلفيات",
};

export function GameStore({ activeId, onSelect, onClose }: { activeId: string; onSelect: (id: string) => void; onClose: () => void }) {
  const [tab, setTab] = useState<StoreTab>("ships");
  const [shipOpen, setShipOpen] = useState<LiveShip | null>(null);
  const tabs = [
    { id: "gems" as const, label: "جواهر", icon: Gem },
    { id: "crew" as const, label: "طواقم", icon: Users },
    { id: "weapons" as const, label: "أسلحة", icon: Swords },
    { id: "armor" as const, label: "حماية", icon: Shield },
    { id: "ships" as const, label: "سفن", icon: ShipWheel },
    { id: "worlds" as const, label: "خلفيات", icon: Crown },
  ];

  const art = useArtworkMap();
  const liveShips = useLiveShips();
  const products = useMemo<Product[]>(() => {
    if (tab === "weapons") return CARDS.filter((c) => c.id !== "shield" && c.id !== "royal").map((c) => ({ id: c.id, title: c.name, desc: `${c.note} · طاقة ${c.cost}`, price: CARD_PRICE[c.id] ?? 0, currency: c.id === "torpedo" ? "gem" as const : "coin" as const, art: <img src={c.art} alt="" loading="lazy" /> }));
    if (tab === "crew") return CREWS.map((item, index) => ({ id: item.id, title: item.name, desc: `${item.desc} · ${item.hours}H`, price: item.price, currency: item.currency, art: <img src={art[`store:crew-${item.id}:idle`] || CREW_ART_MAP[item.id] || CREW_ART[index % CREW_ART.length]} alt="" loading="lazy" className="crew-photo" /> }));
    if (tab === "armor") return SHIELDS.map((s) => ({ id: s.id, title: s.name_ar, desc: `يصد: ${s.blocks.map((b) => BLOCK_AR[b] ?? b).join("، ")} · ${s.hits} ضربة${s.reflect ? ` · يعكس ${Math.round(s.reflect * 100)}%` : ""}`, price: SHIELD_PRICE[s.tier] ?? 0, currency: s.tier >= 4 ? "gem" as const : "coin" as const, art: art[`store:shield-${s.id}:idle`] ? <img src={art[`store:shield-${s.id}:idle`]} alt="" loading="lazy" /> : <span className="shield-thumb"><ShieldOverlay tier={s.tier} state="idle" width="100%" /></span> }));
    if (tab === "ships") return [];

    return [];
  }, [tab, art, liveShips]);

  return (
    <div className="game-modal" role="dialog" aria-modal="true" aria-label="المتجر البحري" onClick={onClose}>
      <section dir="rtl" className="store-shell" onClick={(event) => event.stopPropagation()}>
        <header className="store-head">
          <div className="min-w-0">
            <p className="store-kicker">ميناء التجارة الملكي</p>
            <h2>المتجر</h2>
          </div>
          <Button variant="ghost" size="icon" aria-label="إغلاق المتجر" onClick={onClose} className="store-close"><X /></Button>
        </header>
        <nav className="store-tabs" aria-label="أقسام المتجر">
          {tabs.map((item) => (
            <Button key={item.id} variant="ghost" onClick={() => { playSfx("click", 0.55); setTab(item.id); }} className={tab === item.id ? "store-tab store-tab-active" : "store-tab"}>
              <item.icon /> <span>{item.label}</span>
            </Button>
          ))}
        </nav>
        <p className="store-banner">{sectionTitle[tab]}</p>
        <div className="store-body">
          {tab === "worlds" && <SeaWorlds />}
          {tab === "gems" && <GemPacks />}
          {tab === "ships" && (
            <ul className="store-grid">
              {liveShips.map((s) => (
                <li key={s.key}>
                  <Button variant="ghost" onClick={() => { playSfx("click", 0.5); setShipOpen(s); }} className="store-product item-card">
                    <span className="product-art"><img className="ship-full" src={resolveShipArtwork(art, s.id, "idle", s.photo)} alt="" loading="lazy" /></span>
                    <span className="product-copy"><strong>{s.name}</strong><small>مستوى {s.data.tier} · {s.data.class_ar} · رحلة {tripLabel(s.tripSeconds)}</small><b className="store-ship-price">{s.price ? `${fmt(s.price)} ${s.currency === "gem" ? "💎" : "🪙"}` : "مجانية"}</b></span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {shipOpen && <ShipCard ship={shipOpen} onClose={() => setShipOpen(null)} />}
          {products.length > 0 && <ProductPicker key={tab} items={products} />}
        </div>
      </section>
    </div>
  );
}

function GemPacks() {
  return (
    <ul className="store-grid gem-grid">
      {GEM_PACKS.map((pack, index) => (
        <li key={pack.id} className="store-product gem-card">
          <span className="product-art"><GameSprite atlas="gem" index={index} /></span>
          <span className="product-copy">
            <strong>{fmt(pack.gems)} جوهرة</strong>
            <small>{pack.bonus > 0 ? `+${fmt(pack.bonus)} مكافأة · ` : ""}VIP +{pack.vip}</small>
          </span>
          <Button disabled className="product-buy" title="الدفع غير متاح حالياً">{pack.price}</Button>
        </li>
      ))}
    </ul>
  );
}

function ProductPicker({ items }: { items: Product[] }) {
  const [pickedId, setPickedId] = useState(items[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const picked = items.find((item) => item.id === pickedId) ?? items[0];
  if (!picked) return null;
  const total = picked.price * qty;
  return (
    <>
      <ul className="store-grid">
        {items.map((item) => (
          <li key={item.id}>
            <Button variant="ghost" onClick={() => { setPickedId(item.id); setQty(1); playSfx("click", 0.5); }} className={item.id === picked.id ? "store-product item-card selected" : "store-product item-card"}>
              <span className="product-art">{item.art}</span>
              <span className="product-copy"><strong>{item.title}</strong><small>{item.desc}</small></span>
            </Button>
          </li>
        ))}
      </ul>
      <footer className="buy-bar">
        <span className="buy-art">{picked.art}<small>x{qty}</small></span>
        <span className="buy-copy"><strong>{picked.title}</strong><small>{picked.desc}</small></span>
        <span className="buy-controls">
          <Button variant="ghost" size="icon" aria-label="إنقاص" onClick={() => setQty((n) => Math.max(1, n - 1))}><Minus /></Button>
          <b>{qty}</b>
          <Button variant="ghost" size="icon" aria-label="زيادة" onClick={() => setQty((n) => Math.min(99, n + 1))}><Plus /></Button>
        </span>
        <Button className="product-buy buy-confirm" disabled title="الشراء غير متاح حالياً">
          <img src={picked.currency === "coin" ? "/__l5e/assets-v1/afe90962-2727-41b7-8733-7fd86bc63bf6/coin.png" : "/__l5e/assets-v1/a7998f4c-5c5e-48cc-8287-befdc38e3ba7/gem.png"} alt="" />
          {total === 0 ? "مجاني" : fmt(total)} · غير متاح
        </Button>
      </footer>
    </>
  );
}
