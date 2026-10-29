import type { WeaponsApi, WeaponId, Outcome, Pt } from "./WeaponsLayer";
// يحوّل حدث fire القادم من resolveRound (duel.js) إلى المقذوف المناسب على الشاشة.
export type Side = "a" | "b";
export type DuelHit = { side: Side; ship: number; spot: number; kind: "hit" | "miss" | "blocked" | "splash"; dmg: number; tags?: string[]; tier?: number; reflect?: { ship: number; dmg: number } };
export type DuelFireEvent = { t: "fire"; side: Side; ship: number; weapon: string; aim: { ship: number; spot: number }; hits: DuelHit[] };
export const SHIELD_COLORS: Record<number, string> = { 1: "#ffb04a", 2: "#79c8ff", 3: "#5dffb4", 4: "#c58cff", 5: "#ffe27a" };
export const SUPPORTED: string[] = ["cannon", "mortar", "missile", "torpedo"];
export type PlayCtx = {
  layer: WeaponsApi;
  /** موضع خروج المقذوف من سفينة المهاجم بالبكسل داخل الطبقة. 'muzzle' فوق سطح السفينة، و'waterline' عند خط الماء بجانبها (للطوربيد). */
  launchPoint: (side: Side, ship: number, kind: "muzzle" | "waterline") => Pt;
  /** مركز مكان محدد (سفينة ومكان أ=0 أو ب=1) على شاشة المعركة بالبكسل. المركز لا خط الماء: المحرك يضيف عمق الهيكل للطوربيد. */
  spotCenter: (side: Side, ship: number, spot: number) => Pt;
  /** يُستدعى لحظة الاصطدام الفعلية: اخصم الحياة وأظهر الأرقام وفعّل حالة الدرع هنا. */
  onImpact?: (ev: DuelFireEvent) => void;
  /** للصواريخ فقط: عند كل صاروخ (اعرض −10 عنده). */
  onMissileImpact?: (index: number, ev: DuelFireEvent) => void;
  /** سلاح لم يصل بعد (الجمرة، الصقيع، الحربة، شمس الليل). الافتراضي: يُطبَّق الضرر فورًا بلا مؤثر. */
  onUnsupported?: (weapon: string, ev: DuelFireEvent) => Promise<void> | void;
};
const other = (s: Side): Side => (s === "a" ? "b" : "a");
export async function playFireEvent(ev: DuelFireEvent, ctx: PlayCtx): Promise<void> {
  if (!SUPPORTED.includes(ev.weapon)) { await ctx.onUnsupported?.(ev.weapon, ev); ctx.onImpact?.(ev); return; }
  const W = ev.weapon as WeaponId;
  const main = ev.hits[0];
  const defSide = main ? main.side : other(ev.side);
  const from = ctx.launchPoint(ev.side, ev.ship, W === "torpedo" ? "waterline" : "muzzle");
  // المدفع والهاون والطوربيد يسقطون في المكان المصوَّب عليه (حتى لو غادرته السفينة)، والصواريخ تتبع السفينة نفسها.
  const to = W === "missile" && main ? ctx.spotCenter(defSide, main.ship, main.spot) : ctx.spotCenter(defSide, ev.aim.ship, ev.aim.spot);
  const outcome: Outcome = main ? main.kind : "miss";
  const shieldColor = main && main.kind === "blocked" ? SHIELD_COLORS[main.tier ?? 1] : undefined;
  await ctx.layer.fire({
    weapon: W, from, to, outcome, shieldColor,
    onImpact: () => ctx.onImpact?.(ev),
    onMissileImpact: (i) => ctx.onMissileImpact?.(i, ev),
  });
}
