import { useEffect, useState } from "react";

import { playSfx } from "@/lib/sound";

const loot = [
  "/__l5e/assets-v1/4d947f02-ecc3-4613-b7b5-3e113acc3a97/fish-sardine.png",
  "/__l5e/assets-v1/bbc91b64-b810-402e-874e-e27d05ef99cd/fish-mackerel.png",
  "/__l5e/assets-v1/2456c8d2-aeaa-4fe7-9ae2-265f9bf4bb89/fish-tuna.png",
  "/__l5e/assets-v1/3d1d5bea-96d4-4dc3-a7ef-d15a009a9c5b/fish-swordfish.png",
  "/__l5e/assets-v1/dac2cc2e-4dae-44f5-a16a-3086c0d6e83e/fish-turtle.png",
  "/__l5e/assets-v1/ddafcd10-03a7-4e1c-baa8-6921ef5721b0/fish-pearl.png",
];

/** Multi-frame net cast: throw → splash → haul, then a small loot burst. */
export function NetCast({ onDone }: { onDone: () => void }) {
  const [stage, setStage] = useState<"throw" | "splash" | "haul">("throw");
  const catchList = loot.slice(0, 3 + Math.floor(Math.random() * 3));

  useEffect(() => {
    playSfx("click", 0.7);
    const a = window.setTimeout(() => setStage("splash"), 750);
    const b = window.setTimeout(() => setStage("haul"), 1500);
    const c = window.setTimeout(onDone, 3200);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
      window.clearTimeout(c);
    };
  }, [onDone]);

  return (
    <div className="net-stage" role="status" aria-live="polite">
      <div className="net-water" />
      <img src="/__l5e/assets-v1/a78892fb-cc92-43da-8c99-113236cf0e7c/net.png" alt="" className={`net-img net-${stage}`} />

      {stage !== "throw" && (
        <>
          <span className="net-ripple" />
          <span className="net-ripple net-ripple-2" />
        </>
      )}

      {stage === "haul" && (
        <ul className="net-loot">
          {catchList.map((src, i) => (
            <li key={src} style={{ animationDelay: `${i * 110}ms` }}>
              <img src={src} alt="" loading="lazy" />
            </li>
          ))}
        </ul>
      )}

      <p className="net-caption">
        {stage === "throw" ? "رمي الشباك..." : stage === "splash" ? "الشباك في الماء..." : "صيد وفير!"}
      </p>
    </div>
  );
}
