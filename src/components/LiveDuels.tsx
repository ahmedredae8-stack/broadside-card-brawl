import { useEffect, useMemo, useState } from "react";
import { Swords, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { playerFromMeta, type LobbyMeta } from "@/lib/duelNet";
import { CaptainAvatar } from "@/components/GameSprite";
import { isOnline, type Player } from "@/lib/player";

/** Two always-active AI captains whose identities rotate, so the sea never looks empty. */
const DECOY_NAMES = ["صقر الخلجان", "الحوت الأسود", "قاهر العواصف", "ذيب اليم", "سيف المرجان", "ريّس الموج", "نجم الشمال", "شبح الضباب", "عقاب الصخور", "رعد الأعماق", "ملاح الفجر", "سلطان الموج"];
export const isDecoy = (id: string) => id.startsWith("decoy-");
const ROTATE_MS = 45_000;

function decoys(slot: number): Player[] {
  return [0, 1].map((i) => {
    const n = (slot * 2 + i * 5) % DECOY_NAMES.length;
    return { id: `decoy-${slot}-${i}`, name: DECOY_NAMES[n]!, theme_id: "", last_seen: new Date().toISOString(), created_at: "", avatar_index: n * 3 + 2, score: 800 + ((slot * 37 + i * 211) % 900) };
  });
}

/** Every captain: live ones first, then the two active AI captains, then everyone else. Tap opens their dossier. */
export function LiveDuels({ me, online, onPick }: { me: Player | null; online: LobbyMeta[]; onPick: (p: Player) => void }) {
  const [all, setAll] = useState<Player[]>([]);
  const [slot, setSlot] = useState(() => Math.floor(Date.now() / ROTATE_MS));

  useEffect(() => {
    let alive = true;
    void supabase.from("players").select("*").order("last_seen", { ascending: false }).limit(200).then(({ data }) => { if (alive) setAll((data ?? []) as Player[]); });
    const t = window.setInterval(() => setSlot(Math.floor(Date.now() / ROTATE_MS)), 5_000);
    return () => { alive = false; window.clearInterval(t); };
  }, []);

  const rows = useMemo(() => {
    const liveIds = new Set(online.map((o) => o.id));
    const live = online.filter((o) => o.id !== me?.id).map((o) => ({ p: playerFromMeta(o), tag: "live" as const }));
    const bots = decoys(slot).map((p) => ({ p, tag: "active" as const }));
    const rest = all.filter((p) => p.id !== me?.id && !liveIds.has(p.id)).map((p) => ({ p, tag: isOnline(p.last_seen) ? ("recent" as const) : ("away" as const) }));
    return [...live, ...bots, ...rest];
  }, [online, all, slot, me?.id]);

  const label = { live: "متصل الآن", active: "نشط في البحر", recent: "شوهد مؤخراً", away: "غائب — يقاتل عنه قبطان آلي" };

  return (
    <div className="duel-live">
      <div className="duel-live-head">
        <div className="duel-live-note">
          <strong>كل القباطنة</strong>
          <span>اضغط على أي قبطان لتختار هجوم أو مراسلة — المتصلون يصلهم طلب القتال فوراً</span>
        </div>
      </div>
      {rows.length ? (
        <ol className="ranking-list">
          {rows.map(({ p, tag }) => (
            <li key={p.id}>
              <button type="button" className="pirate-row" onClick={() => onPick(p)}>
                <CaptainAvatar seed={p.avatar_index ?? 0} url={p.avatar_url} className="ranking-avatar" />
                <strong>{p.name}</strong>
                <em className={tag === "live" || tag === "active" ? "duel-waiting" : "duel-away"}>{label[tag]}</em>
                <span><Swords className="h-3.5 w-3.5" /> اختر</span>
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <div className="dock-empty"><Users size={40} strokeWidth={1.4} /><strong>جارٍ تحميل القباطنة…</strong></div>
      )}
    </div>
  );
}
