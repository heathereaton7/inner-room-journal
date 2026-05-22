/**
 * Diamond Art palette helpers.
 *
 * Generates smooth color ramps and supports special gem properties:
 *   pearl: true    — iridescent gem render (extra shimmer + soft hue shift)
 *   sparkle: true  — extra-bright highlight + tiny star inside gem
 */

export function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex(r, g, b) {
  const to = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function blend(a, b, t) {
  const ca = hexToRgb(a), cb = hexToRgb(b);
  return rgbToHex(
    ca.r * (1 - t) + cb.r * t,
    ca.g * (1 - t) + cb.g * t,
    ca.b * (1 - t) + cb.b * t,
  );
}

/**
 * ramp(stops, n) — produce n colors smoothly blended through the given hex stops.
 * Example: ramp(['#000','#888','#fff'], 9) → 9 colors from black to white through grey.
 */
export function ramp(stops, n) {
  if (n <= 0) return [];
  if (n === 1) return [stops[0]];
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const pos = t * (stops.length - 1);
    const i0 = Math.floor(pos);
    const i1 = Math.min(stops.length - 1, i0 + 1);
    const localT = pos - i0;
    out.push(blend(stops[i0], stops[i1], localT));
  }
  return out;
}

/**
 * Build a palette entry array from hex colors with shared properties.
 * Returns objects with {id, hex, label, ...flags} — ids continue from startId.
 */
export function makeEntries(hexes, labelPrefix, startId, flags = {}) {
  return hexes.map((hex, i) => ({
    id: startId + i,
    hex,
    label: `${labelPrefix} ${i + 1}`,
    ...flags,
  }));
}

/**
 * Concatenate several entry arrays, renumbering ids sequentially starting at 1.
 */
export function joinPalette(...arrays) {
  let id = 1;
  const out = [];
  for (const arr of arrays) {
    for (const entry of arr) {
      out.push({ ...entry, id: id++ });
    }
  }
  return out;
}
