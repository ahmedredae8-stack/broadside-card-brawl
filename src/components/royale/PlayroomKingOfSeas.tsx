import { useEffect, useMemo, useRef, useState } from "react";
import { getPlayroomParticipants, joinPlayroomRoom } from "@/lib/playroom";
import type { Player } from "@/lib/player";
import { myPlayer, type PlayerState } from "playroomkit";
import { playSfx } from "@/lib/sound";
import { prepareGame } from "@/components/royale/KingOfSeas";
import { royaleScript, type RoyaleSeat } from "@/components/royale/royaleInject";

const SLOTS = 10;
const BOT_NAMES = ["صقر الخلجان", "الحوت الأسود", "قاهر العواصف", "ذيب اليم", "سيف المرجان", "ريّس الموج", "نجم الشمال", "شبح الضباب", "عقاب الصخور", "رعد الأعماق"];
type CaptainState = { id: string; name: string; avatar_index: number; avatar_url: string | null };
type SeaState = { pos: { x: number; y: number; z: number }; hp: number; alive: boolean };
type SeaHit = { id: string; shooterId: string; targetId: string; damage: number };

function profileFor(p: PlayerState): CaptainState {
  const custom = p.getState("broadside-captain") as CaptainState | undefined;
  const profile = p.getProfile();
  return custom ?? { id: p.id, name: profile.name || "قبطان", avatar_index: profile.avatarIndex ?? 0, avatar_url: profile.photo || null };
}

function roomSeats(players: PlayerState[], self: PlayerState, player?: Player | null, playerName?: string): RoyaleSeat[] {
  const humans = players.map((p) => {
    const custom = profileFor(p);
    const mine = p.id === self.id;
    const captain = mine && player
      ? { id: player.id, name: playerName || player.name, avatar_index: player.avatar_index ?? 0, avatar_url: player.avatar_url ?? null }
      : custom;
    return { id: p.id, name: captain.name, isBot: false, me: mine, avatar_index: captain.avatar_index, avatar_url: captain.avatar_url };
  });
  const spare = Math.max(0, SLOTS - humans.length);
  const bots = Array.from({ length: spare }, (_, i) => ({ id: `bot-${i}`, name: BOT_NAMES[i] ?? `قبطان آلي ${i + 1}`, isBot: true, avatar_index: i * 3 + 1, avatar_url: null }));
  return [...humans, ...bots].slice(0, SLOTS);
}

function makeGameUrl(html: string, seats: RoyaleSeat[], playerId: string) {
  const script = royaleScript(seats, playerId);
  const at = html.lastIndexOf("</body>");
  const source = at >= 0 ? html.slice(0, at) + script + html.slice(at) : html + script;
  return URL.createObjectURL(new Blob([source], { type: "text/html" }));
}

export function KingOfSeas({ player, playerName, onClose }: { player?: Player | null; playerName: string; onClose: () => void }) {
  const [phase, setPhase] = useState<"lobby" | "loading" | "game" | "error">("lobby");
  const [message, setMessage] = useState("جارٍ الاتصال بغرفة Playroom…");
  const [gameUrl, setGameUrl] = useState<string | null>(null);
  const [roomPlayer, setRoomPlayer] = useState<PlayerState | null>(null);
  const [seatCount, setSeatCount] = useState(1);
  const frame = useRef<HTMLIFrameElement>(null);
  const roomRef = useRef<PlayerState | null>(null);
  const blobRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let poll: number | undefined;

    // The Playroom lobby creates or joins a room and lets its host launch the shared match.
    poll = window.setInterval(() => {
      try { setSeatCount(Math.max(1, getPlayroomParticipants().length)); } catch { /* Room not ready yet. */ }
    }, 700);

    void joinPlayroomRoom({ maxPlayersPerRoom: SLOTS })
      .then(async (self) => {
        if (cancelled) { self.leaveRoom(); return; }
        roomRef.current = self;
        setRoomPlayer(self);
        const account = player
          ? { id: player.id, name: playerName || player.name, avatar_index: player.avatar_index ?? 0, avatar_url: player.avatar_url ?? null }
          : { id: self.id, name: playerName || "القبطان", avatar_index: 0, avatar_url: null };
        self.setState("broadside-captain", account, true);
        const members = getPlayroomParticipants();
        setSeatCount(Math.max(1, members.length));
        setPhase("loading");
        setMessage("تم إطلاق الغرفة؛ نجهّز المعركة المشتركة…");
        const html = await prepareGame();
        if (cancelled) { self.leaveRoom(); return; }
        const seats = roomSeats(members.length ? members : [self], self, player, playerName);
        const url = makeGameUrl(html, seats, self.id);
        blobRef.current = url;
        setGameUrl(url);
        setPhase("game");
        playSfx("click", 0.8);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setPhase("error");
        setMessage("تعذّر فتح غرفة Playroom. أعد المحاولة بعد التحقق من اتصال الشبكة.");
      });

    return () => {
      cancelled = true;
      if (poll !== undefined) window.clearInterval(poll);
      try { roomRef.current?.leaveRoom(); } catch { /* The room may already be closed. */ }
      roomRef.current = null;
      if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    };
  }, [player?.id, playerName]);

  useEffect(() => {
    if (phase !== "game" || !roomPlayer || !gameUrl) return;
    const seenHits = new Set<string>();
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow) return;
      const data = event.data as { type?: string; state?: SeaState; hit?: SeaHit };
      if (data.type === "kos-state" && data.state) {
        roomPlayer.setState("kos-state", data.state, false);
      } else if (data.type === "kos-hit" && data.hit) {
        const queue = roomPlayer.getState("kos-hits");
        const previous = Array.isArray(queue) ? queue as SeaHit[] : [];
        roomPlayer.setState("kos-hits", [...previous, data.hit].slice(-40), true);
      }
    };
    window.addEventListener("message", onMessage);

    const sync = window.setInterval(() => {
      const target = frame.current?.contentWindow;
      if (!target) return;
      for (const participant of getPlayroomParticipants()) {
        if (participant.id === roomPlayer.id) continue;
        const state = participant.getState("kos-state") as SeaState | undefined;
        if (state?.pos) {
          const profile = profileFor(participant);
          target.postMessage({ type: "kos-remote", id: participant.id, name: profile.name, state }, "*");
        }
        const hits = participant.getState("kos-hits");
        if (!Array.isArray(hits)) continue;
        for (const hit of hits as SeaHit[]) {
          if (!hit?.id || seenHits.has(hit.id)) continue;
          seenHits.add(hit.id);
          target.postMessage({ type: "kos-hit", hit }, "*");
        }
      }
    }, 100);
    return () => {
      window.removeEventListener("message", onMessage);
      window.clearInterval(sync);
    };
  }, [phase, roomPlayer, gameUrl]);

  useEffect(() => {
    const onExit = (event: MessageEvent) => {
      if (event.source === frame.current?.contentWindow && (event.data as { type?: string })?.type === "kos-exit") onClose();
    };
    window.addEventListener("message", onExit);
    return () => window.removeEventListener("message", onExit);
  }, [onClose]);

  const exit = () => {
    try { (roomPlayer ?? myPlayer()).leaveRoom(); } catch { /* Ignore already-closed rooms. */ }
    onClose();
  };
  const header = useMemo(() => phase === "game" ? "المعركة الحيّة" : phase === "error" ? "تعذّر تشغيل Playroom" : "ملك البحار — غرفة جماعية", [phase]);

  return (
    <div className="kos-root" role="dialog" aria-label="ملك البحار">
      {phase === "game" && gameUrl ? (
        <>
          <iframe ref={frame} className="kos-frame" src={gameUrl} title="ملك البحار — لعب حظي" allow="autoplay; fullscreen" />
          <button type="button" className="kos-exit" onClick={exit} aria-label="الخروج من المعركة">خروج</button>
        </>
      ) : (
        <div className="kos-lobby">
          <header className="kos-head">
            <h2>{header}</h2>
            <p>{message}</p>
          </header>
          <div className="kos-versus">
            <div className="kos-hero"><b>{playerName || "القبطان"}</b><em>قبطانك</em></div>
            <div className="kos-clock"><span>{phase === "loading" ? "…" : seatCount}</span><small>{phase === "loading" ? "تجهيز البحر" : "قباطنة في الغرفة"}</small></div>
            <div className="kos-hero kos-hero-foe"><div className="kos-count-big">{seatCount}<small>/{SLOTS}</small></div><b>لاعبون في الردهة</b><em>تبدأ المعركة عندما يطلقها المضيف في Playroom</em></div>
          </div>
          <div className="kos-foot">
            <button type="button" className="kos-ghost" onClick={exit}>مغادرة</button>
            {phase === "error" && <button type="button" className="kos-go" onClick={() => window.location.reload()}>إعادة المحاولة</button>}
          </div>
        </div>
      )}
    </div>
  );
}
