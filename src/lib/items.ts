import { ACTION_ART } from "@/lib/art";
/** Weapons (raids / bombing) and hireable crews catalog. */

export type Currency = "coin" | "gem";

export type Weapon = {
  id: string;
  name: string;
  desc: string;
  power: number;
  price: number;
  currency: Currency;
  icon: string;
};

export type Crew = {
  id: string;
  name: string;
  desc: string;
  hours: number;
  price: number;
  currency: Currency;
  icon: string;
};

export const WEAPONS: Weapon[] = [
  { id: "rocket-s", name: "صاروخ صغير", desc: "ضرر خفيف على سفينة واحدة", power: 1, price: 2_500, currency: "coin", icon: "/__l5e/assets-v1/0af5d643-89f5-4102-8d86-94de97df7ce4/cat-weapon.png" },
  { id: "rocket-m", name: "صاروخ متوسط", desc: "يعطّل الشحنة لبعض الوقت", power: 3, price: 12_000, currency: "coin", icon: "/__l5e/assets-v1/0af5d643-89f5-4102-8d86-94de97df7ce4/cat-weapon.png" },
  { id: "rocket-l", name: "صاروخ كبير", desc: "ضرر عالٍ وسرقة أكبر", power: 6, price: 45_000, currency: "coin", icon: "/__l5e/assets-v1/0af5d643-89f5-4102-8d86-94de97df7ce4/cat-weapon.png" },
  { id: "rocket-vip", name: "صاروخ VIP", desc: "يتجاوز درع الحارس", power: 9, price: 120, currency: "gem", icon: "/__l5e/assets-v1/402ed8cd-d4cd-4291-a942-cdb84abbe4c1/skull.png" },
  { id: "nuke", name: "قنبلة ذرية", desc: "تدمير شامل لأسطول الخصم", power: 14, price: 400, currency: "gem", icon: "/__l5e/assets-v1/402ed8cd-d4cd-4291-a942-cdb84abbe4c1/skull.png" },
  { id: "ad-bomb", name: "قنبلة إعلانية", desc: "مجانية بعد مشاهدة إعلان", power: 2, price: 0, currency: "coin", icon: "/__l5e/assets-v1/772930b6-6633-4188-a545-3c2c59c65536/chest.png" },
];

export const CREWS: Crew[] = [
  { id: "sailor", name: "بحار", desc: "+10% سرعة الإبحار", hours: 5, price: 1_500, currency: "coin", icon: ACTION_ART.crew },
  { id: "luck", name: "حظ", desc: "+15% فرصة صيد نادر", hours: 5, price: 4_000, currency: "coin", icon: ACTION_ART.crew },
  { id: "guide", name: "مرشد", desc: "يكشف أفضل مناطق الصيد", hours: 8, price: 9_000, currency: "coin", icon: ACTION_ART.crew },
  { id: "thief", name: "لص", desc: "يسرق جزءًا من شحنة الخصم", hours: 4, price: 18_000, currency: "coin", icon: "/__l5e/assets-v1/402ed8cd-d4cd-4291-a942-cdb84abbe4c1/skull.png" },
  { id: "guard", name: "حارس", desc: "يحمي سفنك من الصواريخ", hours: 12, price: 60, currency: "gem", icon: "/__l5e/assets-v1/8d101928-f345-4cca-93ad-bbe297da60dc/cat-crew.png" },
  { id: "fix-s", name: "مصلح صغير", desc: "إصلاح 25% من الضرر", hours: 2, price: 2_000, currency: "coin", icon: "/__l5e/assets-v1/1392e852-5aa0-4d33-9df4-d653bb9d02db/act-dock.png" },
  { id: "fix-m", name: "مصلح متوسط", desc: "إصلاح 50% من الضرر", hours: 3, price: 7_500, currency: "coin", icon: "/__l5e/assets-v1/1392e852-5aa0-4d33-9df4-d653bb9d02db/act-dock.png" },
  { id: "fix-l", name: "مصلح كبير", desc: "إصلاح 80% من الضرر", hours: 4, price: 25_000, currency: "coin", icon: "/__l5e/assets-v1/1392e852-5aa0-4d33-9df4-d653bb9d02db/act-dock.png" },
  { id: "fix-legend", name: "مصلح أسطوري", desc: "إصلاح فوري كامل", hours: 1, price: 150, currency: "gem", icon: "/__l5e/assets-v1/8d101928-f345-4cca-93ad-bbe297da60dc/cat-crew.png" },
];

/* ── Protection gear (drع / تحصين) and gem bundles ──────── */

export type Armor = {
  id: string;
  name: string;
  desc: string;
  defense: number;
  price: number;
  currency: Currency;
};

export const ARMORS: Armor[] = [
  { id: "shield-wood", name: "درع خشبي", desc: "يمتص ضربة صاروخ صغير", defense: 2, price: 3_000, currency: "coin" },
  { id: "shield-iron", name: "درع حديدي", desc: "يقلّل الضرر بنسبة 35%", defense: 5, price: 15_000, currency: "coin" },
  { id: "shield-gold", name: "درع ذهبي", desc: "يقلّل الضرر بنسبة 60%", defense: 8, price: 60_000, currency: "coin" },
  { id: "tower-watch", name: "برج مراقبة", desc: "ينبّهك قبل الهجوم", defense: 4, price: 40, currency: "gem" },
  { id: "sea-mine", name: "حقل ألغام", desc: "يضرّ المهاجم تلقائيًا", defense: 7, price: 95, currency: "gem" },
  { id: "royal-barrier", name: "الحاجز الملكي", desc: "حصانة كاملة 12 ساعة", defense: 12, price: 260, currency: "gem" },
];

export type GemPack = {
  id: string;
  name: string;
  gems: number;
  bonus: number;
  vip: number;
  price: string;
};

export const GEM_PACKS: GemPack[] = [
  { id: "pack-s", name: "كيس جواهر", gems: 800, bonus: 0, vip: 1, price: "4.99$" },
  { id: "pack-m", name: "صندوق جواهر", gems: 2_500, bonus: 250, vip: 2, price: "14.99$" },
  { id: "pack-l", name: "خزنة جواهر", gems: 10_000, bonus: 1_500, vip: 3, price: "49.99$" },
  { id: "pack-xl", name: "كنز القبطان", gems: 20_000, bonus: 5_000, vip: 5, price: "99.99$" },
];
