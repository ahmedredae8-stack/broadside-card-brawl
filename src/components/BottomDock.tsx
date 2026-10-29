import { Button } from "@/components/ui/button";
import dockChat from "@/assets/dock3/chat.png";
import dockStats from "@/assets/dock3/stats.png";
import dockBag from "@/assets/dock3/bag.png";
import dockStore from "@/assets/dock3/store.png";
import dockQuests from "@/assets/dock3/quests.png";
import dockBattle from "@/assets/dock3/battle.png";
import dockTribe from "@/assets/dock3/tribe.png";
import { playSfx } from "@/lib/sound";

export type DockAction = "chat" | "stats" | "bag" | "store" | "quests" | "battle" | "tribe";

const items: { id: DockAction; label: string; image: string }[] = [
  { id: "store", label: "المتجر", image: dockStore },
  { id: "bag", label: "مخزن العتاد", image: dockBag },
  { id: "quests", label: "التنبيهات", image: dockQuests },
  { id: "battle", label: "الأعداء", image: dockBattle },
  { id: "tribe", label: "القبيلة", image: dockTribe },
  { id: "stats", label: "الترتيب", image: dockStats },
  { id: "chat", label: "الدردشة", image: dockChat },
];

export function BottomDock({ onAction }: { onAction: (action: DockAction) => void }) {
  return (
    <nav className="game-dock" aria-label="قائمة اللعبة">
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <Button
              variant="ghost"
              className="game-dock-button"
              aria-label={item.label}
              title={item.label}
              onPointerEnter={() => playSfx("hover", 0.3)}
              onClick={() => {
                playSfx("click", 0.72);
                onAction(item.id);
              }}
            >
              <img src={item.image} alt="" width={512} height={512} draggable={false} />
            </Button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
