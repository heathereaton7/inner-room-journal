/**
 * Named anchor colors used to label auto-extracted palettes.
 *
 * For each extracted color, we find the nearest anchor by Euclidean RGB
 * distance and use its name (with the palette id as a suffix) so the swatch
 * list feels poetic rather than ID-soup.
 */

const ANCHORS = [
  // Whites & creams
  { name: 'Snow',         hex: '#FFFFFF' },
  { name: 'Cream',        hex: '#F5EFDC' },
  { name: 'Ivory',        hex: '#F0E6C8' },
  { name: 'Pearl',        hex: '#F4E8E8' },
  { name: 'Linen',        hex: '#F0E5D8' },
  // Greys
  { name: 'Mist',         hex: '#D8DCE0' },
  { name: 'Dove',         hex: '#B8BCC0' },
  { name: 'Stone',        hex: '#9A9890' },
  { name: 'Slate',        hex: '#6C7078' },
  { name: 'Iron',         hex: '#3A3E48' },
  { name: 'Charcoal',     hex: '#222428' },
  { name: 'Ink',          hex: '#0A0A10' },
  // Browns
  { name: 'Cocoa',        hex: '#5A3018' },
  { name: 'Cinnamon',     hex: '#8B4A28' },
  { name: 'Hazel',        hex: '#A87848' },
  { name: 'Tan',          hex: '#C8A878' },
  { name: 'Walnut',       hex: '#3A2010' },
  { name: 'Coffee',       hex: '#2A1810' },
  // Reds
  { name: 'Crimson',      hex: '#A01828' },
  { name: 'Ruby',         hex: '#C03048' },
  { name: 'Garnet',       hex: '#6A1020' },
  { name: 'Coral',        hex: '#E47868' },
  { name: 'Blush',        hex: '#F0B0AC' },
  { name: 'Rose',         hex: '#D88090' },
  // Pinks
  { name: 'Blossom',      hex: '#F8C8D0' },
  { name: 'Petal',        hex: '#F4A4B4' },
  { name: 'Mulberry',     hex: '#883850' },
  // Oranges
  { name: 'Marigold',     hex: '#E8902C' },
  { name: 'Amber',        hex: '#C87830' },
  { name: 'Peach',        hex: '#F4C898' },
  { name: 'Persimmon',    hex: '#D85820' },
  // Yellows
  { name: 'Honey',        hex: '#E8C04C' },
  { name: 'Gold',         hex: '#D4A848' },
  { name: 'Wheat',        hex: '#E8D88C' },
  { name: 'Sunshine',     hex: '#F5D858' },
  { name: 'Saffron',      hex: '#E8A828' },
  // Greens
  { name: 'Olive',        hex: '#807028' },
  { name: 'Sage',         hex: '#8FAA75' },
  { name: 'Moss',         hex: '#4A6A38' },
  { name: 'Fern',         hex: '#386830' },
  { name: 'Forest',       hex: '#1A3818' },
  { name: 'Emerald',      hex: '#108858' },
  { name: 'Mint',         hex: '#A8E0C8' },
  { name: 'Pine',         hex: '#284028' },
  // Blues
  { name: 'Sky',          hex: '#88B8E0' },
  { name: 'Azure',        hex: '#4080C8' },
  { name: 'Sapphire',     hex: '#2848A0' },
  { name: 'Cobalt',       hex: '#183870' },
  { name: 'Navy',         hex: '#0C1840' },
  { name: 'Indigo',       hex: '#202858' },
  { name: 'Teal',         hex: '#287080' },
  { name: 'Aqua',         hex: '#68C0C8' },
  { name: 'Twilight',     hex: '#3A3F78' },
  // Purples
  { name: 'Lavender',     hex: '#B098C0' },
  { name: 'Amethyst',     hex: '#603090' },
  { name: 'Plum',         hex: '#582858' },
  { name: 'Violet',       hex: '#7848B0' },
  // Special / atmospheric
  { name: 'Dusk',         hex: '#583890' },
  { name: 'Dawn',         hex: '#F4C9A8' },
  { name: 'Ember',        hex: '#B85028' },
  { name: 'Flame',        hex: '#F4C040' },
  { name: 'Shadow',       hex: '#181214' },
];

function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

// Pre-compute RGB for anchors once
const ANCHORS_RGB = ANCHORS.map(a => ({ ...a, ...hexToRgb(a.hex) }));

/**
 * nameColor(hex) — returns the closest anchor name by Euclidean RGB.
 */
export function nameColor(hex) {
  const { r, g, b } = hexToRgb(hex);
  let best = ANCHORS_RGB[0];
  let bestDist = Infinity;
  for (const a of ANCHORS_RGB) {
    const dr = r - a.r, dg = g - a.g, db = b - a.b;
    const d = dr * dr + dg * dg + db * db;
    if (d < bestDist) { bestDist = d; best = a; }
  }
  return best.name;
}
