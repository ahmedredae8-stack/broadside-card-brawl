import { useEffect, useState } from "react";
import { Radio, Swords, X, Users, Check, Bot, Ban } from "lucide-react";
import { playerFromMeta, useDuelLobby, type LobbyMeta } from "@/lib/duelNet";
import { CaptainAvatar } from "@/components/GameSprite";
import { playSfx } from "@/lib/sound";
import type { Player } from "@/lib/player";
import { powerOf } from "@/components/battle/BattleScreen";

/** Live-duel lobby: captains online right now, challenge / accept handshake, then the arena opens. */
export function LiveDuels({ me, onDuel }: { me: Player | null; onDuel: (foe: Player, matchId: string, role: "host" | "guest") => void }) {
  const [queueing, setQueueing] = useState(false);
  const { others, incoming, outgoing, challenge, respond, cancelOutgoing } = useDuelLobby(me, queueing);
  const [asking, setAsking] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  // Keep the incoming-challenge countdown alive.
  useEffect(() => {
    const id = window.setInterval(() => setTick((v) => v + 1), 500);
    return () => window.clearInterval(id);
  }, []);

  const sendChallenge = async (peer: LobbyMeta) => {
    if (!me || asking) return;
    setAsking(peer.id);
    playSfx("click", 0.6);
    const r = await challenge(peer);
    setAsking(null);
    if (r !== "timeout") playSfx("click", 0.8);
    if (typeof r === "object") onDuel(playerFromMeta(peer), r.matchId, "host");
    else if (r === "ai") { setNotice(`${peer.name} سلّم القيادة لقبطانه الآلي — المعركة تبدأ`); window.setTimeout(() => onDuel(playerFromMeta(peer), "", "host"), 900); }
    else setNotice(r === "declined" ? `${peer.name} رفض التحدي` : r === "blocked" ? `${peer.name} لا يقبل تحدياتك` : `${peer.name} لم يرد على التحدي`);
  };

  const accept = (c: NonNullable<typeof incoming>) => {
    playSfx("click", 0.9);
    const m = respond(c, true);
    if (m) onDuel(m.foe, m.matchId, m.role);
  };

  const fresh = others.slice().sort((a, b) => Number(b.waiting) - Number(a.waiting) || a.name.localeCompare(b.name, "ar"));
  const countdown = incoming ? Math.max(0, Math.ceil((incoming.until - Date.now()) / 1000)) : 0;

  return (
    <div className="duel-live">
      <div className="duel-live-head">
        <div className="duel-live-note">
          <strong>القباطنة في البحر الآن</strong>
          <span>{fresh.length ? `${fresh.length} قبطان متصل — حدِّده لترسل له تحدياً` : "ابقَ في القائمة حتى يتحداك قبطان"}</span>
        </div>
        <button
          type="button"
          className={queueing ? "tos-btn duel-queue on" : "tos-btn duel-queue"}
          onClick={() => { setQueueing((v) => !v); playSfx("click", 0.5); }}
        >
          <Radio className="h-4 w-4" />
          {queueing ? "أنت في قائمة التحدي" : "انضم لقائمة التحدي"}
        </button>
      </div>

      {outgoing && (
        <div className="duel-banner" role="status">
          <Swords className="h-4 w-4" />
          <span>بانتظار موافقة {outgoing.to.name}…</span>
          <button type="button" className="tos-x" aria-label="إلغاء التحدي" onClick={cancelOutgoing}><X className="h-4 w-4" /></button>
        </div>
      )}

      {notice && !outgoing && (
        <div className="duel-banner" role="status">
          <span>{notice}</span>
          <button type="button" className="tos-x" aria-label="إغلاق" onClick={() => setNotice(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {incoming && (
        <div className="duel-banner duel-banner-in" role="alert">
          <CaptainAvatar seed={incoming.from.avatar_index ?? 0} url={incoming.from.avatar_url} className="ranking-avatar" />
          <span><b>{incoming.from.name}</b> يتحداك! ({countdown})</span>
          <div className="duel-replies">
            <button type="button" className="tos-btn" onClick={() => accept(incoming)}><Check className="h-4 w-4" />العب</button>
            <button type="button" className="tos-btn duel-ai" onClick={() => { playSfx("click", 0.6); respond(incoming, "ai"); }}><Bot className="h-4 w-4" />قبطاني الآلي</button>
            <button type="button" className="tos-btn duel-no" onClick={() => respond(incoming, "decline")}><X className="h-4 w-4" />رفض</button>
            <button type="button" className="tos-btn duel-block" onClick={() => respond(incoming, "block")}><Ban className="h-4 w-4" />رفض نهائي</button>
          </div>
        </div>
      )}

      {fresh.length ? (
        <ol className="ranking-list">
          {fresh.map((p) => (
            <li key={p.id}>
              <button type="button" className="pirate-row" disabled={!!asking} onClick={() => void sendChallenge(p)}>
                <CaptainAvatar seed={p.avatar_index ?? 0} url={p.avatar_url} className="ranking-avatar" />
                <strong>{p.name}</strong>
                {p.waiting && <em className="duel-waiting">جاهز للتحدي</em>}
                <span><Swords className="h-3.5 w-3.5" /> {asking === p.id ? "…يُرسل التحدي" : "تحدَّ"}</span>
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <div className="dock-empty">
          <Users size={40} strokeWidth={1.4} />
          <strong>لا يوجد قباطنة متصلون الآن</strong>
          <span>افتح هذه النافذة على جهازين وسجّل دخول قبطانين لتتحاچما مباشرة.</span>
        </div>
      )}
      <p className="duel-live-foot">المعركة الحيّة: كل ضربة ودرع وحركة تُبَثّ للخصم لحظياً — بلا قبطان آلي.</p>
    </div>
  );
}
