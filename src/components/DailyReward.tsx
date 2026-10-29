import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { playSfx } from "@/lib/sound";
import coinIcon from "@/assets/dock2/coin.png";
import rubyIcon from "@/assets/dock2/ruby.png";
import diamondIcon from "@/assets/dock2/diamond.png";

const KEY = "ib.daily.v1";
const DAYS = [
  { d: 1, icon: coinIcon, label: "5,000" },
  { d: 2, icon: coinIcon, label: "10,000" },
  { d: 3, icon: rubyIcon, label: "15" },
  { d: 4, icon: coinIcon, label: "25,000" },
  { d: 5, icon: diamondIcon, label: "40" },
  { d: 6, icon: rubyIcon, label: "60" },
  { d: 7, icon: diamondIcon, label: "الجائزة الكبرى" },
];

type Saved = { day: string; streak: number };

const today = () => new Date().toISOString().slice(0, 10);

/** Daily login reward sheet — opens once per day. */
export function DailyReward() {
  const [open, setOpen] = useState(false);
  const [streak, setStreak] = useState(1);

  useEffect(() => {
    let saved: Saved | null = null;
    try {
      saved = JSON.parse(window.localStorage.getItem(KEY) ?? "null") as Saved | null;
    } catch {
      saved = null;
    }
    if (saved?.day === today()) {
      setStreak(saved.streak);
      return;
    }
    const next = { day: today(), streak: Math.min(7, (saved?.streak ?? 0) + 1) };
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage blocked */
    }
    setStreak(next.streak);
    setOpen(true);
  }, []);

  if (!open) return null;

  const close = (v = 0.6) => { playSfx("click", v); setOpen(false); };
  const big = DAYS[6]!;
  return (
    <div className="daily-overlay" role="dialog" aria-label="مكافأة الدخول اليومي" dir="rtl">
      <div className="daily-panel">
        <button type="button" aria-label="إغلاق" onClick={() => close()} className="tos-x"><X className="h-4 w-4" /></button>
        <header className="daily-head">
          <span className="daily-kicker">سجل الإبحار اليومي</span>
          <h2 className="daily-title">خزينة العرش</h2>
          <div className="daily-streak"><b>{streak}</b><span>/ 7 أيام متتالية</span></div>
        </header>
        <ol className="daily-track">
          {DAYS.slice(0, 6).map((r) => (
            <li key={r.d} className={`daily-cell ${r.d < streak ? "daily-cell-past" : ""} ${r.d === streak ? "daily-cell-now" : ""}`}>
              <small>{r.d}</small>
              <img src={r.icon} alt="" width={40} height={40} />
              <b>{r.label}</b>
            </li>
          ))}
        </ol>
        <div className={`daily-grand ${streak === 7 ? "daily-cell-now" : ""}`}>
          <img src={big.icon} alt="" width={56} height={56} />
          <div><small>اليوم السابع</small><b>{big.label}</b><span>أكمل الأسبوع لتفتحها</span></div>
        </div>
        <button type="button" onClick={() => close(0.9)} className="tos-btn daily-claim">استلام مكافأة اليوم</button>
      </div>
    </div>
  );
}
