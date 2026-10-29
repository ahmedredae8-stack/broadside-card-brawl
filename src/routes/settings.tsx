import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bell, Camera, Gauge, LogOut, Music2, ShieldCheck, Sparkles, Vibrate, Waves } from "lucide-react";

import { CaptainAvatar, nameSeed } from "@/components/GameSprite";
import { CaptainGate } from "@/components/CaptainGate";
import { usePlayer } from "@/hooks/usePlayer";
import { CAPTAINS } from "@/lib/art";
import { signOutCaptain } from "@/lib/auth";
import { isArtworkAdmin } from "@/lib/artwork";
import { clearPlayer, saveAvatarToAccount, saveAvatarUrl } from "@/lib/player";
import { isMuted, playSfx, setMuted, startAmbient } from "@/lib/sound";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "إعدادات القبطان — عرش البحار" }, { name: "description", content: "حساب القبطان، صورته، الصوت، جودة الرسوم واستوديو البحر." }, { property: "og:title", content: "إعدادات القبطان — عرش البحار" }, { property: "og:description", content: "تحكم في حسابك وتجربة اللعب." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: () => <SettingsPage />,
});

const pref = (k: string, d: string) => (typeof localStorage === "undefined" ? d : localStorage.getItem(k) ?? d);

async function toPortrait(file: File) {
  const bmp = await createImageBitmap(file);
  const s = Math.min(bmp.width, bmp.height);
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  c.getContext("2d")!.drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, 256, 256);
  return c.toDataURL("image/jpeg", 0.82);
}

export function SettingsPage({ onOpenStudio }: { onOpenStudio?: () => void }) {
  const { player, setPlayer, refresh } = usePlayer();
  const navigate = useNavigate();
  const [sound, setSound] = useState(true);
  const [quality, setQuality] = useState("high");
  const [vibrate, setVibrate] = useState(true);
  const [notify, setNotify] = useState(true);
  const [admin, setAdmin] = useState(false);
  const [faces, setFaces] = useState(false);
  const [gate, setGate] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { void isArtworkAdmin().then(setAdmin).catch(() => setAdmin(false)); }, [player?.id]);
  useEffect(() => { setSound(!isMuted()); setQuality(pref("ib.quality", "high")); setVibrate(pref("ib.vibrate", "on") === "on"); setNotify(pref("ib.notify", "on") === "on"); if (pref("ib.quality", "high") === "low") document.documentElement.classList.add("reduce-game-motion"); }, []);

  const store = (k: string, v: string) => { localStorage.setItem(k, v); playSfx("click", 0.5); };
  const toggleSound = () => { const n = !sound; setSound(n); setMuted(!n); if (n) startAmbient(); };
  const pickQuality = (q: string) => { setQuality(q); store("ib.quality", q); document.documentElement.classList.toggle("reduce-game-motion", q === "low"); };
  const logout = async () => { await signOutCaptain(); clearPlayer(); setPlayer(null); void navigate({ to: "/", replace: true }); };

  const chooseFace = async (i: number) => { if (!player) return; await saveAvatarToAccount(player.id, i); await saveAvatarUrl(player.id, null); setPlayer({ ...player, avatar_index: i, avatar_url: null }); setFaces(false); };
  const uploadFace = async (f?: File) => { if (!f || !player) return; const url = await toPortrait(f); await saveAvatarUrl(player.id, url); setPlayer({ ...player, avatar_url: url }); setFaces(false); };

  return (
    <div className="cfg" dir="rtl">
      <section className="cfg-account">
        <button type="button" className="cfg-face" onClick={() => player && setFaces((v) => !v)} aria-label="تغيير الصورة">
          <CaptainAvatar seed={player?.avatar_index ?? nameSeed(player?.name ?? "قبطان")} url={player?.avatar_url} />
          {player && <span><Camera className="h-3.5 w-3.5" /></span>}
        </button>
        <div>
          <small>حساب القبطان</small>
          <h2>{player?.name ?? "زائر"}</h2>
          <p>{player ? <><ShieldCheck className="h-3.5 w-3.5" /> الحساب محمي ومحفوظ</> : "سجّل دخولك لحفظ تقدّمك"}</p>
        </div>
        {!player && <button type="button" className="tos-btn" onClick={() => setGate(true)}>تسجيل الدخول</button>}
      </section>

      {faces && player && (
        <div className="gate-grid cfg-faces">
          {CAPTAINS.map((src, i) => <button key={src} type="button" className="gate-face" onClick={() => void chooseFace(i)}><img src={src} alt="" /></button>)}
          <button type="button" className="gate-face gate-upload" onClick={() => fileRef.current?.click()}><Camera /><small>من جهازك</small></button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { void uploadFace(e.target.files?.[0]); e.target.value = ""; }} />
        </div>
      )}

      <button type="button" className="cfg-studio" onClick={() => { playSfx("click", 0.7); if (onOpenStudio) onOpenStudio(); else void navigate({ to: "/sea-studio" }); }}>
        <Waves /><div><b>استوديو البحر</b><small>الأمواج، الزبد، اللمعان، الخلفيات ومكان السفن</small></div><Sparkles />
      </button>

      <section className="cfg-list">
        <Row icon={<Music2 />} title="الصوت والموسيقى" on={sound} onToggle={toggleSound} />
        <Row icon={<Vibrate />} title="الاهتزاز" on={vibrate} onToggle={() => { try { navigator.vibrate?.(vibrate ? 0 : [40]); } catch { /* not supported */ } setVibrate(!vibrate); store("ib.vibrate", vibrate ? "off" : "on"); }} />
        <Row icon={<Bell />} title="إشعارات عودة السفن" on={notify} onToggle={() => { setNotify(!notify); store("ib.notify", notify ? "off" : "on"); }} />
        <div className="cfg-row">
          <span className="cfg-ico"><Gauge /></span><b>جودة الرسوم</b>
          <div className="cfg-seg">
            {[["low", "منخفضة"], ["mid", "متوسطة"], ["high", "عالية"]].map(([k, l]) => <button key={k} type="button" className={quality === k ? "on" : ""} onClick={() => pickQuality(k!)}>{l}</button>)}
          </div>
        </div>
      </section>

      {admin && <Link to="/admin" className="cfg-admin">استوديو الأدمن — وضعيات السفن</Link>}
      {player && <button type="button" className="cfg-logout" onClick={() => void logout()}><LogOut className="h-4 w-4" /> تسجيل الخروج</button>}

      {gate && <CaptainGate onReady={(p) => { setPlayer(p); setGate(false); void refresh(); }} />}
    </div>
  );
}

function Row({ icon, title, on, onToggle }: { icon: React.ReactNode; title: string; on: boolean; onToggle: () => void }) {
  return <div className="cfg-row"><span className="cfg-ico">{icon}</span><b>{title}</b><button type="button" role="switch" aria-checked={on} aria-label={title} className={on ? "cfg-switch on" : "cfg-switch"} onClick={onToggle}><span /></button></div>;
}
