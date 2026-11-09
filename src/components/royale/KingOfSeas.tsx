import { useEffect, useRef, useState } from "react";
import gameAsset from "@/assets/royale/king_of_seas.html.asset.json";
import dragonAsset from "@/assets/royale/mountain_dragon.glb.asset.json";
import crest from "@/assets/royale/kos-crest.png";
import { playSfx } from "@/lib/sound";
import { supabase } from "@/integrations/supabase/client";
import { CaptainAvatar, nameSeed } from "@/components/GameSprite";
import type { Player } from "@/lib/player";
import { royaleScript, type RoyaleSeat } from "@/components/royale/royaleInject";

const LOBBY_SECONDS = 10;
const SLOTS = 10;
const LOBBY_CHANNEL = "royale-lobby";
const BOT_NAMES = [
  "صقر الخلجان", "الحوت الأسود", "قاهر العواصف", "ذيب اليم", "سيف المرجان",
  "ريّس الموج", "نجم الشمال", "شبح الضباب", "عقاب الصخور", "رعد الأعماق", "ملاح الفجر",
];

type Seat = { id: string; name: string; isBot: boolean; me?: boolean; avatar_index?: number; avatar_url?: string | null; joined: number };

/**
 * The game file is served by the asset CDN as a download with scripts disabled, so it can't run
 * when loaded directly in a frame. We fetch its text during the countdown, bake the start settings
 * in place of `location.search`, and open it from a local blob URL — scripts run and it opens instantly.
 */
let gamePromise: Promise<string> | null = null;
let dragonPromise: Promise<string> | null = null;
/** Download the dragon model once into memory so it appears the moment the battle starts. */
function prepareDragon(): Promise<string> {
  if (!dragonPromise) {
    const src = new URL(dragonAsset.url, window.location.origin).href;
    dragonPromise = fetch(src).then((r) => r.blob()).then((b) => URL.createObjectURL(new Blob([b], { type: "model/gltf-binary" }))).catch(() => src);
  }
  return dragonPromise;
}
/** Fetch + patch the game page text (cached). The launch step adds the captains and opens it. */
export function prepareGame(): Promise<string> {
  if (!gamePromise) {
    gamePromise = Promise.all([
      fetch(gameAsset.url).then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.text(); }),
      prepareDragon(),
    ])
      .then(([html, dragon]) => {
        const search = `?autostart=1&dragon=${encodeURIComponent(dragon)}`;
        return html
          .split("location.search").join(JSON.stringify(search))
          // dragon arrives right away and close by
          .replace("spawnIn:5,", "spawnIn:1,")
          .replace("V(s.pos.x+Math.cos(a)*260,45,s.pos.z+Math.sin(a)*260)", "V(s.pos.x+Math.cos(a)*110,45,s.pos.z+Math.sin(a)*110)")
          // the island is reached by last-3-ships, not by dragon kills
          .replace("if(W.kills>=2&&W.stage!==\"island\")", "if(false)");
      })
      .catch((e) => { gamePromise = null; throw e; });
  }
  return gamePromise;
}
function openGame(html: string, seats: RoyaleSeat[]): string {
  const i = html.lastIndexOf("</body>");
  const out = i >= 0 ? html.slice(0, i) + royaleScript(seats) + html.slice(i) : html + royaleScript(seats);
  return URL.createObjectURL(new Blob([out], { type: "text/html" }));
}

export function KingOfSeasButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="kos-gold-btn"
      onPointerEnter={() => { void prepareGame().catch(() => undefined); }}
      onClick={() => { playSfx("click", 0.8); void prepareGame().catch(() => undefined); onClick(); }}
      aria-label="ملك البحار"
    >
      <img src={crest} alt="" width={256} height={256} draggable={false} />
      <span>ملك البحار</span>
    </button>
  );
}

export function LegacyKingOfSeas({ player, playerName, onClose }: { player?: Player | null; playerName: string; onClose: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  const [joinedAt] = useState(() => Date.now());
  const [humans, setHumans] = useState<Seat[]>([]);
  const [bots, setBots] = useState<Seat[]>([]);
  const [phase, setPhase] = useState<"lobby" | "loading" | "game" | "error">("lobby");
  const [gameUrl, setGameUrl] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const myId = useRef(player?.id ?? `guest-${Math.random().toString(36).slice(2, 9)}`).current;

  const me: Seat = { id: myId, name: playerName || "القبطان", isBot: false, me: true, avatar_index: player?.avatar_index ?? nameSeed(playerName), avatar_url: player?.avatar_url ?? null, joined: joinedAt };

  // Start preloading immediately.
  useEffect(() => {
    prepareGame().then(() => setReady(true)).catch(() => setReady(false));
  }, []);
  useEffect(() => {
    const onMsg = (e: MessageEvent) => { if ((e.data as { type?: string })?.type === "kos-exit") onClose(); };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [onClose]);

  // Shared waiting room: captains opening the lobby on other devices appear in real time.
  useEffect(() => {
    const chan = supabase.channel(LOBBY_CHANNEL, { config: { presence: { key: myId } } });
    chan.on("presence", { event: "sync" }, () => {
      const state = chan.presenceState() as Record<string, Seat[]>;
      const list: Seat[] = [];
      for (const [k, arr] of Object.entries(state)) {
        const s = arr[arr.length - 1];
        if (k !== myId && s && Date.now() - s.joined < (LOBBY_SECONDS + 5) * 1000) list.push({ ...s, me: false, isBot: false });
      }
      setHumans(list);
    });
    void chan.subscribe((st) => { if (st === "SUBSCRIBED") void chan.track(me); });
    return () => { void supabase.removeChannel(chan); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId]);

  // Room clock: the earliest captain in the room sets the start time for everyone.
  const roomStart = Math.min(joinedAt, ...humans.map((h) => h.joined));
  const left = Math.max(0, Math.ceil((roomStart + LOBBY_SECONDS * 1000 - now) / 1000));

  useEffect(() => {
    if (phase !== "lobby") return;
    const t = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(t);
  }, [phase]);

  const realSeats = [me, ...humans].sort((a, b) => a.joined - b.joined).slice(0, SLOTS);

  // AI captains fill empty seats as the clock runs down.
  useEffect(() => {
    if (phase !== "lobby") return;
    const free = SLOTS - realSeats.length;
    const want = left <= 2 ? free : Math.min(free - 1, Math.floor(((LOBBY_SECONDS - left) / LOBBY_SECONDS) * free * 0.9));
    if (want > bots.length) {
      setBots((cur) => {
        const used = new Set([...realSeats, ...cur].map((s) => s.name));
        const pool = BOT_NAMES.filter((n) => !used.has(n));
        const add: Seat[] = [];
        for (let i = cur.length; i < want; i++) add.push({ id: `bot${i}`, name: pool[i - cur.length] ?? `قبطان ${i + 1}`, isBot: true, avatar_index: i * 3 + 1, joined: Date.now() });
        if (add.length) playSfx("click", 0.35);
        return [...cur, ...add];
      });
    }
    if (left <= 0) launch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, phase, realSeats.length]);

  const launched = useRef(false);
  const launch = () => {
    if (launched.current) return;
    launched.current = true;
    playSfx("click", 1);
    const list: RoyaleSeat[] = [...realSeats, ...bots].slice(0, SLOTS).map((s) => ({ name: s.name, isBot: s.isBot, me: !!s.me }));
    if (!ready) setPhase("loading");
    prepareGame().then((html) => { setGameUrl(openGame(html, list)); setPhase("game"); }).catch(() => { launched.current = false; setPhase("error"); });
  };

  const seats = [...realSeats, ...bots].slice(0, SLOTS);
  const ring = 2 * Math.PI * 44;

  return (
    <div className="kos-root" role="dialog" aria-label="ملك البحار">
      {phase === "game" && gameUrl ? (
        <>
          <iframe className="kos-frame" src={gameUrl} title="ملك البحار" allow="autoplay; fullscreen" onLoad={(e) => { const w = e.currentTarget.contentWindow; [400, 1200, 2500].forEach((ms) => window.setTimeout(() => w?.postMessage({ type: "kos-start" }, "*"), ms)); }} />
          <button type="button" className="kos-exit" onClick={onClose} aria-label="الخروج من المعركة">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 6l12 12M18 6 6 18" /></svg>
            خروج
          </button>
        </>
      ) : (
        <div className="kos-lobby">
          <header className="kos-head">
            <img src={crest} alt="" width={256} height={256} className="kos-head-crest" />
            <h2>ملك البحار</h2>
            <p>عشرة قباطنة في بحر واحد — آخر ثلاثة ينتقلون إلى جزيرة المصير</p>
          </header>

          <div className="kos-versus">
            <div className="kos-hero">
              <CaptainAvatar seed={me.avatar_index ?? 0} url={me.avatar_url} className="kos-hero-img" />
              <b>{me.name}</b>
              <em>قبطانك</em>
            </div>
            <div className="kos-clock" aria-live="polite">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" className="kos-clock-bg" />
                <circle cx="50" cy="50" r="44" className="kos-clock-fg" strokeDasharray={ring} strokeDashoffset={ring * (1 - left / LOBBY_SECONDS)} />
              </svg>
              <span>{phase === "loading" ? "…" : left}</span>
              <small>{phase === "loading" ? "تجهيز البحر" : phase === "error" ? "تعذّر التحميل" : "تبدأ الحرب"}</small>
            </div>
            <div className="kos-hero kos-hero-foe">
              <div className="kos-count-big">{seats.length}<small>/{SLOTS}</small></div>
              <b>قباطنة في الردهة</b>
              <em>{humans.length ? `${humans.length + 1} لاعبين حقيقيين` : "بانتظار المنضمين"}</em>
            </div>
          </div>

          <ul className="kos-seats">
            {Array.from({ length: SLOTS }, (_, i) => {
              const s = seats[i];
              return (
                <li key={s?.id ?? `e${i}`} className={s ? (s.me ? "me" : s.isBot ? "bot" : "human") : "empty"}>
                  {s ? (
                    <>
                      <CaptainAvatar seed={s.avatar_index ?? i} url={s.avatar_url} className="kos-seat-img" />
                      <b>{s.name}</b>
                      <em>{s.me ? "أنت" : s.isBot ? "قبطان آلي" : "لاعب"}</em>
                    </>
                  ) : (
                    <em>بانتظار قبطان…</em>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="kos-foot">
            <button type="button" className="kos-ghost" onClick={onClose}>مغادرة</button>
            {phase === "error"
              ? <button type="button" className="kos-go" onClick={launch}>إعادة المحاولة</button>
              : <button type="button" className="kos-go" disabled={phase === "loading"} onClick={launch}>ابدأ الآن</button>}
          </div>
        </div>
      )}
    </div>
  );
}
