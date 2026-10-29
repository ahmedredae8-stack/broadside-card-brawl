import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { BattleScreen, type LabOpts } from "@/components/battle/BattleScreen";
import { isArtworkAdmin } from "@/lib/artwork";
import type { Player } from "@/lib/player";

export const Route = createFileRoute("/admin_/battle")({
  head: () => ({ meta: [
    { title: "استوديو المعارك — عرش البحار" },
    { name: "description", content: "مختبر المشرفين لتجربة الأسلحة والدروع ومؤثرات القتال." },
    { property: "og:title", content: "استوديو المعارك — عرش البحار" },
    { property: "og:description", content: "مختبر المشرفين لتجربة الأسلحة والدروع ومؤثرات القتال." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  ssr: false,
  component: BattleLab,
});

const now = new Date().toISOString();
const ME: Player = { id: "lab-me", name: "قبطان المختبر", theme_id: "", last_seen: now, created_at: now, avatar_index: 0, score: 0 };
const FOE: Player = { id: "lab-foe", name: "هدف التدريب", theme_id: "", last_seen: now, created_at: now, avatar_index: 3, score: 0 };

function BattleLab() {
  const nav = useNavigate();
  const [ok, setOk] = useState<boolean | null>(null);
  const [opts, setOpts] = useState<LabOpts>({ infinite: true, bot: false, outcome: "auto", dmgX: 1, regenX: 1 });
  const [key, setKey] = useState(0);
  useEffect(() => { void isArtworkAdmin().then(setOk).catch(() => setOk(false)); }, []);
  if (!ok) return <main className="social-page" dir="rtl"><div className="social-wrap"><header className="social-titlebar"><Link to="/admin" className="icon-control" aria-label="رجوع"><ArrowRight /></Link><div><span>للمشرفين</span><h1>استوديو المعارك</h1></div></header>
    {ok === null ? <p className="dock-loading">جارٍ التحقق…</p> : <div className="dock-empty"><ShieldAlert size={40} /><strong>هذه الصفحة للمشرفين فقط</strong></div>}</div></main>;
  const set = <K extends keyof LabOpts>(k: K, v: LabOpts[K]) => setOpts((o) => ({ ...o, [k]: v }));
  return (
    <>
      <BattleScreen me={ME} foe={FOE} lab={opts} labKey={key} onClose={() => void nav({ to: "/admin" })} />
      <aside className="bt-lab" dir="rtl" aria-label="أدوات المختبر">
        <h3>استوديو المعارك</h3>
        <label>طاقة لا نهائية <input type="checkbox" checked={opts.infinite} onChange={(e) => set("infinite", e.target.checked)} /></label>
        <label>الخصم الآلي يهاجم <input type="checkbox" checked={opts.bot} onChange={(e) => set("bot", e.target.checked)} /></label>
        <label>النتيجة
          <select value={opts.outcome} onChange={(e) => set("outcome", e.target.value as LabOpts["outcome"])}>
            <option value="auto">حسب القواعد</option><option value="hit">إصابة</option><option value="miss">طاشت</option><option value="blocked">صدّ الدرع</option>
          </select>
        </label>
        <label>مضاعف الضرر ×{opts.dmgX} <input type="range" min={0} max={3} step={0.5} value={opts.dmgX} onChange={(e) => set("dmgX", Number(e.target.value))} /></label>
        <label>سرعة الطاقة ×{opts.regenX} <input type="range" min={1} max={5} step={1} value={opts.regenX} onChange={(e) => set("regenX", Number(e.target.value))} /></label>
        <button type="button" className="tos-btn" onClick={() => setKey((k) => k + 1)}>إعادة الأسطولين</button>
      </aside>
    </>
  );
}
