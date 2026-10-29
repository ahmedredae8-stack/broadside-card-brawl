import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { NameGate } from "@/components/NameGate";
import { usePlayer } from "@/hooks/usePlayer";
import { currentPhase, defaultTheme, getScene } from "@/lib/themes";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "دخول القبطان — عرش البحار" },
      {
        name: "description",
        content: "سجّل دخولك باسم قبطان وكلمة مرور للانضمام إلى دردشة عرش البحار وقائمة الأصدقاء.",
      },
      { property: "og:title", content: "دخول القبطان — عرش البحار" },
      {
        property: "og:description",
        content: "أنشئ حساب قبطانك وابدأ الإبحار في عرش البحار.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { player, loading, setPlayer } = usePlayer();
  const navigate = useNavigate();
  const scene = getScene(defaultTheme, currentPhase());

  if (!loading && player) {
    void navigate({ to: "/", replace: true });
  }

  return (
    <main className="auth-stage bg-[oklch(0.12_0.04_250)] text-white">
      {scene.video ? <video className="auth-scene" src={scene.video} poster={scene.poster} autoPlay loop muted playsInline /> : <img className="auth-scene" src={scene.poster} alt="" />}
      {loading ? (
        <div className="relative z-10 grid place-items-center">
          <Loader2 className="h-7 w-7 animate-spin text-[var(--gold)]" />
        </div>
      ) : (
        <NameGate
          onReady={(p) => {
            setPlayer(p);
            void navigate({ to: "/", replace: true });
          }}
        />
      )}
    </main>
  );
}
