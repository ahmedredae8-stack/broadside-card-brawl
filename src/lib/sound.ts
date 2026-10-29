/**
 * Game audio.
 *
 * Production hosting (Vercel) never gives us a "free" autoplay: the very first
 * play() call before a real user gesture is rejected and, in the old engine,
 * nothing ever retried — which is why the deployed build was silent. Here we
 * keep listening for *every* gesture until a track actually starts, and we
 * re-arm the unlock whenever playback gets suspended again.
 */

const SFX = {
  click: "/__l5e/assets-v1/9669eeec-80c7-4d9e-8938-27c72ca7a55c/click.mp3",
  hover: "/__l5e/assets-v1/0aaf5438-73e6-46d2-9ca7-f8c39e329279/hover.mp3",
  intro: "/__l5e/assets-v1/b2cdaf4f-0795-4729-94dc-cddf5056dfc2/intro.mp3",
} as const;

const AMBIENT = {
  waves: "/__l5e/assets-v1/61a7e14a-6f23-41fc-8b15-53e4707b214c/waves.mp3",
  night: "/__l5e/assets-v1/565a43e8-f72a-4665-bae1-200cdd861868/night.mp3",
  winter: "/__l5e/assets-v1/fefdf060-a188-4883-b458-bfcba1775f9d/winter.mp3",
  wall: "/__l5e/assets-v1/224ba656-e20b-49d2-ab6d-820e450e4a29/wall.mp3",
  spring: "/__l5e/assets-v1/661459e9-2e6a-4921-b42e-9fd3b145c168/spring.mp3",
  city: "/__l5e/assets-v1/e031da08-29ea-416d-a3b2-850fb745e020/city.mp3",
} as const;

export type SfxKey = keyof typeof SFX;
export type AmbientKey = keyof typeof AMBIENT;

const MUTE_KEY = "bay:muted";

let muted = false;
let initialised = false;
let listenersBound = false;
let unlockArmed = false;

const pools = new Map<SfxKey, HTMLAudioElement[]>();
const beds = new Map<AmbientKey, HTMLAudioElement>();

let currentBed: AmbientKey | null = null;
let currentVolume = 0.35;

function boot() {
  if (initialised || typeof window === "undefined") return;
  initialised = true;
  try {
    muted = window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    /* ignore */
  }
}

function pool(key: SfxKey, size = 4) {
  let list = pools.get(key);
  if (!list) {
    list = Array.from({ length: size }, () => {
      const a = new Audio(SFX[key]);
      a.preload = "auto";
      return a;
    });
    pools.set(key, list);
  }
  return list;
}

function bed(key: AmbientKey) {
  let el = beds.get(key);
  if (!el) {
    el = new Audio(AMBIENT[key]);
    el.loop = true;
    el.preload = "auto";
    el.volume = 0;
    beds.set(key, el);
  }
  return el;
}

/** Listen on every gesture type until a bed genuinely plays. */
function armUnlock() {
  if (unlockArmed || typeof window === "undefined") return;
  unlockArmed = true;
  const events = ["pointerdown", "touchstart", "keydown", "click"] as const;
  const release = () => {
    unlockArmed = false;
    events.forEach((e) => window.removeEventListener(e, handler));
  };
  const handler = () => {
    if (muted || !currentBed) {
      release();
      return;
    }
    const el = bed(currentBed);
    void el
      .play()
      .then(() => {
        fadeTo(el, currentVolume, 900);
        release();
      })
      .catch(() => {
        /* keep listening for the next gesture */
      });
  };
  events.forEach((e) => window.addEventListener(e, handler));
}

function fadeTo(el: HTMLAudioElement, target: number, ms: number) {
  const from = el.volume;
  const t0 = performance.now();
  const step = (t: number) => {
    const p = Math.min(1, (t - t0) / ms);
    el.volume = Math.max(0, Math.min(1, from + (target - from) * p));
    if (p < 1) requestAnimationFrame(step);
    else if (target === 0) el.pause();
  };
  requestAnimationFrame(step);
}

export function playSfx(key: SfxKey, volume = 0.6) {
  boot();
  if (typeof window === "undefined" || muted) return;
  bindLifecycle();
  const list = pool(key, key === "intro" ? 1 : 4);
  const a = list.find((x) => x.paused || x.ended) ?? list[0];
  if (!a) return;
  a.currentTime = 0;
  a.volume = volume;
  void a.play().catch(() => {});
}

/**
 * Switch the looping world bed. Crossfades away from whatever was playing, and
 * if the browser refuses to start it we wait for the next tap instead of
 * silently giving up.
 */
export function playAmbient(key: AmbientKey = "waves", volume = 0.35) {
  boot();
  if (typeof window === "undefined") return;
  bindLifecycle();
  currentVolume = volume;

  if (currentBed && currentBed !== key) {
    const prev = beds.get(currentBed);
    if (prev && !prev.paused) fadeTo(prev, 0, 700);
  }
  currentBed = key;
  if (muted) return;

  const el = bed(key);
  void el
    .play()
    .then(() => fadeTo(el, volume, 1400))
    .catch(() => armUnlock());
}

/** Backwards-compatible alias used across the game screens. */
export function startAmbient(volume = 0.35) {
  playAmbient(currentBed ?? "waves", volume);
}

export function stopAmbient() {
  beds.forEach((el) => {
    el.pause();
    el.currentTime = 0;
    el.volume = 0;
  });
}

/** Hard stop for every sound (tab hidden, sign-out, unload). */
export function stopAllSounds() {
  stopAmbient();
  pools.forEach((list) =>
    list.forEach((a) => {
      a.pause();
      a.currentTime = 0;
    }),
  );
}

function bindLifecycle() {
  if (listenersBound || typeof window === "undefined") return;
  listenersBound = true;
  window.addEventListener("pagehide", stopAllSounds);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") stopAllSounds();
    else if (!muted && currentBed) playAmbient(currentBed, currentVolume);
  });
}

export function isMuted() {
  boot();
  return muted;
}

export function setMuted(value: boolean) {
  boot();
  muted = value;
  try {
    window.localStorage.setItem(MUTE_KEY, value ? "1" : "0");
  } catch {
    /* ignore */
  }
  if (value) stopAllSounds();
  else if (currentBed) playAmbient(currentBed, currentVolume);
}
