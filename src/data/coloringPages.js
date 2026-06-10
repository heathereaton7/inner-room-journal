/**
 * Coloring page library — tap-to-color "paint bucket" pages.
 *
 * Each page points to a black-and-white line-art PNG in /public. The art is
 * drawn on a canvas and the user flood-fills the enclosed white areas with the
 * glitter palette. Saved pictures are keyed by `id` (see app.jsx `coloring`).
 *
 * Pages are grouped into two collections by `category`: 'kids' (simpler art)
 * and 'adults' (intricate art). The Coloring screen shows a Kids / Adults
 * chooser first, then the pages for that collection.
 *
 * To add a page: drop the line art in `public/coloring pages/` and add an entry
 * here with the right `category`. `src` is URL-encoded so spaces in the
 * filename load correctly.
 */

export const COLORING_CATEGORIES = [
  { id: 'kids', label: 'Kids', blurb: 'Simple, playful pages to fill with color' },
  { id: 'adults', label: 'Adults', blurb: 'Intricate art for unhurried, restful coloring' },
];

export const COLORING_PAGES = [
  {
    id: 'campfire-companion',
    title: 'Campfire Companion',
    verse: 'A friend loves at all times, and a brother is born for a time of adversity.',
    reference: 'Proverbs 17:17',
    category: 'adults',
    src: encodeURI('/coloring pages/Campfire Companion.png'),
  },
  {
    id: 'poolside-paradise',
    title: 'Poolside Paradise',
    verse: 'This is the day the Lord has made; let us rejoice and be glad in it.',
    reference: 'Psalm 118:24',
    category: 'adults',
    src: encodeURI('/coloring pages/Poolside Paradise.png'),
  },
  {
    id: 'desert-snake',
    title: 'Desert Serpent',
    verse: 'You will tread on the lion and the cobra; you will trample the great lion and the serpent.',
    reference: 'Psalm 91:13',
    category: 'adults',
    src: encodeURI('/coloring pages/Desert Snake.png'),
  },
  {
    id: 'be-still-know',
    title: 'Be Still and Know',
    verse: 'Be still, and know that I am God.',
    reference: 'Psalm 46:10',
    category: 'adults',
    src: encodeURI('/coloring pages/Be Still and Know.png'),
  },
  {
    id: 'desert-camp',
    title: 'Desert Wandering',
    verse: 'See, I am doing a new thing!\u2026 I am making a way in the wilderness and streams in the wasteland.',
    reference: 'Isaiah 43:19',
    category: 'adults',
    src: encodeURI('/coloring pages/Desert Camp.png'),
  },
  {
    id: 'winnebago-adventure',
    title: 'Winnebago Adventure',
    verse: 'Be strong and courageous\u2026 for the Lord your God will be with you wherever you go.',
    reference: 'Joshua 1:9',
    category: 'adults',
    src: encodeURI('/coloring pages/Winnebago Adventure.png'),
  },
  {
    id: 'mountain-camper',
    title: 'Mountain Getaway',
    verse: 'I lift up my eyes to the mountains\u2014where does my help come from? My help comes from the Lord.',
    reference: 'Psalm 121:1-2',
    category: 'adults',
    src: encodeURI('/coloring pages/Mountain Camper Van.png'),
  },
  {
    id: 'garden-serene',
    title: 'Serene Garden',
    verse: 'Consider the lilies of the field, how they grow.',
    reference: 'Matthew 6:28',
    category: 'adults',
    src: encodeURI('/coloring pages/Serene Abundant Garden Scene.png'),
  },
  {
    id: 'sparrows-birdbath',
    title: 'Four Sparrows',
    verse: 'Are not two sparrows sold for a penny? Yet not one of them falls to the ground outside your Father\u2019s care.',
    reference: 'Matthew 10:29',
    category: 'adults',
    src: encodeURI('/coloring pages/Four Sparrows at the Birdbath.png'),
  },
  {
    id: 'cozy-nursery',
    title: 'Cozy Nursery',
    verse: 'Children are a heritage from the Lord, offspring a reward from him.',
    reference: 'Psalm 127:3',
    category: 'adults',
    src: encodeURI('/coloring pages/Cozy Nursery Nook.png'),
  },
  {
    id: 'quiet-hope',
    title: 'A Quiet Hope',
    verse: 'For this child I prayed, and the Lord has granted me what I asked of him.',
    reference: '1 Samuel 1:27',
    category: 'adults',
    src: encodeURI('/coloring pages/Bathroom Sink Stillness.png'),
  },
  {
    id: 'lakeside-cabin',
    title: 'Lakeside Cabin',
    verse: 'He makes me lie down in green pastures, he leads me beside quiet waters.',
    reference: 'Psalm 23:2',
    category: 'adults',
    src: encodeURI('/coloring pages/Lakeside Cabin Retreat.png'),
  },
  {
    id: 'loved-jesus-says-so',
    title: "I'm Loved",
    verse: 'See what great love the Father has lavished on us, that we should be called children of God!',
    reference: '1 John 3:1',
    category: 'adults',
    src: encodeURI('/coloring pages/Im Loved Jesus Says So.png'),
  },
];

export function getColoringPage(id) {
  return COLORING_PAGES.find(p => p.id === id);
}

export function getPagesByCategory(category) {
  return COLORING_PAGES.filter(p => p.category === category);
}
