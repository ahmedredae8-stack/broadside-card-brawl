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
import { supabase } from "@/integrations/supabase/client";
import type { Player } from "@/lib/player";
import type { DuelFireEvent } from "@/fx/weapons/playFireEvent";
import type { Side } from "@/game/duel";

export type LobbyMeta = {
  id: string;
  name: string;
  avatar_index?: number;
  avatar_url?: string | null;
  score?: number;
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
  avatar_index: m.avatar_index,
  avatar_url: m.avatar_url,
  score: m.score,
});

const LOBBY = "duel-lobby";
const FRESH_MS = 70_000;
const CHALLENGE_TTL = 15_000;

/**
 * Lobby presence + handshake. Active while the live-duels window is open.
 * `queueing` marks me as openly looking for a duel.
 */
export function useDuelLobby(me: Player | null, queueing: boolean) {
  const [others, setOthers] = useState<LobbyMeta[]>([]);
  const [incoming, setIncoming] = useState<Challenge | null>(null);
  const [outgoing, setOutgoing] = useState<{ matchId: string; to: LobbyMeta } | null>(null);
  const chanRef = useRef<RealtimeChannel | null>(null);
  const meRef = useRef(me);
  meRef.current = me;
  const pending = useRef<{ matchId: string; resolve: (v: "accepted" | "declined" | "timeout") => void; timer: number } | null>(null);

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
        pend.resolve("accepted");
      }
    });

    chan.on("broadcast", { event: "decline" }, ({ payload }) => {
      const p = payload as { to: string; matchId: string };
      if (p.to !== me.id) return;
      const pend = pending.current;
      if (pend && pend.matchId === p.matchId) {
        window.clearTimeout(pend.timer);
        pending.current = null;
        setOutgoing(null);
        pend.resolve("declined");
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

  /** Challenge a captain; resolves when they accept, decline or time out. */
  const challenge = (peer: LobbyMeta) =>
    new Promise<"accepted" | "declined" | "timeout">((resolve) => {
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
  const respond = (c: Challenge, accept: boolean): { matchId: string; role: "host" | "guest"; foe: Player } | null => {
    const chan = chanRef.current;
    setIncoming(null);
    if (!chan) return null;
    void chan.send({ type: "broadcast", event: accept ? "accept" : "decline", payload: { to: c.from.id, matchId: c.matchId } });
    return accept ? { matchId: c.matchId, role: "guest", foe: playerFromMeta(c.from) } : null;
  };

  const cancelOutgoing = () => {
    const pend = pending.current;
    if (pend) { window.clearTimeout(pend.timer); pend.resolve("timeout"); pending.current = null; }
    setOutgoing(null);
  };

  return { others, incoming, outgoing, challenge, respond, cancelOutgoing };
}

/** Live battle channel: replays every play on both clients. */
export class DuelSession {
  private chan: RealtimeChannel;
  private onEvent: (ev: DuelWire) => void;
  private onFoeGone: () => void;
  private foeSeen = false;
  private lastSeen = 0;
  private timer: number;
  private closed = false;

  private constructor(matchId: string, role: "host" | "guest", handlers: { onEvent: (ev: DuelWire) => void; onFoeGone: () => void }) {
    this.onEvent = handlers.onEvent;
    this.onFoeGone = handlers.onFoeGone;
    this.chan = supabase.channel(`duel-${matchId}`, { config: { presence: { key: `p-${role}` } } });

    this.chan.on("broadcast", { event: "duel" }, ({ payload }) => this.onEvent(payload as DuelWire));

    const watch = () => {
      const state = this.chan.presenceState() as Record<string, { role: string }[]>;
      const foeHere = Object.values(state).flat().some((m) => m.role && m.role !== role);
      if (foeHere) { this.foeSeen = true; this.lastSeen = Date.now(); }
    };
    this.chan.on("presence", { event: "sync" }, watch);
    this.chan.on("presence", { event: "join" }, watch);

    this.timer = window.setInterval(() => {
      watch();
      if (this.foeSeen && Date.now() - this.lastSeen > 9_000) { this.foeSeen = false; if (!this.closed) this.onFoeGone(); }
    }, 2_000);

    void this.chan.subscribe((status) => {
      if (status === "SUBSCRIBED") void this.chan.track({ role });
    });
  }

  static open(matchId: string, role: "host" | "guest", handlers: { onEvent: (ev: DuelWire) => void; onFoeGone: () => void }): DuelSession {
    return new DuelSession(matchId, role, handlers);
  }

  send(ev: DuelWire): void {
    if (this.closed) return;
    void this.chan.send({ type: "broadcast", event: "duel", payload: ev });
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    window.clearInterval(this.timer);
    void supabase.removeChannel(this.chan);
  }
}
