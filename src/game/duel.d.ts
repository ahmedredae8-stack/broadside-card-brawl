export type Side = "a" | "b";
export type Choice =
  | { type: "pass" }
  | { type: "attack"; ship: number; weapon: string; target: { ship: number; spot: number } }
  | { type: "shield"; ship: number; tier: number }
  | { type: "move"; ship: number };
export type DuelWeapon = { id: string; cd: number; used: boolean };
export type DuelShip = {
  id: number; hp: number; max: number; spot: number;
  shield: { tier: number; hits: number } | null;
  lock: number; frozen: boolean; burn: number; alive: boolean;
  weapons: DuelWeapon[];
};
export type DuelSide = { shields: number[]; ships: DuelShip[] };
export type DuelState = { round: number; first: Side; a: DuelSide; b: DuelSide; over: boolean; winner: Side | "draw" | null };
export type DuelHit = { side: Side; ship: number; spot: number; kind: "hit" | "miss" | "blocked" | "splash"; dmg: number; tags?: string[]; tier?: number; reflect?: { ship: number; dmg: number } };
export type DuelEvent =
  | { t: "burn"; side: Side; ship: number; dmg: number }
  | { t: "shield"; side: Side; ship: number; tier: number }
  | { t: "move"; side: Side; ship: number; spot: number }
  | { t: "moveFail"; side: Side; ship: number; reason: string }
  | { t: "fire"; side: Side; ship: number; weapon: string; aim: { ship: number; spot: number }; hits: DuelHit[] }
  | { t: "shieldBreak"; side: Side; ship: number }
  | { t: "dead"; side: Side; ship: number }
  | { t: "end"; winner: Side | "draw" };
export type SetupSide = { ships: { weapons: string[]; spot: number }[]; shields: number[] };
export const CFG: { rounds: number; decideSeconds: number; buildSeconds: number; shipHp: number; burnDamage: number; burnRounds: number };
export const WEAPONS: Record<string, { name: string; type: string; dmg: number; cd: number; aim: "spot" | "ship" | "all"; splash?: number }>;
export const SHIELDS: Record<number, { name: string; blocks: string[]; hits: number; reflect: number; ultimateHalf?: boolean }>;
export function newState(cfg: { first: Side; a: SetupSide; b: SetupSide }): DuelState;
export function attackerOf(s: DuelState): Side;
export function validate(state: DuelState, side: Side, ch: Choice | null): string | null;
export function resolveRound(state: DuelState, ch: { a: Choice; b: Choice }): { state: DuelState; events: DuelEvent[] };
export function mulberry(seed: number): () => number;
export function aiChoose(state: DuelState, side: Side, rnd: () => number): Choice;
