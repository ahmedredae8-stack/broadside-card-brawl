import { useEffect, useRef, useState } from "react";

import { playSfx } from "@/lib/sound";
import introArt from "@/assets/intro-epic.jpg";
import { hulls, fleetCatalog } from "@/lib/fleetCatalog";
import { FISH } from "@/lib/catches";
import { themes } from "@/lib/themes";

const STAGES = ["تجهيز الأسطول", "شحن المدافع", "رسم خرائط المحيط", "رفع الراية"];
const dockIcons = Object.values(import.meta.glob("@/assets/dock2/*.png", { eager: true, import: "default" })) as string[];

/** Every image the first screen needs, so the game opens fully drawn. */
function criticalImages(): string[] {
  const list = [
    ...themes.flatMap((t) => [t.day.poster, t.night.poster]),
    ...hulls,
    ...fleetCatalog.map((s) => s.hull),
    ...FISH.map((f) => f.img),
    ...dockIcons,
  ];
  return [...new Set(list.filter(Boolean))];
}

function preload(src: string) {
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = img.onerror = () => resolve();
    img.src = src;
  });
}

export function IntroLoader({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    let alive = true;
    const urls = criticalImages();
    let loaded = 0;
    const t0 = performance.now();
    const MIN = 1600; // keep the cinematic beat even on instant cache hits
    let raf = 0;
    const tick = () => {
      const real = urls.length ? loaded / urls.length : 1;
      const time = Math.min(1, (performance.now() - t0) / MIN);
      setProgress(Math.min(real, time) * 100);
      if (real >= 1 && time >= 1) {
        setLeaving(true);
        window.setTimeout(() => alive && onDone(), 560);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    urls.forEach((u) => void preload(u).then(() => { loaded++; }));
    // Never trap the player behind a slow network.
    const guard = window.setTimeout(() => { loaded = urls.length; }, 9000);
    return () => { alive = false; cancelAnimationFrame(raf); window.clearTimeout(guard); };
  }, [onDone]);

  useEffect(() => {
    const fire = () => { if (started.current) return; started.current = true; playSfx("intro", 0.9); };
    fire();
    window.addEventListener("pointerdown", fire, { once: true });
    return () => window.removeEventListener("pointerdown", fire);
  }, []);

  const stage = Math.min(STAGES.length - 1, Math.floor((progress / 100) * STAGES.length));

  return (
    <div className={`tos-intro ${leaving ? "out" : ""}`} role="status" aria-live="polite" aria-label="جاري تحميل اللعبة">
      <img src={introArt} alt="عرش إله البحار وأسطول يشق الموج العاصف" width={1088} height={1920} className="tos-intro-art" />
      <div className="tos-intro-rays" aria-hidden="true" />
      <div className="tos-intro-top" dir="rtl">
        <span className="tos-intro-badge">الموسم الأول</span>
        <h1 className="tos-intro-title"><span>عرش</span><b>البحار</b></h1>
        <p>من يحكم الموج… يحكم العالم</p>
      </div>
      <div className="tos-intro-bottom" dir="rtl">
        <div className="tos-intro-ring" style={{ "--p": `${progress * 3.6}deg` } as React.CSSProperties}>
          <span>{Math.round(progress)}<small>%</small></span>
        </div>
        <div className="tos-intro-status">
          <strong>{STAGES[stage]}</strong>
          <ol className="tos-intro-steps" aria-hidden="true">
            {STAGES.map((s, i) => <li key={s} className={i < stage ? "done" : i === stage ? "now" : ""} />)}
          </ol>
        </div>
      </div>
    </div>
  );
}
