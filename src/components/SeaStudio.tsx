import { useEffect, useRef, useState } from "react";
import { Copy, Pause, Play, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { fleetCatalog } from "@/lib/fleetCatalog";

import SeaScene, { type SeaParams, type SeaShip, type SeaTheme } from "@/components/SeaScene";
import seaThemes from "@/data/seaThemes.json";
import { playSfx } from "@/lib/sound";

type Theme = SeaTheme & { thumb: string };
const THEMES = seaThemes as unknown as Theme[];

export type StudioConfig = { themeId: string; params: SeaParams; ships: SeaShip[] };
const KEY = "ib.seaStudio";
export const STUDIO_EVENT = "ib:sea-studio";
const DEFAULT_PARAMS: Required<SeaParams> = { amp: 1, spd: 1, ref: 1, sun: 1, foam: 0.7, rip: 1, paused: false };
const DEFAULT: StudioConfig = {
  themeId: THEMES[0]!.id,
  params: DEFAULT_PARAMS,
  ships: [{ id: "s1", src: fleetCatalog[0]!.hull, x: 0.62, y: 0.8, width: 0.34, waterline: 0.9 }],
};

export function hasSavedStudio() { try { return !!localStorage.getItem(KEY); } catch { return false; } }
export function loadStudio(): StudioConfig {
  try { const raw = localStorage.getItem(KEY); if (raw) { const c = { ...DEFAULT, ...JSON.parse(raw) }; if (!THEMES.some((t) => t.id === c.themeId)) c.themeId = THEMES[0]!.id; return c; } } catch { /* ignore */ }
  return DEFAULT;
}

const PRESETS: { label: string; p: Partial<SeaParams> }[] = [
  { label: "هادئ", p: { amp: 0.45, spd: 0.6, foam: 0.3, rip: 0.6 } },
  { label: "معتدل", p: { amp: 1, spd: 1, foam: 0.7, rip: 1 } },
  { label: "عاصف", p: { amp: 2, spd: 1.8, foam: 1.4, rip: 1.6, ref: 1.6 } },
  { label: "مرآة", p: { amp: 0.2, spd: 0.4, ref: 0.4, foam: 0.1, sun: 1.6 } },
];

const SLIDERS: { k: keyof SeaParams; label: string; min: number; max: number }[] = [
  { k: "amp", label: "ارتفاع الموج", min: 0, max: 2.5 },
  { k: "spd", label: "سرعة الموج", min: 0, max: 3 },
  { k: "ref", label: "انكسار الماء", min: 0, max: 2.5 },
  { k: "sun", label: "لمعان الشمس", min: 0, max: 2.5 },
  { k: "foam", label: "الزبد", min: 0, max: 2 },
  { k: "rip", label: "التموج حول السفن", min: 0, max: 2.5 },
];

/** Professional sea editor: every engine dial, ship placement and scene choice. */
export function SeaStudio() {
  const [cfg, setCfg] = useState<StudioConfig>(DEFAULT);
  const [sel, setSel] = useState(0);
  const [saved, setSaved] = useState("");
  const wrap = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const [pick, setPick] = useState(fleetCatalog[0]!.code);

  useEffect(() => setCfg(loadStudio()), []);
  const theme = THEMES.find((t) => t.id === cfg.themeId) ?? THEMES[0]!;
  const params = { ...DEFAULT_PARAMS, ...cfg.params };
  const ship = cfg.ships[sel];

  const setP = (p: Partial<SeaParams>) => setCfg((c) => ({ ...c, params: { ...c.params, ...p } }));
  const setShip = (patch: Partial<SeaShip>) => setCfg((c) => ({ ...c, ships: c.ships.map((s, i) => (i === sel ? { ...s, ...patch } : s)) }));

  const pointer = (e: React.PointerEvent) => {
    if (!drag.current || !wrap.current || !ship) return;
    const r = wrap.current.getBoundingClientRect();
    const x = Math.min(0.98, Math.max(0.02, (e.clientX - r.left) / r.width));
    const y = Math.min(0.98, Math.max(0.42, (e.clientY - r.top) / r.height));
    setShip({ x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 });
  };

  const pickNearest = (e: React.PointerEvent) => {
    if (!wrap.current) return;
    const r = wrap.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    let best = sel, d = Infinity;
    cfg.ships.forEach((s, i) => { const dd = (s.x - x) ** 2 + (s.y - y) ** 2; if (dd < d) { d = dd; best = i; } });
    setSel(best);
    drag.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const addShip = (src: string) => {
    if (cfg.ships.length >= 3) return setSaved("الحد الأقصى ثلاث سفن في المشهد");
    setCfg((c) => ({ ...c, ships: [...c.ships, { id: `s${Date.now()}`, src, x: 0.4, y: 0.72, width: 0.26, waterline: 0.9 }] }));
    setSel(cfg.ships.length);
  };

  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(cfg)); window.dispatchEvent(new CustomEvent(STUDIO_EVENT, { detail: cfg })); setSaved("تم حفظ بحرك وطُبّق على بحرك الرئيسي"); playSfx("click", 0.8); }
    catch { setSaved("تعذّر الحفظ"); }
  };

  const json = JSON.stringify({ theme: cfg.themeId, params, ships: cfg.ships.map((s) => ({ ...s, src: s.src })) }, null, 1);

  return (
    <div className="studio" dir="rtl">
      <div className="studio-stage" ref={wrap} onPointerDown={pickNearest} onPointerMove={pointer} onPointerUp={() => (drag.current = false)} onPointerCancel={() => (drag.current = false)}>
        <SeaScene theme={theme} ships={cfg.ships} params={params} />
        {ship && <span className="studio-marker" style={{ left: `${ship.x * 100}%`, top: `${ship.y * 100}%` }} />}
      </div>

      <div className="studio-panel">
        <section>
          <h3>الخلفية</h3>
          <div className="studio-themes">
            {THEMES.map((t) => (
              <button key={t.id} type="button" className={t.id === theme.id ? "studio-theme on" : "studio-theme"} onClick={() => { playSfx("hover", 0.3); setCfg((c) => ({ ...c, themeId: t.id })); }}>
                <img src={t.thumb} alt="" loading="lazy" /><small>{t.name}</small>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3>الماء</h3>
          <div className="studio-chips">
            {PRESETS.map((p) => <button key={p.label} type="button" className="studio-chip" onClick={() => setP(p.p)}>{p.label}</button>)}
            <button type="button" className="studio-chip" onClick={() => setP({ paused: !params.paused })}>{params.paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}{params.paused ? "تشغيل" : "إيقاف"}</button>
          </div>
          {SLIDERS.map((s) => (
            <label key={s.k} className="studio-range">
              <span>{s.label}<output>{Number(params[s.k]).toFixed(2)}</output></span>
              <input type="range" min={s.min} max={s.max} step={0.05} value={Number(params[s.k])} onChange={(e) => setP({ [s.k]: Number(e.target.value) })} />
            </label>
          ))}
        </section>

        <section>
          <h3>السفن <small>اسحب السفينة على البحر</small></h3>
          <div className="studio-chips">
            {cfg.ships.map((s, i) => <button key={s.id} type="button" className={i === sel ? "studio-chip on" : "studio-chip"} onClick={() => setSel(i)}>سفينة {i + 1}</button>)}
            <select className="studio-select" value={pick} onChange={(e) => setPick(e.target.value)} aria-label="اختر سفينة">
              {fleetCatalog.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
            <button type="button" className="studio-chip" onClick={() => addShip(fleetCatalog.find((s) => s.code === pick)!.hull)}><Plus className="h-3.5 w-3.5" />أضف للبحر</button>
          </div>
          {ship && (
            <>
              <label className="studio-range"><span>الحجم<output>{(ship.width ?? 0.3).toFixed(2)}</output></span><input type="range" min={0.15} max={0.6} step={0.01} value={ship.width ?? 0.3} onChange={(e) => setShip({ width: Number(e.target.value) })} /></label>
              <label className="studio-range"><span>خط الماء<output>{(ship.waterline ?? 0.9).toFixed(2)}</output></span><input type="range" min={0.7} max={0.97} step={0.01} value={ship.waterline ?? 0.9} onChange={(e) => setShip({ waterline: Number(e.target.value) })} /></label>
              <label className="studio-range"><span>الموضع الأفقي<output>{ship.x.toFixed(2)}</output></span><input type="range" min={0.02} max={0.98} step={0.005} value={ship.x} onChange={(e) => setShip({ x: Number(e.target.value) })} /></label>
              <label className="studio-range"><span>العمق في البحر<output>{ship.y.toFixed(2)}</output></span><input type="range" min={0.42} max={0.98} step={0.005} value={ship.y} onChange={(e) => setShip({ y: Number(e.target.value) })} /></label>
              <label className="studio-check"><input type="checkbox" checked={ship.visible !== false} onChange={(e) => setShip({ visible: e.target.checked })} /> إظهار السفينة</label>
              <button type="button" className="studio-chip danger" onClick={() => { setCfg((c) => ({ ...c, ships: c.ships.filter((_, i) => i !== sel) })); setSel(0); }}><Trash2 className="h-3.5 w-3.5" />حذف السفينة</button>
            </>
          )}
        </section>

        <section>
          <h3>الإعدادات الحالية</h3>
          <textarea className="studio-json" readOnly value={json} dir="ltr" />
          <div className="studio-chips">
            <button type="button" className="tos-btn" onClick={save}><Save className="h-4 w-4" />حفظ بحري</button>
            <button type="button" className="studio-chip" onClick={() => void navigator.clipboard?.writeText(json).then(() => setSaved("تم النسخ"))}><Copy className="h-3.5 w-3.5" />نسخ</button>
            <button type="button" className="studio-chip" onClick={() => { setCfg(DEFAULT); setSel(0); }}><RotateCcw className="h-3.5 w-3.5" />استعادة</button>
          </div>
          {saved && <p className="gate-note" role="status">{saved}</p>}
        </section>
      </div>
    </div>
  );
}
