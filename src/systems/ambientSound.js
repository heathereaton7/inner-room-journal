/**
 * Ambient Sound Manager — global singleton.
 *
 * Only one ambient track plays at a time across the entire app.
 * Handles fade-in / fade-out, looping, and mute state.
 *
 * The singleton state is stashed on `window.__irjAmbient` so multiple
 * modules can import this file and still share the same audio element.
 */

const G = typeof window !== "undefined" ? window : {};
if (!G.__irjAmbient) {
  G.__irjAmbient = { el: null, timer: null, id: null, target: 0 };
}
const _amb = G.__irjAmbient;

export function ambientPlay(src, { volume = 0.35, fadeMs = 2000, id = src } = {}) {
  if (_amb.id === id && _amb.el && !_amb.el.paused) return;
  ambientStop(0);
  try {
    const a = new Audio(src);
    a.loop = true;
    a.volume = 0;
    a.preload = "auto";
    _amb.el = a;
    _amb.id = id;
    _amb.target = volume;
    const promise = a.play();
    if (promise) promise.catch(() => {});
    clearInterval(_amb.timer);
    if (fadeMs <= 0) { a.volume = volume; return; }
    const step = volume / (fadeMs / 50);
    let v = 0;
    _amb.timer = setInterval(() => {
      v = Math.min(volume, v + step);
      if (_amb.el === a) a.volume = v;
      if (v >= volume) clearInterval(_amb.timer);
    }, 50);
  } catch (e) { /* audio not supported */ }
}

export function ambientStop(fadeMs = 2000) {
  const a = _amb.el;
  if (!a) return;
  clearInterval(_amb.timer);
  if (fadeMs <= 0) {
    a.pause(); try { a.src = ""; } catch (e) {}
    _amb.el = null; _amb.id = null; return;
  }
  const startVol = a.volume || _amb.target;
  const step = startVol / (fadeMs / 50);
  let v = startVol;
  _amb.timer = setInterval(() => {
    v = Math.max(0, v - step);
    a.volume = v;
    if (v <= 0) {
      clearInterval(_amb.timer);
      a.pause(); try { a.src = ""; } catch (e) {}
      if (_amb.el === a) { _amb.el = null; _amb.id = null; }
    }
  }, 50);
}

export function ambientMute() {
  if (_amb.el) { _amb.el.volume = 0; }
}
export function ambientUnmute() {
  if (_amb.el) { _amb.el.volume = _amb.target; }
}
export function ambientIsPlaying(id) {
  return _amb.id === id && _amb.el && !_amb.el.paused;
}
export function ambientCurrentId() {
  return _amb.el && !_amb.el.paused ? _amb.id : null;
}

/* ── Sound Library — central catalog of all ambient sounds ── */
export const SOUND_LIBRARY = [
  { id: "water-calm",   name: "Flowing Water", description: "Calm waterfall and river stones", src: "/slrathna-sleep-water-calm-317558.mp3", volume: 0.35, room: "Kitchen Window" },
  { id: "fire-crackle", name: "Fireplace",     description: "Crackling hearth and warm embers", src: "/red_refrigerator--225630.mp3",          volume: 0.30, room: "Cabin" },
  { id: "rain-light",   name: "Light Rain",    description: "Gentle rainfall on the windows",    src: "/rain-light.m4a",                       volume: 0.35, room: "Outside" },
  { id: "rain-heavy",   name: "Heavy Rain",    description: "Steady downpour and rolling rain",  src: "/rain-heavy.m4a",                       volume: 0.32, room: "Outside" },
  { id: "xmas-mistletoe",  name: "Don't Forget the Mistletoe", description: "Cozy Christmas melody by the fire", src: "/christmas-mistletoe.m4a",  volume: 0.40, room: "Christmas Cabin" },
  { id: "xmas-peppermint", name: "Peppermint Pieces",          description: "Sweet, twinkling seasonal tune",    src: "/christmas-peppermint.m4a", volume: 0.40, room: "Christmas Cabin" },
  { id: "xmas-seasonal",   name: "Seasonal League",            description: "Festive snowfall Christmas music",  src: "/christmas-seasonal.m4a",   volume: 0.40, room: "Christmas Cabin" },
];

export const AMBIENT_TRACKS = {
  "kitchen-window": SOUND_LIBRARY.find(s => s.id === "water-calm"),
};
