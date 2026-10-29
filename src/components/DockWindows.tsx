import { useEffect, useState } from "react";
import { Bell, Search, Crown, Fish, Shield, Skull, Swords, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CaptainAvatar } from "@/components/GameSprite";
import type { Player } from "@/lib/player";
import { getTheme } from "@/lib/themes";

type Ranking = "events" | "damage" | "fish" | "tribes";
const boards = [
  { id: "events" as const, label: "الفعاليات", icon: Trophy },
  { id: "damage" as const, label: "ملوك الضرر", icon: Swords },
  { id: "fish" as const, label: "ملوك الصيد", icon: Fish },
  { id: "tribes" as const, label: "ترتيب القبيلة في قتل الوحش", icon: Crown },
];

export function RankingsWindow({ onPick }: { onPick?: (p: Player) => void } = {}) {
  const [board, setBoard] = useState<Ranking>("events");
  const [players, setPlayers] = useState<Pick<Player, "id" | "name" | "score" | "avatar_index">[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [found, setFound] = useState<Player[] | null>(null);
  useEffect(() => {
    const term = q.trim();
    if (term.length < 1) { setFound(null); return; }
    const t = window.setTimeout(() => {
      void supabase.from("players").select("*").ilike("name", `%${term.replace(/[%_]/g, "")}%`).limit(20).then(({ data }) => setFound((data ?? []) as Player[]));
    }, 250);
    return () => window.clearTimeout(t);
  }, [q]);
  useEffect(() => {
    let active = true;
    void supabase.from("players").select("*").order("score", { ascending: false }).limit(25).then(({ data }) => {
      if (active) { setPlayers(data ?? []); setLoading(false); }
    });
    return () => { active = false; };
  }, []);
  return <div className="dock-content">
    <label className="pirate-search"><Search size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن قرصان بالاسم…" aria-label="ابحث عن قرصان" /></label>
    {found ? (found.length ? <ol className="ranking-list">{found.map((p) => <li key={p.id}><button type="button" className="pirate-row" onClick={() => onPick?.(p)}><CaptainAvatar seed={p.avatar_index ?? 0} url={p.avatar_url} className="ranking-avatar" /><strong>{p.name}</strong><span>عرض الملف</span></button></li>)}</ol> : <EmptyState icon={Users} title="لا يوجد قرصان بهذا الاسم" detail="جرّب جزءًا آخر من الاسم." />) : <>
    <nav className="dock-tabs dock-tabs-wrap" aria-label="تصنيفات اللاعبين">{boards.map(({ id, label, icon: Icon }) => <Button key={id} variant="ghost" className={board === id ? "dock-tab active" : "dock-tab"} onClick={() => setBoard(id)}><Icon size={16} />{label}</Button>)}</nav>
    <div className="dock-section-heading"><Trophy size={20} /><strong>{boards.find((item) => item.id === board)?.label}</strong></div>
    {board !== "events" ? <EmptyState icon={Trophy} title="لا توجد نتائج مسجلة بعد" detail="ستظهر المراتب عند توفر سجل المنافسة لهذا التصنيف." /> : loading ? <p className="dock-loading">جارٍ تحميل الترتيب…</p> : players.length ? <ol className="ranking-list">{players.map((player, i) => <li key={player.id} onClick={() => onPick?.(player as Player)} style={{ cursor: onPick ? "pointer" : undefined }}><b className="ranking-position">{String(i + 1).padStart(2, "0")}</b><CaptainAvatar seed={player.avatar_index ?? 0} url={(player as { avatar_url?: string | null }).avatar_url} className="ranking-avatar" /><strong>{player.name}</strong><span>{(player.score ?? 0).toLocaleString("ar")} نقطة</span></li>)}</ol> : <EmptyState icon={Trophy} title="لا يوجد لاعبون في الترتيب بعد" detail="تظهر النتائج بعد بدء اللعب." />}
    </>}
  </div>;
}

export function InventoryWindow({ player }: { player: Player | null }) {
  const theme = getTheme(player?.theme_id ?? "");
  const [category, setCategory] = useState("أسلحة");
  const categories = ["أسلحة", "طواقم", "دروع", "خلفيات"];
  return <div className="dock-content">
    <nav className="dock-tabs" aria-label="أقسام المخزن">{categories.map((item) => <Button key={item} variant="ghost" className={category === item ? "dock-tab active" : "dock-tab"} onClick={() => setCategory(item)}>{item}</Button>)}</nav>
    {category === "خلفيات" && player ? <div className="inventory-world"><img src={theme.day.poster} alt="" /><div><strong>{theme.name}</strong><span>الخلفية الحالية</span></div></div> : <EmptyState icon={Shield} title={player ? `لا توجد ${category} في مخزنك` : "سجل دخولك لعرض مخزنك"} detail={player ? "ستظهر هنا مقتنياتك عند إتاحتها داخل اللعبة." : "المخزن مرتبط بحساب القبطان."} />}
  </div>;
}

function EmptyState({ icon: Icon, title, detail }: { icon: typeof Bell; title: string; detail: string }) {
  return <div className="dock-empty"><Icon size={40} strokeWidth={1.4} /><strong>{title}</strong><span>{detail}</span></div>;
}

export function AlertsWindow() {
  return <div className="dock-content"><div className="dock-section-heading"><Bell size={20} /><strong>سجل التنبيهات</strong></div><EmptyState icon={Bell} title="لا توجد تنبيهات حالياً" detail="تظهر هنا أخبار الهجمات والسرقات عندما تقع فعلاً." /></div>;
}

export function EnemiesWindow() {
  return <div className="dock-content"><div className="dock-section-heading"><Skull size={20} /><strong>قائمة الأعداء</strong></div><EmptyState icon={Users} title="قائمة الأعداء فارغة" detail="يظهر هنا اللاعبون المرتبطون بهجمات مسجلة عليك." /></div>;
}