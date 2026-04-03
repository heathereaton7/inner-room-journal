/**
 * ITEMS — unified item registry for the entire game.
 *
 * Every item lives here. Inventory, room, market, and shop
 * all reference this single config. To add a new item:
 *   1. Add an entry here
 *   2. If placeable, add a PNG to /public/decor/ or /public/assets/furniture/
 *   3. Done — it automatically appears in the right systems
 *
 * Key fields:
 *   name        — display name
 *   emoji       — icon for UI
 *   category    — grouping ('furniture'|'decor'|'candles'|'seeds'|'crops'|'ingredients'|'cooked')
 *   placeable   — can this item be placed in the cabin? (default false)
 *   buyPrice    — cost to purchase (optional)
 *   sellPrice   — sell value (optional)
 *   currency    — 'candles'|'coins' (default 'coins')
 *   premium     — requires Inner Room Plus (optional)
 *   decor       — rendering config for placeable items: { src, width, filter, defaultPos, glow }
 */
export const ITEMS = {
  // ═══ ROOM DECOR (placeable, unlockable rewards) ═══
  candle: {
    name: 'A quiet flame', emoji: '\uD83D\uDD6F\uFE0F', category: 'decor',
    placeable: true,
    decor: {
      src: '/decor/candle.png', width: '18%',
      filter: 'brightness(1.15) saturate(1.2)',
      defaultPos: { left: 12, top: 28 },
      glow: { size: '28%', color: 'rgba(255,200,100,0.18)' },
    },
  },

  // ═══ SHOP FURNITURE (placeable, bought with candles) ═══
  prayer_chair:   { name: 'Wooden Prayer Chair',  emoji: '\u{1FA91}', category: 'furniture', buyPrice: 15, currency: 'candles', placeable: true, decor: { src: '/assets/furniture/prayer-chair.png',   width: '12%', defaultPos: { left: 8,  top: 62 } } },
  prayer_rug:     { name: 'Woven Prayer Rug',     emoji: '\uD83E\uDEB7', category: 'furniture', buyPrice: 10, currency: 'candles', placeable: true, decor: { src: '/assets/furniture/prayer-rug.png',     width: '18%', defaultPos: { left: 22, top: 78 } } },
  side_table:     { name: 'Rustic Side Table',     emoji: '\u{1FAB5}', category: 'furniture', buyPrice: 12, currency: 'candles', placeable: true, decor: { src: '/assets/furniture/side-table.png',     width: '10%', defaultPos: { left: 60, top: 60 } } },
  candle_cluster: { name: 'Candle Cluster',        emoji: '\uD83D\uDD6F\uFE0F', category: 'candles',   buyPrice: 8,  currency: 'candles', placeable: true, decor: { src: '/assets/furniture/candle-cluster.png', width: '8%',  defaultPos: { left: 62, top: 58 } } },
  lantern:        { name: 'Brass Lantern',         emoji: '\uD83C\uDFEE', category: 'candles',   buyPrice: 12, currency: 'candles', placeable: true, decor: { src: '/assets/furniture/brass-lantern.png',  width: '6%',  defaultPos: { left: 5,  top: 35 } } },
  string_lights:  { name: 'String Lights',         emoji: '\u2728', category: 'candles',   buyPrice: 20, currency: 'candles', placeable: true, decor: { src: '/assets/furniture/string-lights.png',  width: '50%', defaultPos: { left: 35, top: 15 } } },
  cross_wall:     { name: 'Wooden Cross',          emoji: '\u271D\uFE0F', category: 'decor',      buyPrice: 10, currency: 'candles', placeable: true, decor: { src: '/assets/furniture/wooden-cross.png',  width: '8%',  defaultPos: { left: 48, top: 25 } } },
  plant_pot:      { name: 'Potted Fern',           emoji: '\uD83C\uDF3F', category: 'decor',      buyPrice: 6,  currency: 'candles', placeable: true, decor: { src: '/assets/furniture/potted-fern.png',   width: '9%',  defaultPos: { left: 72, top: 65 } } },
  bookstack:      { name: 'Stack of Books',        emoji: '\uD83D\uDCDA', category: 'decor',      buyPrice: 8,  currency: 'candles', placeable: true, decor: { src: '/assets/furniture/book-stack.png',    width: '7%',  defaultPos: { left: 56, top: 63 } } },
  bible_open:     { name: 'Open Bible',            emoji: '\uD83D\uDCD6', category: 'decor',      buyPrice: 14, currency: 'candles', placeable: true, decor: { src: '/assets/furniture/open-bible.png',    width: '8%',  defaultPos: { left: 64, top: 56 } } },
  prayer_beads:   { name: 'Prayer Beads',          emoji: '\uD83D\uDCFF', category: 'decor',      buyPrice: 5,  currency: 'candles', placeable: true, decor: { src: '/assets/furniture/prayer-beads.png',  width: '6%',  defaultPos: { left: 70, top: 58 } } },
  tapestry:       { name: 'Woven Tapestry',        emoji: '\uD83D\uDDBC\uFE0F', category: 'decor',      buyPrice: 18, currency: 'candles', placeable: true, decor: { src: '/assets/furniture/woven-tapestry.png', width: '14%', defaultPos: { left: 15, top: 22 } } },
  // Premium furniture
  golden_frame:   { name: 'Golden Frame',          emoji: '\uD83D\uDDBC\uFE0F', category: 'decor',      buyPrice: 25, currency: 'candles', placeable: true, premium: true, decor: { src: '/assets/furniture/golden-frame.png',   width: '10%', defaultPos: { left: 40, top: 28 } } },
  silk_curtains:  { name: 'Silk Curtains',         emoji: '\uD83E\uDDE3', category: 'furniture', buyPrice: 30, currency: 'candles', placeable: true, premium: true, decor: { src: '/assets/furniture/silk-curtains.png',  width: '20%', defaultPos: { left: 30, top: 10 } } },
  incense_burner: { name: 'Incense Burner',        emoji: '\uD83E\uDD58', category: 'candles',   buyPrice: 20, currency: 'candles', placeable: true, premium: true, decor: { src: '/assets/furniture/incense-burner.png', width: '7%',  defaultPos: { left: 18, top: 58 } } },

  // ═══ ECONOMY — SEEDS ═══
  herb_seed:    { name: 'Herb Seeds',    emoji: '\uD83C\uDF3F', category: 'seeds',       buyPrice: 2,  sellPrice: 1,  currency: 'coins' },
  carrot_seed:  { name: 'Carrot Seeds',  emoji: '\uD83E\uDD55', category: 'seeds',       buyPrice: 3,  sellPrice: 1,  currency: 'coins' },
  onion_seed:   { name: 'Onion Seeds',   emoji: '\uD83E\uDDC5', category: 'seeds',       buyPrice: 3,  sellPrice: 1,  currency: 'coins' },
  potato_seed:  { name: 'Potato Seeds',  emoji: '\uD83E\uDD54', category: 'seeds',       buyPrice: 4,  sellPrice: 2,  currency: 'coins' },
  tomato_seed:  { name: 'Tomato Seeds',  emoji: '\uD83C\uDF45', category: 'seeds',       buyPrice: 5,  sellPrice: 2,  currency: 'coins' },
  wheat_seed:   { name: 'Wheat Seeds',   emoji: '\uD83C\uDF3E', category: 'seeds',       buyPrice: 4,  sellPrice: 2,  currency: 'coins' },
  lavender_seed:{ name: 'Lavender Seeds',emoji: '\uD83D\uDC9C', category: 'seeds',       buyPrice: 6,  sellPrice: 3,  currency: 'coins' },
  flax_seed:    { name: 'Flax Seeds',    emoji: '\uD83E\uDDF5', category: 'seeds',       buyPrice: 7,  sellPrice: 3,  currency: 'coins' },

  // ═══ ECONOMY — CROPS ═══
  herbs:        { name: 'Herbs',         emoji: '\uD83C\uDF3F', category: 'crops',       sellPrice: 3  },
  carrot:       { name: 'Carrot',        emoji: '\uD83E\uDD55', category: 'crops',       sellPrice: 5  },
  onion:        { name: 'Onion',         emoji: '\uD83E\uDDC5', category: 'crops',       sellPrice: 5  },
  potato:       { name: 'Potato',        emoji: '\uD83E\uDD54', category: 'crops',       sellPrice: 6  },
  tomato:       { name: 'Tomato',        emoji: '\uD83C\uDF45', category: 'crops',       sellPrice: 7  },
  wheat:        { name: 'Wheat',         emoji: '\uD83C\uDF3E', category: 'crops',       sellPrice: 4  },
  barley:       { name: 'Barley',        emoji: '\uD83C\uDF3E', category: 'crops',       sellPrice: 4  },
  grapes:       { name: 'Grapes',        emoji: '\uD83C\uDF47', category: 'crops',       sellPrice: 6  },
  figs:         { name: 'Figs',          emoji: '\uD83E\uDED0', category: 'crops',       sellPrice: 7  },
  olives:       { name: 'Olives',        emoji: '\uD83E\uDED2', category: 'crops',       sellPrice: 8  },
  pomegranates: { name: 'Pomegranates',  emoji: '\uD83C\uDF4E', category: 'crops',       sellPrice: 9  },
  dates:        { name: 'Dates',         emoji: '\uD83C\uDF34', category: 'crops',       sellPrice: 10 },
  saffron:      { name: 'Saffron',       emoji: '\u2728',       category: 'crops',       sellPrice: 15 },
  frankincense: { name: 'Frankincense',  emoji: '\uD83C\uDF32', category: 'crops',       sellPrice: 18 },
  myrrh:        { name: 'Myrrh',         emoji: '\u{1FAB5}',    category: 'crops',       sellPrice: 20 },
  lavender:     { name: 'Lavender',      emoji: '\uD83D\uDC9C', category: 'crops',       sellPrice: 12 },
  flax_fiber:   { name: 'Flax Fiber',    emoji: '\uD83E\uDDF5', category: 'crops',       sellPrice: 14 },

  // ═══ ECONOMY — INGREDIENTS ═══
  mushrooms:    { name: 'Mushrooms',     emoji: '\uD83C\uDF44', category: 'ingredients', buyPrice: 4,  sellPrice: 3,  currency: 'coins' },
  berries:      { name: 'Berries',       emoji: '\uD83E\uDED0', category: 'ingredients', buyPrice: 3,  sellPrice: 2,  currency: 'coins' },
  eggs:         { name: 'Eggs',          emoji: '\uD83E\uDD5A', category: 'ingredients', buyPrice: 5,  sellPrice: 4,  currency: 'coins' },
  milk:         { name: 'Milk',          emoji: '\uD83E\uDD5B', category: 'ingredients', buyPrice: 5,  sellPrice: 4,  currency: 'coins' },
  honey:        { name: 'Honey',         emoji: '\uD83C\uDF6F', category: 'ingredients', buyPrice: 8,  sellPrice: 6,  currency: 'coins' },
  wool:         { name: 'Wool',          emoji: '\uD83E\uDDF6', category: 'ingredients', sellPrice: 7  },
  feed:         { name: 'Feed',          emoji: '\uD83C\uDF3E', category: 'ingredients', buyPrice: 3,  sellPrice: 1,  currency: 'coins' },
  olive_oil:    { name: 'Olive Oil',     emoji: '\uD83E\uDED7', category: 'ingredients', sellPrice: 12 },
  lamp_oil:     { name: 'Lamp Oil',      emoji: '\uD83E\uDE94', category: 'ingredients', sellPrice: 10 },
  flour:        { name: 'Flour',         emoji: '\uD83C\uDF3E', category: 'ingredients', sellPrice: 6  },
  barley_flour: { name: 'Barley Flour',  emoji: '\uD83C\uDF3E', category: 'ingredients', sellPrice: 6  },
  dried_figs:   { name: 'Dried Figs',    emoji: '\uD83E\uDED8', category: 'ingredients', sellPrice: 10 },
  dried_dates:  { name: 'Dried Dates',   emoji: '\uD83E\uDED8', category: 'ingredients', sellPrice: 10 },
  raisins:      { name: 'Raisins',       emoji: '\uD83E\uDED0', category: 'ingredients', sellPrice: 8  },
  feathers:     { name: 'Feathers',      emoji: '\u{1FAB6}',    category: 'ingredients', sellPrice: 8  },
  transport:    { name: 'Transport',     emoji: '\uD83D\uDCE6', category: 'ingredients', sellPrice: 12 },

  // ═══ ECONOMY — COOKED FOODS ═══
  flatbread:          { name: 'Flatbread',          emoji: '\uD83E\uDED3', category: 'cooked', sellPrice: 12 },
  vegetable_soup:     { name: 'Vegetable Soup',     emoji: '\uD83C\uDF72', category: 'cooked', sellPrice: 15 },
  bread:              { name: 'Bread',              emoji: '\uD83C\uDF5E', category: 'cooked', sellPrice: 12 },
  roasted_vegetables: { name: 'Roasted Vegetables', emoji: '\uD83E\uDD58', category: 'cooked', sellPrice: 14 },
  stew:               { name: 'Stew',               emoji: '\uD83E\uDD58', category: 'cooked', sellPrice: 22 },
  honey_cake:         { name: 'Honey Cake',         emoji: '\uD83C\uDF70', category: 'cooked', sellPrice: 20 },
  fruit_salad:        { name: 'Fruit Salad',        emoji: '\uD83E\uDD57', category: 'cooked', sellPrice: 16 },
};

// ─── Helper Functions ─────────────────────────────────────────────

/** Get an item config by ID. Returns undefined if not found. */
export function getItem(id) {
  return ITEMS[id];
}

/** Check if an item is placeable in the cabin. */
export function isPlaceable(id) {
  return ITEMS[id]?.placeable === true;
}

/** Get all items matching a category. Returns array of [id, config] pairs. */
export function getItemsByCategory(...categories) {
  return Object.entries(ITEMS).filter(([, item]) => categories.includes(item.category));
}

/** Get all buyable items for a given currency. */
export function getBuyableItems(currency) {
  return Object.entries(ITEMS).filter(([, item]) => item.buyPrice && item.currency === currency);
}

/** Check if an item is owned (in inventory OR placed in room). */
export function isOwned(id, inventory, playerRoom) {
  return (inventory[id] || 0) > 0 || (playerRoom?.placed?.some(p => p.id === id) ?? false);
}

// ─── Backward Compatibility ───────────────────────────────────────
// These re-exports let existing code keep working during migration.
// Components that import SHOP_ITEMS or ITEM_CATALOG from constants.js
// should gradually switch to importing from items.js instead.

/** SHOP_ITEMS — legacy array format for backward compat */
export const SHOP_ITEMS = Object.entries(ITEMS)
  .filter(([, item]) => item.placeable && item.buyPrice && item.currency === 'candles' && !item.premium)
  .map(([id, item]) => ({
    id,
    name: item.name,
    emoji: item.emoji,
    cost: item.buyPrice,
    category: item.category,
    asset: item.decor?.src || '',
    pos: item.decor ? {
      top: `${item.decor.defaultPos?.top || 50}%`,
      left: `${item.decor.defaultPos?.left || 50}%`,
      width: item.decor.width || '8%',
    } : {},
  }));

/** PREMIUM_SHOP_ITEMS — legacy array format */
export const PREMIUM_SHOP_ITEMS = Object.entries(ITEMS)
  .filter(([, item]) => item.placeable && item.buyPrice && item.currency === 'candles' && item.premium)
  .map(([id, item]) => ({
    id,
    name: item.name,
    emoji: item.emoji,
    cost: item.buyPrice,
    category: item.category,
    asset: item.decor?.src || '',
    pos: item.decor ? {
      top: `${item.decor.defaultPos?.top || 50}%`,
      left: `${item.decor.defaultPos?.left || 50}%`,
      width: item.decor.width || '8%',
    } : {},
    premium: true,
  }));

/** ITEM_CATALOG — legacy keyed format */
export const ITEM_CATALOG = Object.fromEntries(
  Object.entries(ITEMS)
    .filter(([, item]) => !item.placeable)
    .map(([id, item]) => [id, {
      name: item.name,
      emoji: item.emoji,
      cat: item.category,
      ...(item.buyPrice ? { buyPrice: item.buyPrice } : {}),
      ...(item.sellPrice ? { sellPrice: item.sellPrice } : {}),
    }])
);
