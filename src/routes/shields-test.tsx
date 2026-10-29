import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import ShieldOverlay, { type ShieldState } from "@/shields/ShieldOverlay";
import shields from "@/shields/shields.json";
import { fleetCatalog } from "@/lib/fleetCatalog";

export const Route = createFileRoute("/shields-test")({
  head: () => ({ meta: [
    { title: "اختبار الدروع — عرش البحار" },
    { name: "description", content: "صفحة اختبار الدروع الخمسة فوق السفن وكل حالاتها." },
    { property: "og:title", content: "اختبار الدروع — عرش البحار" },
    { property: "og:description", content: "جرّب الدروع الخمسة: ظهور، إصابة، انكسار، ارتداد." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  ssr: false,
  component: ShieldsTest,
});

type ShieldInfo = { tier: 1 | 2 | 3 | 4 | 5; name_ar: string; blocks: string[]; hits: number; reflect: number; blocks_ultimate: boolean; look: string };
const DATA = shields as unknown as { viewBox: number[]; states: ShieldState[]; shields: ShieldInfo[] };
const BLOCK_AR: Record<string, string> = { kinetic: "حركي", fire: "نار", frost: "جليد", pierce: "اختراق", piercing: "اختراق", ice: "جليد", ultimate_half: "شمس الليل (نصف القوة)", all: "الجميع" };
const STATE_AR: Record<string, string> = { idle: "راحة", spawn: "ظهور", hit: "إصابة", break: "انكسار", reflect: "ارتداد", off: "إخفاء" };

function ShieldsTest() {
  const [tier, setTier] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [state, setState] = useState<ShieldState>("spawn");
  const [trigger, setTrigger] = useState(0);
  const [impact, setImpact] = useState({ x: 290, y: 105 });
  const [code, setCode] = useState(fleetCatalog[4]!.code);
  const ship = fleetCatalog.find((s) => s.code === code)!;
  const box = useRef<HTMLDivElement>(null);
  const [vx, , vw, vh] = DATA.viewBox as [number, number, number, number];

  const hit = (e: React.MouseEvent) => {
    const svg = box.current?.querySelector("svg");
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const x = vx + ((e.clientX - r.left) / r.width) * vw;
    const y = ((e.clientY - r.top) / r.height) * vh;
    setImpact({ x: Math.round(x), y: Math.round(y) });
    setState(tier === 5 ? "reflect" : "hit");
    setTrigger((n) => n + 1);
  };
  const info = DATA.shields.find((s) => s.tier === tier)!;

  return (
    <main className="social-page" dir="rtl">
      <div className="social-wrap">
        <header className="social-titlebar"><Link to="/" className="icon-control" aria-label="رجوع"><ArrowRight /></Link><div><span>صفحة اختبار</span><h1>الدروع</h1></div></header>
        <div className="shield-stage" onClick={hit}>
          <div className="shield-ship" ref={box}>
            <img src={ship.hull} alt={ship.name} />
            <ShieldOverlay tier={tier} state={state} trigger={trigger} impact={impact} />
          </div>
        </div>
        <p className="shield-hint">اضغط على الدرع لضربه · نقطة الإصابة ({impact.x}, {impact.y})</p>
        <div className="studio-chips">
          {DATA.shields.map((s) => <button key={s.tier} type="button" className={s.tier === tier ? "studio-chip on" : "studio-chip"} onClick={() => { setTier(s.tier); setState("spawn"); setTrigger((n) => n + 1); }}>{s.name_ar}</button>)}
        </div>
        <div className="studio-chips">
          {DATA.states.map((st) => <button key={st} type="button" className={st === state ? "studio-chip on" : "studio-chip"} onClick={() => { setState(st); setTrigger((n) => n + 1); }}>{STATE_AR[st] ?? st}</button>)}
          <select className="studio-select" value={code} onChange={(e) => setCode(e.target.value)} aria-label="السفينة">{fleetCatalog.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}</select>
        </div>
        <p className="shield-hint">{info.look}</p>
        <table className="shield-table">
          <thead><tr><th>المستوى</th><th>الاسم</th><th>يصدّ</th><th>الضربات</th><th>الارتداد</th></tr></thead>
          <tbody>{DATA.shields.map((s) => (
            <tr key={s.tier} className={s.tier === tier ? "on" : ""}><td>{s.tier}</td><td>{s.name_ar}</td><td>{s.blocks.map((b) => BLOCK_AR[b] ?? b).join(" + ")}</td><td>{s.hits}</td><td>{s.reflect ? `${Math.round(s.reflect * (s.reflect <= 1 ? 100 : 1))}%` : "لا"}</td></tr>
          ))}</tbody>
        </table>
      </div>
    </main>
  );
}
