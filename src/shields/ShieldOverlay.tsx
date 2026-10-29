import { useEffect, useRef } from "react";
// كل درع ملف SVG مستقل في ./svg . نحقنه كنص لتعمل الحركات المضمّنة فيه.
const svgs = import.meta.glob("./svg/*.svg", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const raw = (tier: number) => svgs[Object.keys(svgs).find((k) => k.endsWith(`shield_${tier}.svg`))!];
export type ShieldState = "idle" | "spawn" | "hit" | "break" | "reflect" | "off";
type Props = {
  tier: 1 | 2 | 3 | 4 | 5;
  state?: ShieldState;
  trigger?: number;            // غيّر الرقم لإعادة تشغيل نفس الحالة من البداية
  impact?: { x: number; y: number }; // نقطة الإصابة بإحداثيات الـviewBox (من -50 إلى 450 أفقيًا ومن 0 إلى 280 رأسيًا)
  width?: number | string;     // عرض الصورة كلها. القبة نفسها = 68% منه. اجعله حوالي 2.4 × عرض السفينة
  className?: string; style?: React.CSSProperties;
};
// ضعه داخل عنصر position:relative فوق السفينة. حافة القاعدة تُحاذي خط الماء عند السفينة.
export default function ShieldOverlay({ tier, state = "idle", trigger = 0, impact, width = "240%", className, style }: Props) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const svg = box.current?.querySelector("svg");
    if (!svg) return;
    if (impact) { svg.style.setProperty("--hx", `${impact.x}px`); svg.style.setProperty("--hy", `${impact.y}px`); }
    svg.setAttribute("data-state", "idle");
    void svg.getBoundingClientRect();
    svg.setAttribute("data-state", state);
  }, [state, trigger, tier, impact?.x, impact?.y]);
  return (
    <div ref={box} className={className}
      style={{ position: "absolute", left: "50%", top: "77%", width, transform: "translate(-50%,-77%)", pointerEvents: "none", lineHeight: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: (raw(tier) ?? "").replace(/width="\d+" height="\d+"/, 'width="100%"') }} />
  );
}
