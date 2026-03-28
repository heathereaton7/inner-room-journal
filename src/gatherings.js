/**
 * Gatherings — Upper Room community spaces
 * Curated subject spaces for anonymous, faith-centered discussion.
 */

// ── Gathering Spaces (MVP — hardcoded, no Firestore collection needed yet) ──
export const GATHERING_SPACES = [
  { id: "prayer-requests",  name: "Prayer Requests",     icon: "pray",     description: "Lift up what's on your heart",              isSensitive: false },
  { id: "chronic-illness",  name: "Chronic Illness",      icon: "heart",    description: "For those carrying invisible weight",       isSensitive: true  },
  { id: "marriage-family",  name: "Marriage & Family",     icon: "home",     description: "Love, struggle, and growing together",      isSensitive: false },
  { id: "anxiety",          name: "Anxiety",               icon: "cloud",    description: "A safe place for anxious hearts",           isSensitive: true  },
  { id: "bible-questions",  name: "Bible Questions",       icon: "book",     description: "Ask, wonder, and learn together",           isSensitive: false },
  { id: "motherhood",       name: "Motherhood",            icon: "seedling", description: "The joys and weight of raising little ones",isSensitive: false },
  { id: "homestead-life",   name: "Homestead Life",        icon: "leaf",     description: "Simple living, rooted faith",               isSensitive: false },
  { id: "creative-corner",  name: "Creative Corner",       icon: "feather",  description: "Art, writing, music, and making",           isSensitive: false },
  { id: "testimonies",      name: "Testimonies",           icon: "flame",    description: "What God has done",                         isSensitive: false },
];

// ── Post Types ──
export const POST_TYPES = [
  { id: "question",       label: "Question" },
  { id: "vent",           label: "Vent" },
  { id: "testimony",      label: "Testimony" },
  { id: "advice",         label: "Advice Needed" },
  { id: "prayer",         label: "Prayer Request" },
  { id: "discussion",     label: "Discussion" },
];

// ── Supportive Reactions (not upvotes/downvotes) ──
export const REACTIONS = [
  { id: "relate",     label: "I Relate",       icon: "heart" },
  { id: "praying",    label: "Praying",        icon: "pray" },
  { id: "helpful",    label: "Helpful",        icon: "light" },
  { id: "encouraged", label: "Encouraged Me",  icon: "spark" },
  { id: "metoo",      label: "Me Too",         icon: "hand" },
];

// ── Anonymous Name Generator ──
// Per-user, globally stable. Warm, poetic, brand-fitting.
const ANON_ADJECTIVES = [
  "Quiet","Gentle","Bright","Soft","Still","Warm","Hidden","Tender",
  "Golden","Faithful","Humble","Rooted","Steady","Hopeful","Patient",
  "Wandering","Brave","Weary","Restful","Devoted","Little","Wild",
  "Peaceful","Trusting","Calm","Sunlit","Moonlit","Morning","Evening",
];

const ANON_NOUNS = [
  "Seed","Sparrow","Bloom","Lantern","River","Dove","Fern","Stone",
  "Candle","Meadow","Branch","Ember","Harbor","Pilgrim","Willow",
  "Robin","Pebble","Cloud","Stream","Garden","Feather","Moth",
  "Hearth","Well","Bridge","Path","Nest","Wren","Lily","Shore",
];

/**
 * Generate a stable anonymous name for a user.
 * Uses a simple hash of the userId to pick adjective + noun.
 * Same user always gets the same name.
 */
export function generateAnonName(userId) {
  if (!userId) return "Anonymous";
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
  }
  const adj = ANON_ADJECTIVES[Math.abs(hash) % ANON_ADJECTIVES.length];
  const noun = ANON_NOUNS[Math.abs(hash >> 8) % ANON_NOUNS.length];
  return `${adj}${noun}`;
}

/**
 * Generate search tokens from text.
 * Lowercase words from title + body + tags for client-side matching.
 */
export function makeSearchTokens(title, body, tags, postType, spaceName) {
  const all = [title, body, postType, spaceName, ...(tags || [])].filter(Boolean).join(" ");
  return [...new Set(all.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 2))];
}
