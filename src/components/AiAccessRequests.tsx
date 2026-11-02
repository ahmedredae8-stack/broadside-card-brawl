import { useEffect, useState } from "react";
import { Bot, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Req = { id: string; agent_name: string; purpose: string; scope: string; status: string; created_at: string };
// Table is added by a migration; not yet in generated types.
const table = () => (supabase as unknown as { from: (t: string) => any }).from("ai_access_requests");

/** Admin review queue for AI agents asking to access the database. */
export function AiAccessRequests() {
  const [rows, setRows] = useState<Req[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = async () => {
    const { data, error } = await table().select("*").order("created_at", { ascending: false }).limit(50);
    if (error) setErr("سجل الطلبات غير مفعّل بعد في قاعدة البيانات."); else setRows(data as Req[]);
  };
  useEffect(() => { void load(); }, []);
  const decide = async (id: string, status: "approved" | "rejected") => {
    const { data: u } = await supabase.auth.getUser();
    await table().update({ status, reviewed_by: u.user?.id, reviewed_at: new Date().toISOString() }).eq("id", id);
    void load();
  };
  return <section className="dock-content">
    <div className="dock-section-heading"><Bot size={20} /><strong>طلبات إذن الذكاء الاصطناعي</strong></div>
    {err ? <p className="dock-loading">{err}</p> : !rows ? <p className="dock-loading">جارٍ التحميل…</p> : !rows.length ? <p className="dock-loading">لا توجد طلبات.</p> :
      rows.map((r) => <div key={r.id} className="ai-req">
        <strong>{r.agent_name} — {r.scope === "write" ? "قراءة وكتابة" : "قراءة"}</strong>
        <span>{r.purpose}</span>
        <small>{r.status === "pending" ? "بانتظار المراجعة" : r.status === "approved" ? "مقبول" : "مرفوض"}</small>
        {r.status === "pending" && <div className="ai-req-actions">
          <button type="button" className="tos-btn" onClick={() => void decide(r.id, "approved")}><Check className="h-4 w-4" />قبول</button>
          <button type="button" className="tos-btn" onClick={() => void decide(r.id, "rejected")}><X className="h-4 w-4" />رفض</button>
        </div>}
      </div>)}
  </section>;
}
