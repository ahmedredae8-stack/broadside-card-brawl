import { useEffect, useRef, useState } from "react";
import gameAsset from "@/assets/royale/king_of_seas.html.asset.json";
import dragonAsset from "@/assets/royale/mountain_dragon.glb.asset.json";
import { playSfx } from "@/lib/sound";

const LOBBY_SECONDS = 10;
const SLOTS = 10;
const BOT_NAMES = [
  "صقر الخلجان", "الحوت الأسود", "قاهر العواصف", "ذيب اليم", "سيف المرجان",
  "ريّس الموج", "نجم الشمال", "شبح الضباب", "عقاب الصخور", "رعد الأعماق", "ملاح الفجر",
];
const BOT_COLORS = ["#c9412f", "#2f7fc9", "#3aa36b", "#a55fd0", "#d08a2f", "#2fb7b0", "#c92f7a", "#7a8a2f"];

type Seat = { id: string; name: string; isBot: boolean; color: string };

function Avatar({ seat }: { seat: Seat }) {
  return (
    <svg viewBox="0 0 64 64" className="kos-avatar" aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill={seat.color} opacity="0.35" />
      <circle cx="32" cy="26" r="11" fill="currentColor" opacity="0.9" />
      <path d="M12 56c3-11 11-16 20-16s17 5 20 16" fill="currentColor" opacity="0.9" />
      <path d="M18 20c4-8 24-8 28 0l-2 3H20z" fill={seat.color} />
    </svg>
  );
}

export function KingOfSeasButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="kos-gold-btn"
      onClick={() => { playSfx("click", 0.8); onClick(); }}
      aria-label="ملك البحار"
    >
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
        <path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z" />
      </svg>
      <span>ملك البحار</span>
    </button>
  );
}

export function KingOfSeas({ playerName, onClose }: { playerName: string; onClose: () => void }) {
  const [left, setLeft] = useState(LOBBY_SECONDS);
  const [seats, setSeats] = useState<Seat[]>(() => [
    { id: "me", name: playerName || "القبطان", isBot: false, color: "#e8b64c" },
  ]);
  const [phase, setPhase] = useState<"lobby" | "game">("lobby");
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (phase !== "lobby") return;
    const t = window.setInterval(() => setLeft((s) => s - 1), 1000);
    return () => window.clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "lobby") return;
    setSeats((cur) => {
      const want = left <= 2 ? SLOTS : Math.min(SLOTS - 1, cur.length + (Math.random() < 0.6 ? 1 : 0));
      if (want <= cur.length) return cur;
      const used = new Set(cur.map((s) => s.name));
      const pool = BOT_NAMES.filter((n) => !used.has(n));
      const add: Seat[] = [];
      for (let i = cur.length; i < want; i++) {
        add.push({ id: `bot${i}`, name: pool[i % pool.length] ?? `قبطان ${i}`, isBot: true, color: BOT_COLORS[i % BOT_COLORS.length] ?? "#2f7fc9" });
      }
      return [...cur, ...add];
    });
    if (left <= 0) {
      playSfx("click", 1);
      setPhase("game");
    }
  }, [left, phase]);

  const src = `${gameAsset.url}?autostart=1&dragon=${encodeURIComponent(dragonAsset.url)}`;

  return (
    <div className="kos-root" role="dialog" aria-label="ملك البحار">
      {phase === "lobby" ? (
        <div className="kos-lobby">
          <header className="kos-head">
            <h2>ملك البحار</h2>
            <p>معركة بحرية لعشرة قباطنة — آخر ثلاثة ينتقلون إلى جزيرة المصير</p>
          </header>
          <div className="kos-count" aria-live="polite">
            <span>{Math.max(0, left)}</span>
            <small>تبدأ الحرب خلال</small>
          </div>
          <ul className="kos-seats">
            {Array.from({ length: SLOTS }, (_, i) => {
              const s = seats[i];
              return (
                <li key={i} className={s ? (s.isBot ? "bot" : "me") : "empty"}>
                  {s ? (
                    <>
                      <Avatar seat={s} />
                      <b>{s.name}</b>
                      <em>{s.isBot ? "قبطان آلي" : "أنت"}</em>
                    </>
                  ) : (
                    <em>بانتظار قبطان…</em>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="kos-foot">
            <span>{seats.length} / {SLOTS} قباطنة</span>
            <button type="button" className="kos-ghost" onClick={onClose}>مغادرة الردهة</button>
          </div>
        </div>
      ) : (
        <>
          <iframe ref={frame} className="kos-frame" src={src} title="ملك البحار" allow="autoplay; fullscreen" />
          <button type="button" className="kos-exit" onClick={onClose} aria-label="الخروج من المعركة">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 6l12 12M18 6 6 18" /></svg>
            خروج
          </button>
        </>
      )}
    </div>
  );
}
