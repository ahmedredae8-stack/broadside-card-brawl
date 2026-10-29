import { MessageCircle, Swords, X } from "lucide-react";
import { CaptainAvatar } from "@/components/GameSprite";
import { powerOf, LOADOUT } from "@/components/battle/BattleScreen";
import { fleetCatalog } from "@/lib/fleetCatalog";
import { SEA_WORLDS } from "@/lib/seaWorld";
import { WEAPONS } from "@/game/duel";
import { isOnline, type Player } from "@/lib/player";
import { playSfx } from "@/lib/sound";

const hashSeed = (s: string) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

/** Captain dossier: their sea, fleet and power, with message / attack. */
export function PirateProfile({ player, isMe, onClose, onMessage, onAttack }: { player: Player; isMe: boolean; onClose: () => void; onMessage: () => void; onAttack: () => void }) {
  const world = SEA_WORLDS[hashSeed(player.id) % SEA_WORLDS.length]!;
  const online = isOnline(player.last_seen);
  return (
    <div className="daily-overlay" role="dialog" aria-modal="true" aria-label={`ملف ${player.name}`} onClick={onClose} dir="rtl" style={{ pointerEvents: "auto" }}>
      <div className="daily-panel pp-panel" onClick={(e) => e.stopPropagation()}>
        <button type="button" aria-label="إغلاق" onClick={onClose} className="tos-x"><X className="h-4 w-4" /></button>
        <div className="pp-sea" style={{ backgroundImage: `url(${world.thumb})` }}>
          <CaptainAvatar seed={player.avatar_index ?? 0} url={player.avatar_url} className="pp-photo" />
        </div>
        <header className="daily-head pp-head">
          <span className="daily-kicker">سجل القراصنة</span>
          <h2 className="daily-title">{player.name}</h2>
          <span className={online ? "pp-status on" : "pp-status"}>{online ? "في البحر الآن" : "غائب — يقاتل عنه قبطان آلي بنفس قوته"}</span>
        </header>
        <dl className="pp-stats">
          <div><dt>القوة</dt><dd>{powerOf(player).toLocaleString("ar")}</dd></div>
          <div><dt>النقاط</dt><dd>{(player.score ?? 0).toLocaleString("ar")}</dd></div>
          <div><dt>محيطه</dt><dd>{world.name}</dd></div>
        </dl>
        <ul className="pp-fleet" aria-label="الأسطول">
          {LOADOUT.ships.map((s, i) => (
            <li key={i}>
              <img src={fleetCatalog[0]!.hull} alt="" />
              <small>{s.weapons.map((w) => WEAPONS[w]?.name).join(" · ")}</small>
            </li>
          ))}
        </ul>
        {!isMe && (
          <div className="pp-actions">
            <button type="button" className="tos-btn pp-attack" onClick={() => { playSfx("click", 0.9); onAttack(); }}><Swords className="h-4 w-4" />هجوم</button>
            <button type="button" className="studio-chip pp-msg" onClick={() => { playSfx("click", 0.6); onMessage(); }}><MessageCircle className="h-4 w-4" />مراسلة</button>
          </div>
        )}
      </div>
    </div>
  );
}
