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
  {
    id: 'builtin_beach_house',
    title: 'Beach Is My Happy Place',
    verse: 'He maketh me to lie down in green pastures: He leadeth me beside the still waters.',
    reference: 'Psalm 23:2',
    sourceUrl: '/beachhouse.png',
    // Reference card has the beach-house artwork as a wide banner at the top,
    // with the palette + symbol guide filling the bottom. Crop to top ~52%.
    cropFraction: { x: 0.0, y: 0.0, w: 1.0, h: 0.52 },
    defaultPreset: 'detailed',
  },

  /* ── Pexels-sourced photos (free for commercial use, no attribution required) ── */

  // Faith / Cross
  {
    id: 'builtin_three_crosses',
    title: 'Three Crosses',
    verse: 'For God so loved the world, that he gave his only begotten Son.',
    reference: 'John 3:16',
    sourceUrl: '/templates/cross_three.jpg',
    theme: 'faith',
    defaultPreset: 'detailed',
  },
  {
    id: 'builtin_cross_seashore',
    title: 'Cross by the Sea',
    verse: 'The Lord on high is mightier than the noise of many waters.',
    reference: 'Psalm 93:4',
    sourceUrl: '/templates/cross_seashore.jpg',
    theme: 'faith',
    defaultPreset: 'detailed',
  },

  // Cozy cabins
  {
    id: 'builtin_cabin_aframe',
    title: 'A-Frame in the Snow',
    verse: 'He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty.',
    reference: 'Psalm 91:1',
    sourceUrl: '/templates/cabin_aframe.jpg',
    theme: 'rest',
    defaultPreset: 'detailed',
  },
  {
    id: 'builtin_cabin_snow',
    title: 'Cabin in the Snowy Forest',
    verse: 'Though your sins be as scarlet, they shall be as white as snow.',
    reference: 'Isaiah 1:18',
    sourceUrl: '/templates/cabin_snow.jpg',
    theme: 'rest',
    defaultPreset: 'detailed',
  },
  {
    id: 'builtin_cabin_misty',
    title: 'Cabins in the Mist',
    verse: 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.',
    reference: 'Matthew 11:28',
    sourceUrl: '/templates/cabin_misty.jpg',
    theme: 'rest',
    defaultPreset: 'detailed',
  },

  // Nature
  {
    id: 'builtin_mountains_valley',
    title: 'Green Valley in the Mountains',
    verse: 'He maketh me to lie down in green pastures: he leadeth me beside the still waters.',
    reference: 'Psalm 23:2',
    sourceUrl: '/templates/mountains_valley.jpg',
    theme: 'nature',
    defaultPreset: 'detailed',
  },
  {
    id: 'builtin_ocean_golden',
    title: 'Calm Sea at Golden Hour',
    verse: 'Peace I leave with you, my peace I give unto you.',
    reference: 'John 14:27',
    sourceUrl: '/templates/ocean_golden.jpg',
    theme: 'nature',
    defaultPreset: 'detailed',
  },
  {
    id: 'builtin_wildflowers',
    title: 'Wildflower Meadow',
    verse: 'Consider the lilies of the field, how they grow; they toil not, neither do they spin.',
    reference: 'Matthew 6:28',
    sourceUrl: '/templates/wildflowers.jpg',
    theme: 'nature',
    defaultPreset: 'detailed',
  },

  // Motherhood
  {
    id: 'builtin_mother_flowers',
    title: 'Mother and Child in the Flowers',
    verse: 'Lo, children are an heritage of the Lord: and the fruit of the womb is his reward.',
    reference: 'Psalm 127:3',
    sourceUrl: '/templates/mother_flowers.jpg',
    theme: 'motherhood',
    defaultPreset: 'detailed',
  },

  /* ── Custom Canva-generated illustrations (with verse baked in) ── */
  {
    id: 'builtin_cabin_psalm91',
    title: 'Cabin at Twilight Glow',
    verse: 'He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty.',
    reference: 'Psalm 91:1',
    sourceUrl: '/templates/cabin_psalm91.png',
    theme: 'rest',
    defaultPreset: 'detailed',
  },
];

export function getBuiltinImageTemplate(id) {
  return BUILTIN_IMAGE_TEMPLATES.find(t => t.id === id) || null;
}

export function isBuiltinImageId(id) {
  return typeof id === 'string' && id.startsWith('builtin_');
}
