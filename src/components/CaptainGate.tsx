import { useRef, useState } from "react";
import { Anchor, Camera, Loader2, Lock, ShieldCheck, User } from "lucide-react";

import { signInCaptain, signUpCaptain } from "@/lib/auth";
import { CAPTAINS } from "@/lib/art";
import { saveAvatarUrl, type Player } from "@/lib/player";
import { playSfx } from "@/lib/sound";

type Mode = "login" | "signup";

/** Shrinks a device photo to a small square portrait (data URL). */
async function toPortrait(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const s = Math.min(bmp.width, bmp.height);
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  c.getContext("2d")!.drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, 256, 256);
  return c.toDataURL("image/jpeg", 0.82);
}

/** Mandatory captain sign-in, styled like the daily treasury window. */
export function CaptainGate({ onReady }: { onReady: (p: Player) => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(0);
  const [custom, setCustom] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickFile = async (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith("image/") || f.size > 8 * 1024 * 1024) return setError("اختر صورة لا تتجاوز 8 ميجابايت");
    try { setCustom(await toPortrait(f)); setError(null); playSfx("click", 0.5); } catch { setError("تعذّر قراءة الصورة"); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError(null); playSfx("click", 0.7);
    const res = mode === "login" ? await signInCaptain(username, password) : await signUpCaptain(username, password, avatar);
    if (res.error || !res.player) { setBusy(false); return setError(res.error ?? "تعذّر الدخول"); }
    let p = res.player;
    if (mode === "signup" && custom) { await saveAvatarUrl(p.id, custom); p = { ...p, avatar_url: custom }; }
    setBusy(false);
    onReady(p);
  };

  return (
    <div className="daily-overlay gate-overlay" role="dialog" aria-modal="true" aria-label="دخول القبطان" dir="rtl">
      <div className="daily-panel gate-panel">
        <header className="daily-head">
          <span className="daily-kicker">بوابة العرش</span>
          <h2 className="daily-title">{mode === "login" ? "عودة القبطان" : "قبطان جديد"}</h2>
          <p className="gate-sub">سجّل دخولك لتبحر وتحفظ صيدك وثروتك</p>
        </header>

        <div className="gate-tabs">
          {(["login", "signup"] as Mode[]).map((m) => (
            <button key={m} type="button" className={mode === m ? "gate-tab on" : "gate-tab"} onClick={() => { setMode(m); setError(null); playSfx("hover", 0.3); }}>
              {m === "login" ? "دخول" : "حساب جديد"}
            </button>
          ))}
        </div>

        {mode === "signup" && (
          <div className="gate-avatars">
            <span className="gate-label">اختر صورة القبطان</span>
            <div className="gate-grid">
              {CAPTAINS.map((src, i) => (
                <button key={src} type="button" aria-label={`صورة ${i + 1}`} className={!custom && avatar === i ? "gate-face on" : "gate-face"} onClick={() => { setAvatar(i); setCustom(null); playSfx("hover", 0.25); }}>
                  <img src={src} alt="" />
                </button>
              ))}
              <button type="button" className={custom ? "gate-face gate-upload on" : "gate-face gate-upload"} onClick={() => fileRef.current?.click()} aria-label="رفع صورة من الجهاز">
                {custom ? <img src={custom} alt="" /> : <><Camera /><small>من جهازك</small></>}
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { void pickFile(e.target.files?.[0]); e.target.value = ""; }} />
          </div>
        )}

        <form onSubmit={submit} className="gate-form">
          <label className="gate-field"><User /><input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={mode === "login" ? 255 : 16} autoComplete="username" dir="auto" placeholder={mode === "login" ? "اسم القبطان أو البريد" : "اسم القبطان"} /></label>
          <label className="gate-field"><Lock /><input value={password} onChange={(e) => setPassword(e.target.value)} type="password" maxLength={72} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="كلمة المرور" /></label>
          {error && <p className="gate-error" role="alert">{error}</p>}
          <button type="submit" disabled={busy} className="tos-btn daily-claim">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Anchor className="h-4 w-4" />}
            {mode === "login" ? "أبحر الآن" : "أنشئ حساب القبطان"}
          </button>
        </form>
        <p className="gate-note"><ShieldCheck className="h-3.5 w-3.5" /> الاسم محجوز لك وحدك ومرتبط بكلمة مرورك</p>
      </div>
    </div>
  );
}
