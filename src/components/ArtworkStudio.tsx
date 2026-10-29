import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff, ImagePlus, Rocket, Search, Ship, Trash2, UploadCloud } from "lucide-react";
import { saveOverride, useLiveShips } from "@/lib/shipOverrides";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { announceArtworkUpdate, artworkUrl, isVideoPath, listArtwork, type ArtworkPose } from "@/lib/artwork";
import { fleetCatalog } from "@/lib/fleetCatalog";
import { WEAPONS } from "@/lib/items";
import { themes } from "@/lib/themes";

const poses = {
  ship: [["idle", "عادية"], ["cast", "رمي الشباك"], ["submerged", "تحت الماء"], ["haul", "لم الشباك"]],
  rocket: [["idle", "استعداد"], ["flight", "تحليق"], ["explosion", "انفجار"], ["fire", "نيران"], ["smoke", "دخان"], ["fade", "تلاشي"]],
  store: [["idle", "صورة المنتج"]],
} as const;
type Cat = keyof typeof poses;

type Item = { key: string; name: string; info: string; fallback?: string };

const shipItems: Item[] = fleetCatalog.map(s => ({ key: `ship-${s.id}`, name: s.name, info: `${s.price.toLocaleString("ar-EG")} ${s.currency === "coin" ? "عملة" : "جوهرة"}${s.source === "tribe" ? " · قبيلة" : ""}`, fallback: s.hull }));
import { saveStarterShips, useStarterShips } from "@/lib/starterShips";
import { CREWS } from "@/lib/items";
import { CREW_ART, CREW_ART_MAP } from "@/lib/art";
import shieldData from "@/shields/shields.json";
const storeItems: Item[] = [
  ...CREWS.map((c) => ({ key: `store:crew-${c.id}`, name: `طاقم: ${c.name}`, info: "صورة في المتجر وغرفة الطاقم", fallback: CREW_ART_MAP[c.id] ?? CREW_ART[0] })),
  ...shieldData.shields.map(s => ({ key: `store:shield-${s.id}`, name: s.name_ar, info: "صورة الدرع في المتجر" })),
];
const itemsFor = (c: Cat) => c === "ship" ? shipItems : c === "rocket" ? rocketItems : storeItems;
const rocketItems: Item[] = WEAPONS.map(w => ({ key: w.id, name: w.name, info: `${w.price.toLocaleString("ar-EG")} ${w.currency === "coin" ? "عملة" : "جوهرة"}`, fallback: w.icon }));

export function ArtworkStudio() {
  const [category, setCategory] = useState<Cat>("ship");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string>(shipItems[0]?.key ?? "ship-1");
  const [records, setRecords] = useState<ArtworkPose[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingPose = useRef<ArtworkPose["pose"]>("idle");
  const [bgId, setBgId] = useState(themes[0]?.id ?? "");
  const [phase, setPhase] = useState<"day" | "night">("day");
  const [previewPose, setPreviewPose] = useState<string>("idle");

  const items = itemsFor(category);
  const filtered = useMemo(() => items.filter(i => i.name.includes(query.trim())), [items, query]);
  const item = items.find(i => i.key === selected) ?? items[0];

  const refresh = async () => {
    try {
      const rows = await listArtwork();
      setRecords(rows);
      const signed = await Promise.all(rows.map(async row => [row.id, await artworkUrl(row.image_path).catch(() => "")] as const));
      setUrls(Object.fromEntries(signed));
    } catch { setStatus("تعذّر تحميل مكتبة الصور"); }
  };
  useEffect(() => { void refresh(); }, []);

  const poseRecord = (pose: string) => records.find(r => r.subject === item?.key && r.pose === pose);

  const pick = (pose: ArtworkPose["pose"]) => { pendingPose.current = pose; fileRef.current?.click(); };

  const upload = async (file: File) => {
    if (!item) return;
    const pose = pendingPose.current;
    const ext = ({ "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" } as Record<string, string>)[file.type];
    if (!ext || file.size > 5 * 1024 * 1024) { setStatus("اختر صورة PNG أو JPG أو WebP لا تتجاوز 5 ميجابايت"); return; }
    setBusy(pose); setStatus("");
    try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setStatus("سجل دخولك أولاً"); setBusy(null); return; }
    const path = `${auth.user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("game-artwork").upload(path, file, { contentType: file.type });
    if (upErr) { setStatus("تعذّر رفع الصورة — تأكد من صلاحية المشرف."); setBusy(null); return; }
    const { error } = await supabase.from("artwork_poses").insert({ category, subject: item.key, pose, image_path: path, created_by: auth.user.id });
    if (error) { await supabase.storage.from("game-artwork").remove([path]); setStatus(`تعذّر حفظ الوضعية: ${error.message}`); setBusy(null); return; }
    const old = poseRecord(pose);
    if (old) { await supabase.from("artwork_poses").delete().eq("id", old.id); await supabase.storage.from("game-artwork").remove([old.image_path]); }
    setStatus(`تم نشر وضعية «${poses[category].find(([p]) => p === pose)?.[1]}» لـ ${item.name}`);
    await refresh(); announceArtworkUpdate(); setBusy(null);
    } catch { setStatus("تعذّر نشر الصورة. تحقق من الاتصال وحاول مرة أخرى."); }
    finally { setBusy(null); }
  };

  const remove = async (row: ArtworkPose) => {
    if (!window.confirm("حذف هذه الوضعية والعودة للصورة الأصلية؟")) return;
    const { error } = await supabase.from("artwork_poses").delete().eq("id", row.id);
    if (error) { setStatus("تعذّر حذف الوضعية"); return; }
    await supabase.storage.from("game-artwork").remove([row.image_path]);
    await refresh();
    announceArtworkUpdate();
  };

  const switchCat = (c: Cat) => { setCategory(c); setPreviewPose("idle"); setSelected(itemsFor(c)[0]?.key ?? ""); setQuery(""); };

  if (!item) return <p role="status">لا توجد عناصر متاحة.</p>;

  return <section className="art-studio" aria-label="استوديو الإدارة">
    <div className="art-studio-head"><ImagePlus /><div><small>غرفة المشرف</small><h2>استوديو السفن والصواريخ</h2></div></div>
    <div className="art-mode" role="group" aria-label="النوع">
      <Button variant="ghost" className={category === "ship" ? "active" : ""} onClick={() => switchCat("ship")}><Ship /> سفن ({shipItems.length})</Button>
      <Button variant="ghost" className={category === "rocket" ? "active" : ""} onClick={() => switchCat("rocket")}><Rocket /> صواريخ ({rocketItems.length})</Button>
      <Button variant="ghost" className={category === "store" ? "active" : ""} onClick={() => switchCat("store")}><ImagePlus /> منتجات المتجر ({storeItems.length})</Button>
    </div>
    <label className="art-label"><span style={{ display: "flex", gap: 6, alignItems: "center" }}><Search size={16} /> بحث</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث بالاسم" /></label>
    <div className="art-library" style={{ maxHeight: 260, overflowY: "auto" }}>
      {filtered.map(i => {
        const thumb = records.find(r => r.subject === i.key && r.pose === "idle");
        const count = records.filter(r => r.subject === i.key).length;
        return <Button variant="ghost" type="button" key={i.key} className={`art-record ${i.key === item.key ? "active" : ""}`} onClick={() => setSelected(i.key)} aria-pressed={i.key === item.key}>
          <div className="art-record-image"><img src={(thumb && urls[thumb.id]) || i.fallback} alt="" /></div>
          <div><strong>{i.name}</strong><small>{i.info} · {count}/{poses[category].length} وضعيات</small></div>
        </Button>;
      })}
    </div>
    <h3>معاينة على البحر: {item.name}</h3>
    {(() => {
      const theme = themes.find(t => t.id === bgId) ?? themes[0]!;
      const rec = poseRecord(previewPose) ?? poseRecord("idle");
      const actor = (rec && urls[rec.id]) || item.fallback;
      return <>
        <div className="studio-stage">
          <img className="studio-bg" src={theme[phase].poster} alt={theme.name} />
          {actor && <img className="studio-actor" src={actor} alt={item.name} />}
          <span className="studio-pose">{poses[category].find(([p]) => p === previewPose)?.[1] ?? "عادية"} · {theme.name}</span>
        </div>
        <div className="studio-poses" role="group" aria-label="وضعية المعاينة">
          {poses[category].map(([p, l]) => <button type="button" key={p} className={previewPose === p ? "active" : ""} onClick={() => setPreviewPose(p)}>{l}</button>)}
          <button type="button" className={phase === "night" ? "active" : ""} onClick={() => setPhase(phase === "day" ? "night" : "day")}>{phase === "day" ? "☀ شمس" : "☾ قمر"}</button>
        </div>
        <div className="studio-bgs" role="group" aria-label="تغيير الخلفية">
          {themes.map(t => <button type="button" key={t.id} title={t.name} aria-label={t.name} className={t.id === bgId ? "active" : ""} onClick={() => setBgId(t.id)}><img src={t[phase].poster} alt="" /></button>)}
        </div>
      </>;
    })()}
    <h3>وضعيات: {item.name}</h3>
    <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void upload(f); }} />
    <div className="art-library" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 10 }}>
      {poses[category].map(([pose, label]) => {
        const rec = poseRecord(pose);
        return <div key={pose} className="art-record" style={{ flexDirection: "column", alignItems: "stretch" }}>
          <div className="art-record-image" style={{ width: "100%", height: 100 }}>{rec && urls[rec.id] ? <img src={urls[rec.id]} alt={label} /> : pose === "idle" && item.fallback ? <img src={item.fallback} alt="" style={{ opacity: 0.5 }} /> : <UploadCloud />}</div>
          <strong>{label}</strong><small>{rec ? "منشورة" : "الافتراضية"}</small>
          <div style={{ display: "flex", gap: 6 }}>
            <Button size="sm" disabled={!!busy} onClick={() => pick(pose)}>{busy === pose ? "جارٍ…" : rec ? "استبدال" : "رفع"}</Button>
            {rec && <Button size="icon" variant="ghost" aria-label={`حذف ${label}`} onClick={() => void remove(rec)}><Trash2 /></Button>}
          </div>
        </div>;
      })}
    </div>
    {category === "ship" && <ShipTextEditor key={item.key} productId={item.key} />}
    <StarterShips />
    <BackgroundUploads />
    {status && <p className="art-status" role="status">{status}</p>}
  </section>;
}

function ShipTextEditor({ productId }: { productId: string }) {
  const ship = useLiveShips(true).find(s => s.key === productId);
  const [form, setForm] = useState<{ name: string; description: string; price: string; hidden: boolean } | null>(null);
  const [msg, setMsg] = useState("");
  useEffect(() => { if (ship && !form) setForm({ name: ship.name, description: ship.description, price: String(ship.price), hidden: ship.hidden }); }, [ship, form]);
  if (!ship || !form) return null;
  const save = async () => {
    const price = Math.max(0, Math.floor(Number(form.price) || 0));
    const err = await saveOverride({ product_id: productId, name: form.name.trim().slice(0, 40) || null, description: form.description.trim().slice(0, 200) || null, price, hidden: form.hidden });
    setMsg(err ? "تعذّر الحفظ — تأكد من صلاحية المشرف" : "تم الحفظ وظهر في المتجر");
  };
  return <div className="tos-editor">
    <h3>نصوص وسعر: {ship.name}</h3>
    <label>الاسم<input value={form.name} maxLength={40} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
    <label>الوصف<textarea value={form.description} maxLength={200} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
    <label>السعر<input inputMode="numeric" value={form.price} onChange={e => setForm({ ...form, price: e.target.value.replace(/\D/g, "") })} /></label>
    <label className="tos-check"><input type="checkbox" checked={form.hidden} onChange={e => setForm({ ...form, hidden: e.target.checked })} />{form.hidden ? <><EyeOff size={16} /> مخفية عن اللاعبين</> : <><Eye size={16} /> ظاهرة في المتجر</>}</label>
    <Button onClick={() => void save()}>حفظ</Button>
    {msg && <small role="status">{msg}</small>}
  </div>;
}

function BackgroundUploads() {
  const [rows, setRows] = useState<{ id: string; url: string; video: boolean }[]>([]);
  const [msg, setMsg] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  const load = async () => {
    const all = (await listArtwork().catch(() => [])).filter(r => r.category === "background");
    setRows(await Promise.all(all.map(async r => ({ id: r.id, video: isVideoPath(r.image_path), url: await artworkUrl(r.image_path).catch(() => "") }))));
  };
  useEffect(() => { void load(); }, []);
  const upload = async (file: File) => {
    const isVideo = /^video\/(mp4|webm)$/.test(file.type);
    if (!(isVideo || /^image\/(png|jpeg|webp)$/.test(file.type)) || file.size > (isVideo ? 45 : 8) * 1024 * 1024) { setMsg("اختر صورة PNG/JPG حتى 8 ميجابايت أو فيديو MP4/WebM حتى 45 ميجابايت"); return; }
    setMsg(isVideo ? "جاري رفع الفيديو…" : "جاري رفع الخلفية…");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setMsg("سجل دخولك أولاً"); return; }
    const path = `${auth.user.id}/bg-${crypto.randomUUID()}.${(file.type.split("/")[1] ?? "png").replace("jpeg", "jpg")}`;
    const { error } = await supabase.storage.from("game-artwork").upload(path, file, { contentType: file.type });
    if (error) { setMsg("تعذّر الرفع — صلاحية المشرف مطلوبة"); return; }
    const { error: rowErr } = await supabase.from("artwork_poses").insert({ category: "background", subject: file.name.slice(0, 60), pose: "day", image_path: path, created_by: auth.user.id });
    if (rowErr) { setMsg("تم رفع الملف لكن تعذّر تسجيله"); return; }
    setMsg("تم! أصبحت الخلفية الجديدة هي خلفية البحر لكل اللاعبين."); announceArtworkUpdate(); void load();
  };
  return <div className="tos-editor">
    <h3>رفع خلفيات جديدة</h3>
    <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp,video/mp4,video/webm" hidden onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void upload(f); }} />
    <Button onClick={() => ref.current?.click()}><UploadCloud /> رفع خلفية (صورة أو فيديو)</Button>
    <div className="studio-bgs">{rows.map(r => r.video ? <video key={r.id} src={r.url} muted loop autoPlay playsInline /> : <img key={r.id} src={r.url} alt="خلفية مرفوعة" />)}</div>
    {msg && <small role="status">{msg}</small>}
  </div>;
}

function StarterShips() {
  const saved = useStarterShips();
  const [sel, setSel] = useState<string[] | null>(null);
  const [msg, setMsg] = useState("");
  const list = sel ?? saved;
  const toggle = (c: string) => setSel(list.includes(c) ? list.filter(x => x !== c) : [...list, c]);
  const save = async () => {
    if (!list.length) { setMsg("اختر سفينة واحدة على الأقل"); return; }
    const err = await saveStarterShips(list);
    setMsg(err ? "تعذّر الحفظ — تأكد من صلاحية المشرف" : "تم: هذه سفن البداية لكل لاعب جديد");
  };
  return <div className="tos-editor">
    <h3>سفن البداية للاعبين الجدد</h3>
    <div className="starter-grid">{fleetCatalog.map(s => <label key={s.code} className={list.includes(s.code) ? "starter-pick on" : "starter-pick"}><input type="checkbox" checked={list.includes(s.code)} onChange={() => toggle(s.code)} /><img src={s.hull} alt="" /><small>{s.name}</small></label>)}</div>
    <Button onClick={() => void save()}>حفظ سفن البداية</Button>
    {msg && <small role="status">{msg}</small>}
  </div>;
}
