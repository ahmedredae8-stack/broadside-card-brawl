import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Globe2, Loader2, Lock, Send } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { CaptainAvatar } from "@/components/GameSprite";
import { isOnline, timeLabel, type Message, type Player } from "@/lib/player";
import { playSfx } from "@/lib/sound";

/** Lean messenger: one public harbour channel plus private threads. */
export function ChatPanel({ me, peer }: { me: Player; peer?: Player | null }) {
  const [tab, setTab] = useState<"public" | "private">(peer ? "private" : "public");
  const [thread, setThread] = useState<Player | null>(peer ?? null);
  const [people, setPeople] = useState<Record<string, Player>>({ [me.id]: me });
  const [inbox, setInbox] = useState<{ peer: string; last: Message }[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(async (ids: string[]) => {
    const missing = [...new Set(ids)].filter((id) => !people[id]);
    if (!missing.length) return;
    const { data } = await supabase.from("players").select("*").in("id", missing);
    if (data?.length) setPeople((p) => ({ ...p, ...Object.fromEntries((data as Player[]).map((r) => [r.id, r])) }));
  }, [people]);

  const view: "public" | "inbox" | "thread" = tab === "public" ? "public" : thread ? "thread" : "inbox";

  // Load whatever is on screen.
  useEffect(() => {
    let off = false;
    setLoading(true);
    (async () => {
      if (view === "public") {
        const { data } = await supabase.from("messages").select("*").is("recipient_id", null).order("created_at", { ascending: false }).limit(80);
        if (off) return;
        const rows = ((data ?? []) as Message[]).reverse();
        setMessages(rows); void hydrate(rows.map((r) => r.sender_id));
      } else {
        const { data } = await supabase.from("messages").select("*").not("recipient_id", "is", null).or(`sender_id.eq.${me.id},recipient_id.eq.${me.id}`).order("created_at", { ascending: false }).limit(300);
        if (off) return;
        const rows = (data ?? []) as Message[];
        const map = new Map<string, Message>();
        rows.forEach((m) => { const p = m.sender_id === me.id ? m.recipient_id! : m.sender_id; if (!map.has(p)) map.set(p, m); });
        setInbox([...map.entries()].map(([p, last]) => ({ peer: p, last })));
        void hydrate([...map.keys()]);
        if (thread) setMessages(rows.filter((m) => m.sender_id === thread.id || m.recipient_id === thread.id).reverse());
      }
      setLoading(false);
    })();
    return () => { off = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, thread?.id, me.id]);

  // Live updates.
  useEffect(() => {
    const ch = supabase.channel(`chat-${me.id}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
      const m = payload.new as Message;
      const fits = view === "public" ? m.recipient_id === null
        : view === "thread" && thread ? (m.sender_id === thread.id && m.recipient_id === me.id) || (m.sender_id === me.id && m.recipient_id === thread.id)
        : false;
      if (fits) { setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m])); void hydrate([m.sender_id]); }
    }).subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [view, thread, me.id, hydrate]);

  return (
    <div className="cp" dir="rtl">
      <nav className="cp-tabs" aria-label="قنوات الرسائل">
        <button type="button" className={tab === "public" ? "on" : ""} onClick={() => setTab("public")}><Globe2 className="h-4 w-4" />الميناء العام</button>
        <button type="button" className={tab === "private" ? "on" : ""} onClick={() => { setTab("private"); setThread(null); }}><Lock className="h-4 w-4" />الرسائل الخاصة</button>
      </nav>

      {view === "thread" && thread && (
        <header className="cp-thread-head">
          <button type="button" className="cp-back" aria-label="رجوع" onClick={() => setThread(null)}><ArrowRight className="h-4 w-4" /></button>
          <CaptainAvatar seed={thread.avatar_index ?? 0} url={thread.avatar_url} className="cp-ava" />
          <div><strong>{thread.name}</strong><small>{isOnline(thread.last_seen) ? "متصل الآن" : "غير متصل"}</small></div>
        </header>
      )}

      {loading ? <div className="cp-empty"><Loader2 className="h-6 w-6 animate-spin" /></div>
        : view === "inbox" ? (
          inbox.length ? (
            <ul className="cp-inbox">
              {inbox.map(({ peer: id, last }) => {
                const p = people[id];
                return (
                  <li key={id}>
                    <button type="button" onClick={() => p && setThread(p)}>
                      <CaptainAvatar seed={p?.avatar_index ?? 0} url={p?.avatar_url} className="cp-ava" />
                      <div><strong>{p?.name ?? "قبطان"}</strong><small>{last.sender_id === me.id ? "أنت: " : ""}{last.body}</small></div>
                      <time>{timeLabel(last.created_at)}</time>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : <div className="cp-empty"><Lock className="h-8 w-8" /><strong>لا توجد رسائل خاصة بعد</strong><span>افتح ملف أي قرصان من سجل القراصنة واضغط «مراسلة».</span></div>
        ) : <Messages me={me} rows={messages} people={people} />}

      {view !== "inbox" && <Composer me={me} to={view === "thread" ? thread : null} />}
    </div>
  );
}

function Messages({ me, rows, people }: { me: Player; rows: Message[]; people: Record<string, Player> }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [rows.length]);
  if (!rows.length) return <div className="cp-empty"><strong>ابدأ المحادثة</strong><span>اكتب أول رسالة بالأسفل.</span></div>;
  return (
    <ol className="cp-list">
      {rows.map((m) => {
        const mine = m.sender_id === me.id, p = people[m.sender_id];
        return (
          <li key={m.id} className={mine ? "cp-msg me" : "cp-msg"}>
            {!mine && <CaptainAvatar seed={p?.avatar_index ?? 0} url={p?.avatar_url} className="cp-ava sm" />}
            <div className="cp-bubble">
              {!mine && <b>{p?.name ?? "قبطان"}</b>}
              <p>{m.body}</p>
              <time>{timeLabel(m.created_at)}</time>
            </div>
          </li>
        );
      })}
      <div ref={end} />
    </ol>
  );
}

function Composer({ me, to }: { me: Player; to: Player | null }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true); setErr(""); setText("");
    playSfx("click", 0.4);
    const { error } = await supabase.from("messages").insert({ sender_id: me.id, recipient_id: to?.id ?? null, body: body.slice(0, 500) });
    if (error) { setText(body); setErr("تعذّر الإرسال، حاول مرة أخرى."); }
    setBusy(false);
  };
  return (
    <form className="cp-compose" onSubmit={send}>
      <input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder={to ? `رسالة إلى ${to.name}` : "اكتب للميناء كله…"} aria-label="نص الرسالة" />
      <button type="submit" className="tos-btn" disabled={busy || !text.trim()} aria-label="إرسال"><Send className="h-4 w-4" /></button>
      {err && <p className="cp-err" role="alert">{err}</p>}
    </form>
  );
}
