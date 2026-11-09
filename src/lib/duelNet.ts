/**
 * Live 1v1 duels over Supabase Realtime (public channels, publishable key only — no DB writes).
 *
 * Layers:
 *  1. Lobby channel `duel-lobby`: presence shows which captains are online; broadcast carries
 *     challenge / accept / decline handshakes.
 *  2. Pair handshake: the challenger generates the matchId and both sides join `duel-<matchId>`.
 *  3. Battle channel: every state-changing play (fire / shield / burn / move / leave) is broadcast;
 *     the acting client is authoritative and both clients replay the same event on the same
 *     deterministic initial state, so views stay in lockstep.
 */
import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { PlayerState } from "playroomkit";
import { supabase } from "@/integrations/supabase/client";
import { getPlayroomParticipants, joinPlayroomRoom } from "@/lib/playroom";
import type { Player } from "@/lib/player";
import type { DuelFireEvent } from "@/fx/weapons/playFireEvent";
import type { Side } from "@/game/duel";

export type LobbyMeta = {
  id: string;
  name: string;
  avatar_index?: number | undefined;
  avatar_url?: string | null | undefined;
  score?: number | undefined;
  waiting: boolean;
  ts: number;
};

export type Challenge = { matchId: string; from: LobbyMeta; until: number };

/** A state-changing play broadcast between the two battle clients. */
export type DuelWire =
  | { t: "fire"; ev: DuelFireEvent; cost: number }
  | { t: "shield"; side: Side; ship: number; tier: number; cost: number }
  | { t: "burn"; side: Side; ship: number; dmg: number; burnLeft: number }
  | { t: "move"; side: Side; ship: number; spot: number }
  | { t: "leave" };

export const metaOf = (p: Player, waiting: boolean): LobbyMeta => ({
  id: p.id,
  name: p.name,
  avatar_index: p.avatar_index,
  avatar_url: p.avatar_url,
  score: p.score,
  waiting,
  ts: Date.now(),
});

/** Build a display Player from lobby presence metadata (fields the arena needs). */
export const playerFromMeta = (m: LobbyMeta): Player => ({
  id: m.id,
  name: m.name,
  theme_id: "",
  last_seen: new Date().toISOString(),
  created_at: "",
  ...(m.avatar_index !== undefined ? { avatar_index: m.avatar_index } : {}),
  ...(m.avatar_url !== undefined ? { avatar_url: m.avatar_url } : {}),
  ...(m.score !== undefined ? { score: m.score } : {}),
});

const LOBBY = "duel-lobby";
const FRESH_MS = 70_000;
const CHALLENGE_TTL = 15_000;

/**
 * Lobby presence + handshake. Active while the live-duels window is open.
 * `queueing` marks me as openly looking for a duel.
 */
const BLOCK_KEY = "duel-blocked-captains";
export const blockedIds = (): string[] => {
  try { return JSON.parse(localStorage.getItem(BLOCK_KEY) ?? "[]") as string[]; } catch { return []; }
};
export const blockCaptain = (id: string) => {
  const s = new Set(blockedIds()); s.add(id);
  localStorage.setItem(BLOCK_KEY, JSON.stringify([...s]));
};

export type ChallengeResult = { matchId: string } | "declined" | "timeout" | "ai" | "blocked";
export type Reply = "accept" | "decline" | "block" | "ai";

export function useDuelLobby(me: Player | null, queueing: boolean) {
  const [others, setOthers] = useState<LobbyMeta[]>([]);
  const [incoming, setIncoming] = useState<Challenge | null>(null);
  const [outgoing, setOutgoing] = useState<{ matchId: string; to: LobbyMeta } | null>(null);
  const chanRef = useRef<RealtimeChannel | null>(null);
  const meRef = useRef(me);
  meRef.current = me;
  const pending = useRef<{ matchId: string; resolve: (v: ChallengeResult) => void; timer: number } | null>(null);

  useEffect(() => {
    if (!me) return;
    const chan = supabase.channel(LOBBY, { config: { presence: { key: me.id } } });
    chanRef.current = chan;

    chan.on("presence", { event: "sync" }, () => {
      const state = chan.presenceState() as Record<string, LobbyMeta[]>;
      const list: LobbyMeta[] = [];
      for (const [key, arr] of Object.entries(state)) {
        if (key === me.id) continue;
        const m = arr[arr.length - 1];
        if (m && Date.now() - m.ts < FRESH_MS) list.push(m);
      }
      setOthers(list);
    });

    chan.on("broadcast", { event: "challenge" }, ({ payload }) => {
      const p = payload as { to: string; from: LobbyMeta; matchId: string };
      if (p.to !== me.id || p.from?.id === me.id) return;
      if (blockedIds().includes(p.from.id)) {
        void chan.send({ type: "broadcast", event: "decline", payload: { to: p.from.id, matchId: p.matchId, blocked: true } });
        return;
      }
      // Away (tab hidden) and the captain allowed it in settings: their AI captain takes the fight.
      if (typeof document !== "undefined" && document.hidden && localStorage.getItem("ib.autoAI") !== "off") {
        void chan.send({ type: "broadcast", event: "decline", payload: { to: p.from.id, matchId: p.matchId, ai: true } });
        return;
      }
      setIncoming((prev) => (prev && prev.until > Date.now() && prev.from.id === p.from.id ? prev : { matchId: p.matchId, from: p.from, until: Date.now() + CHALLENGE_TTL }));
    });

    chan.on("broadcast", { event: "accept" }, ({ payload }) => {
      const p = payload as { to: string; matchId: string };
      if (p.to !== me.id) return;
      const pend = pending.current;
      if (pend && pend.matchId === p.matchId) {
        window.clearTimeout(pend.timer);
        pending.current = null;
        setOutgoing(null);
        pend.resolve({ matchId: p.matchId });
      }
    });

    chan.on("broadcast", { event: "decline" }, ({ payload }) => {
      const p = payload as { to: string; matchId: string; ai?: boolean; blocked?: boolean };
      if (p.to !== me.id) return;
      const pend = pending.current;
      if (pend && pend.matchId === p.matchId) {
        window.clearTimeout(pend.timer);
        pending.current = null;
        setOutgoing(null);
        pend.resolve(p.ai ? "ai" : p.blocked ? "blocked" : "declined");
      }
    });

    void chan.subscribe((status) => {
      if (status === "SUBSCRIBED" && meRef.current) {
        void chan.track(metaOf(meRef.current, queueing));
      }
    });

    const tick = window.setInterval(() => {
      setIncoming((c) => (c && c.until < Date.now() ? null : c));
      void chan.track(metaOf(meRef.current ?? me, queueing));
    }, 5_000);

    return () => {
      window.clearInterval(tick);
      window.clearTimeout(pending.current?.timer);
      if (pending.current) { pending.current.resolve("timeout"); pending.current = null; }
      chanRef.current = null;
      void supabase.removeChannel(chan);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id]);

  /** Announce (or withdraw) my "looking for a duel" state. */
  useEffect(() => {
    const chan = chanRef.current;
    if (chan && me && chan.presenceState()) void chan.track(metaOf(me, queueing));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueing]);

  /** Challenge a captain; resolves with the matchId when they accept, else declined/timeout. */
  const challenge = (peer: LobbyMeta) =>
    new Promise<ChallengeResult>((resolve) => {
      const chan = chanRef.current, m = meRef.current;
      if (!chan || !m) { resolve("timeout"); return; }
      const matchId = crypto.randomUUID();
      const timer = window.setTimeout(() => {
        const pend = pending.current;
        if (pend && pend.matchId === matchId) { pending.current = null; setOutgoing(null); pend.resolve("timeout"); }
      }, CHALLENGE_TTL);
      pending.current = { matchId, resolve, timer };
      setOutgoing({ matchId, to: peer });
      void chan.send({ type: "broadcast", event: "challenge", payload: { to: peer.id, from: metaOf(m, queueing), matchId, ts: Date.now() } });
    });

  /** Answer an incoming challenge. Returns match info when accepted. */
  const respond = (c: Challenge, reply: Reply | boolean): { matchId: string; role: "host" | "guest"; foe: Player } | null => {
    const r: Reply = reply === true ? "accept" : reply === false ? "decline" : reply;
    const chan = chanRef.current;
    setIncoming(null);
    if (r === "block") blockCaptain(c.from.id);
    if (!chan) return null;
    const accept = r === "accept";
    void chan.send({ type: "broadcast", event: accept ? "accept" : "decline", payload: { to: c.from.id, matchId: c.matchId, ai: r === "ai", blocked: r === "block" } });
    return accept ? { matchId: c.matchId, role: "guest", foe: playerFromMeta(c.from) } : null;
  };

  const cancelOutgoing = () => {
    const pend = pending.current;
    if (pend) { window.clearTimeout(pend.timer); pend.resolve("timeout"); pending.current = null; }
    setOutgoing(null);
  };

  return { others, incoming, outgoing, challenge, respond, cancelOutgoing };
}

/** Live battle state is carried by Playroom; Supabase remains the account and request lobby. */
type DuelEnvelope = { id: string; event: DuelWire };

function playroomRoomCode(matchId: string) {
  return matchId.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

export class DuelSession {
  private onEvent: (ev: DuelWire) => void;
  private onFoeGone: () => void;
  private onError: (() => void) | undefined;
  private player: PlayerState | null = null;
  private eventKey: string;
  private seen = new Set<string>();
  private pending: DuelEnvelope[] = [];
  private foeSeen = false;
  private lastSeen = 0;
  private timer: number;
  private closed = false;
  private notified = false;

  private constructor(matchId: string, _role: "host" | "guest", handlers: { onEvent: (ev: DuelWire) => void; onFoeGone: () => void; onError?: () => void }) {
    this.onEvent = handlers.onEvent;
    this.onFoeGone = handlers.onFoeGone;
    this.onError = handlers.onError;
    this.eventKey = `duel-${playroomRoomCode(matchId)}-events`;
    this.timer = window.setInterval(() => this.poll(), 250);
    void joinPlayroomRoom({ roomCode: playroomRoomCode(matchId), maxPlayersPerRoom: 2, skipLobby: true })
      .then((player) => {
        if (this.closed) { player.leaveRoom(); return; }
        this.player = player;
        for (const event of this.pending.splice(0)) this.publish(event);
      })
      .catch(() => { if (!this.closed) this.onError?.(); });
  }

  static open(matchId: string, role: "host" | "guest", handlers: { onEvent: (ev: DuelWire) => void; onFoeGone: () => void; onError?: () => void }): DuelSession {
    return new DuelSession(matchId, role, handlers);
  }

  send(ev: DuelWire): void {
    if (this.closed) return;
    const envelope = { id: crypto.randomUUID(), event: ev };
    if (!this.player) this.pending.push(envelope);
    else this.publish(envelope);
  }

  private publish(event: DuelEnvelope) {
    if (!this.player) return;
    const current = this.player.getState(this.eventKey);
    const queue = Array.isArray(current) ? current as DuelEnvelope[] : [];
    this.player.setState(this.eventKey, [...queue, event].slice(-32), true);
  }

  private poll() {
    if (this.closed || !this.player) return;
    const foes = getPlayroomParticipants().filter((p) => p.id !== this.player?.id);
    if (foes.length) { this.foeSeen = true; this.lastSeen = Date.now(); this.notified = false; }
    for (const foe of foes) {
      const current = foe.getState(this.eventKey);
      if (!Array.isArray(current)) continue;
      for (const envelope of current as DuelEnvelope[]) {
        if (!envelope?.id || this.seen.has(envelope.id)) continue;
        this.seen.add(envelope.id);
        this.onEvent(envelope.event);
      }
    }
    if (this.foeSeen && !foes.length && Date.now() - this.lastSeen > 9_000 && !this.notified) {
      this.notified = true;
      this.onFoeGone();
    }
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    window.clearInterval(this.timer);
    try { this.player?.leaveRoom(); } catch { /* The room may already be closed. */ }
  }
}
