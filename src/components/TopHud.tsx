import { CaptainAvatar, nameSeed } from "@/components/GameSprite";
import { Gift, Plus } from "lucide-react";

import coinImg from "@/assets/dock2/coin.png";
import rubyImg from "@/assets/dock2/ruby.png";
import diamondImg from "@/assets/dock2/diamond.png";
import fishImg from "@/assets/dock2/fish.png";

type Props = {
  name: string;
  avatar?: number;
  avatarUrl?: string | null;
  title?: string;
  level?: number;
  progress?: number;
  coins?: number;
  rubies?: number;
  diamonds?: number;
  fishFound?: number;
  fishTotal?: number;
  onAvatarClick?: () => void;
  onGiftClick?: () => void;
  onTopUp?: (kind: "coins" | "rubies" | "diamonds") => void;
};

/** Throne of Seas command strip: round captain medallion, one unified resource rail, gift seal. */
export function TopHud({
  name,
  avatar,
  avatarUrl,
  level = 12,
  progress = 0.62,
  coins = 125680,
  rubies = 2450,
  diamonds = 1280,
  fishFound = 27,
  fishTotal = 40,
  onAvatarClick,
  onGiftClick,
  onTopUp,
}: Props) {
  const seed = avatar ?? nameSeed(name);
  const fmt = (n: number) =>
    n >= 100000 ? `${Math.round(n / 1000)}K` : n.toLocaleString("en-US");

  const items = [
    { key: "coins" as const, value: fmt(coins), label: "الذهب", art: coinImg },
    { key: "rubies" as const, value: fmt(rubies), label: "الياقوت", art: rubyImg },
    { key: "diamonds" as const, value: fmt(diamonds), label: "الألماس", art: diamondImg },
  ];

  return (
    <div className="tos-hud" dir="rtl">
      <button type="button" className="tos-medal" aria-label="حساب القبطان" onClick={onAvatarClick}>
        <svg className="tos-medal-ring" viewBox="0 0 36 36" aria-hidden="true">
          <circle cx="18" cy="18" r="16" className="tos-ring-bg" />
          <circle cx="18" cy="18" r="16" className="tos-ring-fg" strokeDasharray={`${progress * 100.5} 100.5`} />
        </svg>
        <CaptainAvatar seed={seed} url={avatarUrl} className="tos-medal-art" />
        <span className="tos-medal-lvl">{level}</span>
      </button>

      <div className="tos-mid">
        <span className="tos-name">{name}</span>
        <div className="tos-rail">
          {items.map((c) => (
            <button type="button" key={c.key} className="tos-res" aria-label={`شحن ${c.label}`} onClick={() => onTopUp?.(c.key)}>
              <img src={c.art} alt="" aria-hidden="true" />
              <b>{c.value}</b>
              <Plus className="tos-res-plus" aria-hidden="true" />
            </button>
          ))}
          <span className="tos-res tos-res-fish">
            <img src={fishImg} alt="" aria-hidden="true" />
            <b>{fishFound}/{fishTotal}</b>
          </span>
        </div>
      </div>

      <button type="button" className="tos-seal" aria-label="الهدايا" onClick={onGiftClick}>
        <Gift aria-hidden="true" />
      </button>
    </div>
  );
}
