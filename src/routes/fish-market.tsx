import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Info } from "lucide-react";

import marketHero from "@/assets/fish-market-hero.jpg";
import { CATCHES_UPDATED, FISH, loadInventory, priceCurve, sellFishQty } from "@/lib/catches";
import { loadLedger, saveLedger } from "@/lib/market";
import { fmt } from "@/lib/ships";
import { playSfx } from "@/lib/sound";

export const Route = createFileRoute("/fish-market")({
  head: () => ({
    meta: [
      { title: "سوق السمك — عرش البحار" },
      { name: "description", content: "بِع الأسماك التي اصطادها أسطولك حسب سعر الساعة في سوق السمك." },
      { property: "og:title", content: "سوق السمك — عرش البحار" },
      { property: "og:description", content: "صيدك الحقيقي من رحلات أسطولك، جاهز للبيع بسعر السوق." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FishMarket,
});

export function FishMarket() {
  const [stock, setStock] = useState<Record<string, number> | null>(null);
  const [fishId, setFishId] = useState<string>(FISH[0].id);
  const [qty, setQty] = useState(0);
  const [coins, setCoins] = useState(0);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setCoins(loadLedger().coins);
    const load = () => void loadInventory().then(setStock);
    load();
    window.addEventListener(CATCHES_UPDATED, load);
    return () => window.removeEventListener(CATCHES_UPDATED, load);
  }, []);

  const fish = FISH.find((f) => f.id === fishId) ?? FISH[0];
  const have = stock?.[fish.id] ?? 0;
  useEffect(() => setQty(have), [have, fish.id]);

  const curve = useMemo(() => priceCurve(fish.price / 20), [fish.id]);
  const now = curve[curve.length - 1]!.price;
  const hi = Math.max(...curve.map((p) => p.price));
  const lo = Math.min(...curve.map((p) => p.price));
  const span = Math.max(0.1, hi - lo);
  const W = 300, H = 140;
  const px = (i: number) => 30 + (i / (curve.length - 1)) * (W - 40);
  const py = (v: number) => 12 + (1 - (v - lo) / span) * (H - 24);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round((lo + span * t) * 10) / 10);
  const gain = Math.round(qty * now);

  const sell = async () => {
    if (busy || qty <= 0) return;
    setBusy(true);
    playSfx("click", 0.8);
    const ok = await sellFishQty(fish.id, qty, have);
    if (ok) {
      const l = loadLedger();
      l.coins += gain;
      saveLedger(l);
      setCoins(l.coins);
      setNote(`بعت ${fmt(qty)} × ${fish.name} مقابل ${fmt(gain)}`);
    } else setNote("تعذّر البيع — سجّل دخولك أولاً");
    setBusy(false);
  };

  return (
    <div dir="rtl" className="fm">
      <figure className="fm-scene">
        <img src={marketHero} alt="تاجر السمك في الميناء" className="fm-scene-bg" />
        <div className="fm-porthole"><img src={fish.img} alt="" /></div>
        <span className="fm-name">{fish.name}</span>
      </figure>

      <div className="fm-picker" role="tablist" aria-label="اختر السمكة">
        {FISH.map((f) => (
          <button key={f.id} type="button" role="tab" aria-selected={f.id === fish.id} className={f.id === fish.id ? "fm-pick on" : "fm-pick"} onClick={() => { playSfx("hover", 0.3); setFishId(f.id); }}>
            <img src={f.img} alt="" />
            <small>{fmt(stock?.[f.id] ?? 0)}</small>
          </button>
        ))}
      </div>

      <div className="fm-quality"><Info className="h-4 w-4" /> الجودة: 100%</div>

      <div className="fm-chart">
        <svg viewBox={`0 0 ${W} ${H + 26}`} role="img" aria-label="سعر السمكة خلال الساعات الماضية">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={28} x2={W - 6} y1={py(t)} y2={py(t)} className="fm-grid" />
              <text x={2} y={py(t) + 3} className="fm-axis">{t}$</text>
            </g>
          ))}
          <polyline points={curve.map((p, i) => `${px(i)},${py(p.price)}`).join(" ")} className="fm-line" />
          <circle cx={px(curve.length - 1)} cy={py(now)} r={4} className="fm-dot" />
          <text x={px(curve.length - 1) - 8} y={py(now) - 8} className="fm-axis" textAnchor="end">{now}</text>
          {curve.map((p, i) => {
            const [h, m] = p.label.split("\n");
            return <text key={i} x={px(i)} y={H + 10} textAnchor="middle" className="fm-axis"><tspan x={px(i)}>{h}</tspan><tspan x={px(i)} dy={10}>{m}</tspan></text>;
          })}
        </svg>
      </div>

      <p className="fm-now">السعر الحالي: <b>{now}</b></p>
      <div className="fm-qty">
        <span>{fmt(qty)}/{fmt(have)}</span>
        <input type="range" min={0} max={have} value={qty} disabled={have === 0} onChange={(e) => setQty(Number(e.target.value))} aria-label="الكمية المراد بيعها" />
        <span className="fm-gain"><img src="/__l5e/assets-v1/afe90962-2727-41b7-8733-7fd86bc63bf6/coin.png" alt="" /> {fmt(gain)}</span>
        <small className="fm-wallet">رصيدك: {fmt(coins)}</small>
      </div>

      <button type="button" className="fm-sell" disabled={busy || qty === 0} onClick={() => void sell()}>بيع</button>
      {have === 0 && stock !== null && <p className="tos-empty">لا تملك {fish.name} بعد. أرسل أسطولك للصيد.</p>}
      {note && <p role="status" className="tos-empty">{note}</p>}
    </div>
  );
}
