import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";

import { IntroLoader } from "@/components/IntroLoader";
import { GameStore } from "@/components/GameStore";
import { AlertsWindow, InventoryWindow, RankingsWindow } from "@/components/DockWindows";
import { TribesPage } from "@/routes/tribes";
import { GameWindow } from "@/components/GameWindow";
import { TradingFloor } from "@/components/TradingFloor";
import { TopHud } from "@/components/TopHud";
import { DailyReward } from "@/components/DailyReward";
import { QuestBoard } from "@/components/QuestBoard";
import { CaptainGate } from "@/components/CaptainGate";
import { SeaStudio, loadStudio, hasSavedStudio, STUDIO_EVENT, type StudioConfig } from "@/components/SeaStudio";
import SeaScene, { type SeaEngine, type SeaParams } from "@/components/SeaScene";
import { SEA_WORLDS, SEA_WORLD_EVENT, getSeaWorld, loadSeaWorldId } from "@/lib/seaWorld";
import { BottomDock, type DockAction } from "@/components/BottomDock";
import { FishingFleet } from "@/components/FishingFleet";
import { CALIB_EVENT } from "@/components/FleetCalibrator";
import { usePlayer } from "@/hooks/usePlayer";
import { useStageScale } from "@/hooks/useStageScale";
import { saveThemeToAccount } from "@/lib/player";
import { isMuted, playAmbient, playSfx, setMuted, stopAllSounds } from "@/lib/sound";
import { FishMarket } from "@/routes/fish-market";
import { Shipyard } from "@/routes/shipyard";
import { ChatPage } from "@/routes/chat";
import { SettingsPage } from "@/routes/settings";
import { PirateProfile } from "@/components/battle/PirateProfile";
import { BattleScreen } from "@/components/battle/BattleScreen";
import {
  currentPhase,
  defaultTheme,
  getAmbient,

  getTheme,
  hotspots,
  loadThemeId,
  msUntilNextPhase,
  phaseLabel,
  saveThemeId,
} from "@/lib/themes";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "عرش البحار — Throne of Seas" },
      {
        name: "description",
        content:
          "خليج حي بخلفيات فيديو متحركة ودورة نهار وليل، مع سوق السمك وسوق السفن وشاشة تداول كاملة.",
      },
      { property: "og:title", content: "عرش البحار — Throne of Seas" },
      {
        property: "og:description",
        content:
          "خليج حي بخلفيات فيديو متحركة ودورة نهار وليل، مع سوق السمك وسوق السفن وشاشة تداول كاملة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

/** Lively default swell for the home sea until the player saves a studio setup. */
const STORMY: SeaParams = { amp: 1.7, spd: 1.5, ref: 1.4, sun: 1, foam: 1.2, rip: 1.4 };

/** Every destination lives as a floating window over the living sea. */
type Win = "chat" | "settings" | "studio" | "fish" | "ship" | "trade-fish" | "trade-ship" | "stats" | "bag" | "alerts" | "enemies" | "tribe" | null;

function Index() {
  const stageHost = useStageScale();
  const { player, loading, setPlayer, refresh } = usePlayer();
  const [sound, setSound] = useState(true);
  const [intro, setIntro] = useState(true);
  const [themeId, setThemeId] = useState(defaultTheme.id);
  const [shopOpen, setShopOpen] = useState(false);
  const [questsOpen, setQuestsOpen] = useState(false);
  const [win, setWin] = useState<Win>(null);
  const [profile, setProfile] = useState<import("@/lib/player").Player | null>(null);
  const [foe, setFoe] = useState<import("@/lib/player").Player | null>(null);
  const [chatPeer, setChatPeer] = useState<import("@/lib/player").Player | null>(null);
  const [phase, setPhase] = useState(currentPhase());

  const theme = getTheme(themeId);
  const ambient = getAmbient(theme, phase);

  useEffect(() => setThemeId(loadThemeId()), []);

  const [seaWorldId, setSeaWorldId] = useState(SEA_WORLDS[0]!.id);
  const [seaParams, setSeaParams] = useState<SeaParams>({});
  const seaWorld = getSeaWorld(seaWorldId);
  const seaEngine = useRef<SeaEngine | null>(null);
  useEffect(() => {
    // Studio edits (scene + water dials) drive the home sea; ship placement stays on its lanes.
    const applyStudio = (c: StudioConfig) => { setSeaParams(c.params); setSeaWorldId(c.themeId); };
    if (hasSavedStudio()) applyStudio(loadStudio());
    else { setSeaWorldId(loadSeaWorldId()); setSeaParams(STORMY); }
    const onWorld = (e: Event) => setSeaWorldId(String((e as CustomEvent).detail));
    const onStudio = (e: Event) => applyStudio((e as CustomEvent<StudioConfig>).detail);
    window.addEventListener(SEA_WORLD_EVENT, onWorld);
    window.addEventListener(STUDIO_EVENT, onStudio);
    return () => { window.removeEventListener(SEA_WORLD_EVENT, onWorld); window.removeEventListener(STUDIO_EVENT, onStudio); };
  }, []);

  // Flip the world between day and night on the player's own clock.
  useEffect(() => {
    const t = window.setTimeout(() => setPhase(currentPhase()), msUntilNextPhase() + 500);
    return () => window.clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (player?.theme_id) {
      setThemeId(player.theme_id);
      saveThemeId(player.theme_id);
    }
  }, [player?.theme_id]);

  const selectTheme = (id: string) => {
    setThemeId(id);
    saveThemeId(id);
    if (player) void saveThemeToAccount(player.id, id);
    setShopOpen(false);
  };

  const finishIntro = useCallback(() => setIntro(false), []);

  // The bed follows whichever world is on screen, day or night.
  useEffect(() => {
    if (intro) return;
    playAmbient(ambient, 0.35);
  }, [intro, ambient]);

  useEffect(() => stopAllSounds, []);

  const toggleSound = () => {
    const next = isMuted();
    setMuted(!next);
    setSound(next);
    if (next) playAmbient(ambient, 0.35);
  };

  const open = (w: Win) => {
    playSfx("click", 0.7);
    setWin(w);
  };

  const handleDockAction = (action: DockAction) => {
    if (action === "chat") open("chat");
    else if (action === "store") setShopOpen(true);
    else if (action === "quests") open("alerts");
    else if (action === "tribe") open("tribe");
    else if (action === "battle") open("enemies");
    else if (action === "bag") open("bag");
    else open("stats");
  };

  return (
    <div className="game-root" ref={stageHost}>
      {/* Soft bleed so wide screens never show bare black bars */}
      <img src={seaWorld.thumb} alt="" aria-hidden="true" className="stage-backdrop" />

      <main className="game-stage relative overflow-hidden bg-[oklch(0.15_0.04_250)]">
      {/* Living scene: the WebGL sea engine, so boats sit inside the water */}
      <div className="scene-stage">
        <SeaScene theme={seaWorld} params={seaParams} onEngine={(e) => (seaEngine.current = e)} className="scene-video scene-sea" style={{ aspectRatio: "auto", width: "100%", height: "100%" }} />

        {hotspots.map((h) => (
          <button
            key={h.id}
            type="button"
            aria-label={h.label}
            className="hotspot"
            style={{ left: `${h.x}%`, top: `${h.y}%`, width: `${h.w}%`, height: `${h.h}%` }}
            onPointerEnter={() => playSfx("hover", 0.3)}
            onClick={() => open(h.id === "fish" ? "fish" : "ship")}
          >
            <span className="hotspot-ring" />
          </button>
        ))}
        <FishingFleet themeId={themeId} themeName={theme.name} seaEngine={seaEngine} />
      </div>

      {/* Top HUD */}
      <div className="absolute inset-x-0 top-0 z-10 px-1 pt-[max(0.35rem,env(safe-area-inset-top))]">
        <TopHud
          name={player?.name ?? "قبطان"}
          onAvatarClick={() => open("settings")}
          onGiftClick={() => setQuestsOpen(true)}
          onTopUp={() => { playSfx("click", 0.7); setShopOpen(true); }}
        />
      </div>

      {/* Controls */}
      <div className="phase-control">
        <button
          type="button"
          className="phase-chip"
          onClick={() => window.dispatchEvent(new CustomEvent(CALIB_EVENT))}
          aria-label={phaseLabel(phase)}
        >
          {phase === "day" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          {phaseLabel(phase)}
        </button>
      </div>

      <BottomDock onAction={handleDockAction} />

       {shopOpen && <GameStore activeId={themeId} onSelect={selectTheme} onClose={() => setShopOpen(false)} />}

      {questsOpen && (
        <div className="daily-overlay" role="dialog" aria-label="المهام اليومية">
          <QuestBoard onClose={() => setQuestsOpen(false)} />
        </div>
      )}

      {win === "chat" && (
        <GameWindow title="الدردشة" hint="تحدث مع القباطنة" size="lg" onClose={() => { setWin(null); setChatPeer(null); }}>
          <ChatPage key={chatPeer?.id ?? "none"} peer={chatPeer} />
        </GameWindow>
      )}
      {win === "stats" && <GameWindow title="سجل القباطنة" size="lg" onClose={() => setWin(null)}><RankingsWindow onPick={(p) => { setWin(null); setProfile(p); }} /></GameWindow>}
      {profile && !foe && <PirateProfile player={profile} isMe={profile.id === player?.id} onClose={() => setProfile(null)} onMessage={() => { setChatPeer(profile); setProfile(null); setWin("chat"); }} onAttack={() => { if (player) setFoe(profile); }} />}
      {foe && player && <BattleScreen me={player} foe={foe} onClose={() => { setFoe(null); setProfile(null); }} />}
      {win === "bag" && <GameWindow title="مخزن العتاد" size="lg" onClose={() => setWin(null)}><InventoryWindow player={player} /></GameWindow>}
      {win === "alerts" && <GameWindow title="التنبيهات" size="lg" onClose={() => setWin(null)}><AlertsWindow /></GameWindow>}
      {win === "enemies" && <GameWindow title="البحث عن القراصنة" hint="ابحث عن قرصان واضغط لعرض ملفه" size="lg" onClose={() => setWin(null)}><RankingsWindow onPick={(p) => { setWin(null); setProfile(p); }} /></GameWindow>}
       {win === "tribe" && <GameWindow title="القبيلة" size="xl" onClose={() => setWin(null)}><TribesPage /></GameWindow>}
      {win === "settings" && (
        <GameWindow title="الإعدادات" size="md" onClose={() => setWin(null)}>
          <SettingsPage onOpenStudio={() => setWin("studio")} />
        </GameWindow>
      )}
      {win === "studio" && (
        <GameWindow title="استوديو البحر" hint="اضبط بحرك وسفنك" size="xl" onClose={() => setWin(null)}>
          <SeaStudio />
        </GameWindow>
      )}
      {win === "fish" && (
        <GameWindow title="سوق السمك" hint="بع صيدك بسعر الساعة" size="md" onClose={() => setWin(null)}>
          <FishMarket />
        </GameWindow>
      )}
      {win === "ship" && (
        <GameWindow title="سوق السفن" hint="اشترِ وطوّر أسطولك" size="lg" onClose={() => setWin(null)}>
          <Shipyard />
        </GameWindow>
      )}
      {(win === "trade-fish" || win === "trade-ship") && (
        <GameWindow title="قاعة التداول" hint="أسعار حيّة وأوامر شراء وبيع" size="xl" onClose={() => setWin(null)}>
          <TradingFloor start={win === "trade-fish" ? "fish" : "ship"} />
        </GameWindow>
      )}

      {!intro && <DailyReward />}
      {!intro && !loading && !player && <CaptainGate onReady={(p) => { setPlayer(p); void refresh(); }} />}

      {intro && <IntroLoader onDone={finishIntro} />}
      </main>
    </div>
  );
}
