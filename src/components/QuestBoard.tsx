import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";

import { QUESTS, claim, isDone, loadQuests, type QuestState } from "@/lib/quests";
import { playSfx } from "@/lib/sound";
import rubyIcon from "@/assets/dock2/ruby.png";

/** Daily quests in the same royal treasury frame as the daily reward. */
export function QuestBoard({ onClose }: { onClose?: () => void }) {
  const [state, setState] = useState<QuestState | null>(null);

  useEffect(() => {
    setState(loadQuests());
    const onStorage = () => setState(loadQuests());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!state) return null;
  const doneCount = QUESTS.filter((q) => state.claimed.includes(q.id)).length;

  return (
    <div className="daily-panel quest-panel" dir="rtl">
      {onClose && <button type="button" aria-label="إغلاق" onClick={() => { playSfx("click", 0.6); onClose(); }} className="tos-x"><X className="h-4 w-4" /></button>}
      <header className="daily-head">
        <span className="daily-kicker">أوامر الأميرال اليومية</span>
        <h2 className="daily-title">لوح المهام</h2>
        <div className="daily-streak"><b>{doneCount}</b><span>/ {QUESTS.length} مهام مستلمة</span></div>
      </header>
      <ul className="quest2-list">
        {QUESTS.map((q) => {
          const done = isDone(state, q);
          const taken = state.claimed.includes(q.id);
          const have = Math.min(q.goal, state.progress[q.id] ?? 0);
          const pct = Math.round((have / q.goal) * 100);
          return (
            <li key={q.id} className={`quest2 ${done && !taken ? "quest2-ready" : ""} ${taken ? "quest2-taken" : ""}`}>
              <span className="quest2-icon"><img src={q.icon} alt="" /></span>
              <div className="quest2-copy">
                <b>{q.title}</b>
                <small>{q.hint}</small>
                <div className="quest2-bar"><span style={{ width: `${pct}%` }} /></div>
                <em>{have} / {q.goal}</em>
              </div>
              <button
                type="button"
                disabled={!done || taken}
                className="quest2-claim"
                onClick={() => { playSfx("click", 0.8); setState((s) => (s ? claim(s, q.id) : s)); }}
              >
                {taken ? <Check className="h-4 w-4" /> : <img src={rubyIcon} alt="" />}
                <span>{taken ? "تم" : q.gems}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="gate-note">رصيد مكافآت المهام: {state.gems}</p>
    </div>
  );
}
