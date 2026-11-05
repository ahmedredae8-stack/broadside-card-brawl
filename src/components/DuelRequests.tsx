import { useEffect, useState } from "react";
import { Ban, Bot, Check, Swords, X } from "lucide-react";
import { CaptainAvatar } from "@/components/GameSprite";
import type { Challenge } from "@/lib/duelNet";

/** App-wide fight requests: incoming challenge with four answers, outgoing wait, and result notices. */
export function DuelRequests({ incoming, outgoing, notice, onAnswer, onCancel, onDismiss }: {
  incoming: Challenge | null;
  outgoing: { to: { name: string } } | null;
  notice: string | null;
  onAnswer: (c: Challenge, r: "accept" | "ai" | "decline" | "block") => void;
  onCancel: () => void;
  onDismiss: () => void;
}) {
  const [, tick] = useState(0);
  useEffect(() => { const t = window.setInterval(() => tick((v) => v + 1), 500); return () => window.clearInterval(t); }, []);
  if (!incoming && !outgoing && !notice) return null;
  const left = incoming ? Math.max(0, Math.ceil((incoming.until - Date.now()) / 1000)) : 0;
  return (
    <div className="duel-requests" dir="rtl">
      {incoming && (
        <div className="duel-banner duel-banner-in" role="alert">
          <CaptainAvatar seed={incoming.from.avatar_index ?? 0} url={incoming.from.avatar_url} className="ranking-avatar" />
          <span><b>{incoming.from.name}</b> يطلب قتالك! ({left})</span>
          <div className="duel-replies">
            <button type="button" className="tos-btn" onClick={() => onAnswer(incoming, "accept")}><Check className="h-4 w-4" />العب</button>
            <button type="button" className="tos-btn duel-ai" onClick={() => onAnswer(incoming, "ai")}><Bot className="h-4 w-4" />قبطاني الآلي</button>
            <button type="button" className="tos-btn duel-no" onClick={() => onAnswer(incoming, "decline")}><X className="h-4 w-4" />رفض</button>
            <button type="button" className="tos-btn duel-block" onClick={() => onAnswer(incoming, "block")}><Ban className="h-4 w-4" />رفض نهائي</button>
          </div>
        </div>
      )}
      {outgoing && (
        <div className="duel-banner" role="status">
          <Swords className="h-4 w-4" /><span>أُرسل طلب القتال إلى {outgoing.to.name}… بانتظار رده</span>
          <button type="button" className="tos-x" aria-label="إلغاء" onClick={onCancel}><X className="h-4 w-4" /></button>
        </div>
      )}
      {notice && !outgoing && (
        <div className="duel-banner" role="status">
          <span>{notice}</span>
          <button type="button" className="tos-x" aria-label="إغلاق" onClick={onDismiss}><X className="h-4 w-4" /></button>
        </div>
      )}
    </div>
  );
}
