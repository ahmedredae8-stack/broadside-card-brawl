import type { WeaponsApi, WeaponId, Outcome, Pt } from "./WeaponsLayer";
// يحوّل حدث fire القادم من resolveRound (duel.js) إلى المقذوف المناسب على الشاشة.
export type Side = "a" | "b";
export type DuelHit = { side: Side; ship: number; spot: number; kind: "hit" | "miss" | "blocked" | "splash"; dmg: number; tags?: string[]; tier?: number; reflect?: { ship: number; dmg: number } };
export type DuelFireEvent = { t: "fire"; side: Side; ship: number; weapon: string; aim: { ship: number; spot: number }; hits: DuelHit[] };
export const SHIELD_COLORS: Record<number, string> = { 1: "#ffb04a", 2: "#79c8ff", 3: "#5dffb4", 4: "#c58cff", 5: "#ffe27a" };
export const SUPPORTED: string[] = ["cannon", "mortar", "missile", "torpedo", "fire_barrel", "frost_shell", "harpoon"];
export type PlayCtx = {
  layer: WeaponsApi;
  /** موضع خروج المقذوف من سفينة المهاجم بالبكسل داخل الطبقة. 'muzzle' فوق سطح السفينة، و'waterline' عند خط الماء بجانبها (للطوربيد). */
  launchPoint: (side: Side, ship: number, kind: "muzzle" | "waterline") => Pt;
  /** مركز مكان محدد (سفينة ومكان أ=0 أو ب=1) على شاشة المعركة بالبكسل. المركز لا خط الماء: المحرك يضيف عمق الهيكل للطوربيد. */
  spotCenter: (side: Side, ship: number, spot: number) => Pt;
  /** اختياري لكنه مهم للجمرة: مركز السفينة الحالي (مكانها الحالي أ أو ب) ليتبعها الحريق إن انتقلت. إن لم يُمرَّر يبقى الحريق في مكان الإصابة. */
  shipCenter?: (side: Side, ship: number) => Pt;
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
  // الجمرة: عند الإصابة تشتعل السفينة 3 جولات (الوسم "حرق" يأتي من duel.js). المفتاح "side:ship".
  const burn = W === "fire_barrel" && main && main.kind === "hit" && main.tags?.includes("حرق")
    ? { key: burnKey(main.side, main.ship), rounds: 3, track: () => ctx.shipCenter?.(main.side, main.ship) ?? to }
    : undefined;
  // الصقيع: عند الإصابة تتجمد السفينة (الوسم "تجميد"). والجليد يتحطم عند أي ضربة حركية تحمل الوسم "تحطّم ×2".
  const freeze = W === "frost_shell" && main && main.kind === "hit" && main.tags?.includes("تجميد")
    ? { key: burnKey(main.side, main.ship), track: () => ctx.shipCenter?.(main.side, main.ship) ?? to }
    : undefined;
  // الحربة: عند الإصابة تُثبَّت السفينة (الوسم "تثبيت") ويبقى الحبل مشدودًا بين فوهة المهاجم والهدف. والحبل يُسحب في الإخفاق والصدّ.
  const pin = W === "harpoon" && main && main.kind === "hit" && main.tags?.includes("تثبيت")
    ? { key: burnKey(main.side, main.ship), track: () => ctx.shipCenter?.(main.side, main.ship) ?? to }
    : undefined;
  const fromTrack = W === "harpoon" ? () => ctx.launchPoint(ev.side, ev.ship, "muzzle") : undefined;
  const shatterKey = main && main.tags?.includes("تحطّم ×2") ? burnKey(main.side, main.ship) : null;
  await ctx.layer.fire({
    weapon: W, from, to, outcome,
    ...(shieldColor !== undefined ? { shieldColor } : {}),
    ...(burn ? { burn } : {}),
    ...(freeze ? { freeze } : {}),
    ...(pin ? { pin } : {}),
    ...(fromTrack ? { fromTrack } : {}),
    onImpact: () => { if (shatterKey && W !== "missile") ctx.layer.shatter(shatterKey); ctx.onImpact?.(ev); },
    onMissileImpact: (i) => { if (shatterKey && i === 0) ctx.layer.shatter(shatterKey); ctx.onMissileImpact?.(i, ev); },
  });
}

export const burnKey = (side: Side, ship: number) => `${side}:${ship}`;
export type DuelBurnEvent = { t: "burn"; side: Side; ship: number; dmg: number };
/** حدث burn (بداية الجولة): نبضة لهب على السفينة المحترقة. يعيد الجولات المتبقية، وعند الصفر يُطفأ الحريق تلقائيًا بعد النبضة.
 *  أظهر رقم الحرق وحدّث الحياة أنت (ctx.onBurn) بعد نحو 0.35 ث من النبضة لتتزامن مع اللهب. */
export async function playBurnEvent(ev: DuelBurnEvent, ctx: Pick<PlayCtx, "layer" | "shipCenter"> & { onBurn?: (ev: DuelBurnEvent) => void }): Promise<void> {
  const key = burnKey(ev.side, ev.ship);
  ctx.layer.burnTick(key, ctx.shipCenter ? { track: () => ctx.shipCenter!(ev.side, ev.ship) } : undefined);
  await new Promise((r) => setTimeout(r, 350));
  ctx.onBurn?.(ev);
  await new Promise((r) => setTimeout(r, 250));
}
/** حدث dead: أطفئ الحريق فورًا (انفجار السفينة تعرضه أنت). */
export function playDeadFlames(side: Side, ship: number, layer: WeaponsApi) { layer.extinguish(burnKey(side, ship), "dead"); layer.thaw(burnKey(side, ship), "dead"); layer.unpin(burnKey(side, ship), "dead"); }
/** نفس الدالة بالاسم الأعم (تخمد الحريق وتزيل الجليد معًا). */
export const playDeadAuras = playDeadFlames;
/** حدث moveFail بسبب التجميد: ارتجاف ولمعان على الجليد. */
export function playMoveFail(ev: { side: Side; ship: number; reason: string }, layer: WeaponsApi) {
  if (ev.reason === "مجمّدة") layer.shiver(burnKey(ev.side, ev.ship));
  else if (ev.reason === "مثبّتة") layer.shiverPin(burnKey(ev.side, ev.ship));
}
/** بعد انتهاء كل أحداث الجولة: وفّق الجليد مع حالة اللعبة (state.frozen). المجمّدة تُغلَّف إن لم تكن مغلّفة، وغير المجمّدة يذوب جليدها. آمنة التكرار. */
export function syncIce(
  state: Record<Side, { ships: { alive: boolean; frozen: boolean }[] }>,
  ctx: Pick<PlayCtx, "layer" | "shipCenter">,
) {
  (["a", "b"] as Side[]).forEach((side) => state[side].ships.forEach((s, i) => {
    const key = burnKey(side, i), live = ctx.layer.frozen().includes(key);
    if (s.alive && s.frozen && !live) ctx.layer.freeze(key, { instant: true, ...(ctx.shipCenter ? { track: () => ctx.shipCenter!(side, i) } : {}) });
    else if (!(s.alive && s.frozen) && live) ctx.layer.thaw(key, s.alive ? "melt" : "dead");
  }));
}

/** بعد انتهاء أحداث الجولة: وفّق التثبيت (الحربة) مع حالة اللعبة. المثبّتة هي التي lock>0 وليست مجمّدة. آمنة التكرار.
 *  عند استعادة حالة محفوظة لا يُعرف من ثبّتها، فيُربط الحبل بفوهة أول سفينة خصم (ctx.launchPoint). */
export function syncPin(
  state: Record<Side, { ships: { alive: boolean; frozen: boolean; lock: number }[] }>,
  ctx: Pick<PlayCtx, "layer" | "shipCenter" | "launchPoint">,
) {
  (["a", "b"] as Side[]).forEach((side) => state[side].ships.forEach((s, i) => {
    const key = burnKey(side, i), live = ctx.layer.pinned().includes(key), want = s.alive && s.lock > 0 && !s.frozen;
    if (want && !live) ctx.layer.pin(key, { instant: true, ...(ctx.shipCenter ? { track: () => ctx.shipCenter!(side, i) } : {}), fromTrack: () => ctx.launchPoint(other(side), 0, "muzzle") });
    else if (!want && live) ctx.layer.unpin(key, s.alive ? "free" : "dead");
  }));
}
