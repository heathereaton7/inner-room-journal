/**
 * Built-in image templates — high-quality reference images shipped with the
 * app. The artwork is processed through the standard image-import pipeline
 * (sharpen → 80-color quantize → Floyd–Steinberg dither → sparkle detect)
 * the first time the user picks the tile. The result is cached as an
 * imported template so subsequent visits are instant.
 *
 * Cropping is supported for reference-card style images where the artwork
 * occupies only a portion of the source file.
 */

export const BUILTIN_IMAGE_TEMPLATES = [
  {
    id: 'builtin_cross_at_sunset',
    title: 'The Cross at Sunset',
    verse: 'And I, when I am lifted up from the earth, will draw all people to myself.',
    reference: 'John 12:32',
    sourceUrl: '/diamondart 2.png',
    // The reference card has artwork on the left (~58%) and palette/symbols on the right.
    // Crop to just the artwork square at the top-left.
    cropFraction: { x: 0.0, y: 0.0, w: 0.585, h: 0.86 },
    defaultPreset: 'detailed',  // 150×150 = 22,500 drills
  },
];

export function getBuiltinImageTemplate(id) {
  return BUILTIN_IMAGE_TEMPLATES.find(t => t.id === id) || null;
}

export function isBuiltinImageId(id) {
  return typeof id === 'string' && id.startsWith('builtin_');
}
