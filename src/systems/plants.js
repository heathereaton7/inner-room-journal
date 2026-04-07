/**
 * Plants — registry of all plantable crops for the garden system.
 *
 * Each plant defines its growth behavior, visual stages, and what
 * seed item ID it corresponds to in the ITEMS registry.
 *
 * Growth is time-based BUT gated by watering:
 *   - Growth only progresses while the plant is watered
 *   - Watering lasts WATER_WINDOW_MS (4 hours) before drying out
 *   - Unwatered plants pause at their current stage (no reset)
 *   - Stage count is always 4: seed(0) → sprout(1) → growing(2) → mature(3)
 *   - Each stage lasts an equal fraction of growTimeMs of *watered* time
 */

// ── Watering constants ──────────────────────────────────────────
export const WATER_WINDOW_MS = 4 * 60 * 60 * 1000; // 4 hours

export const PLANTS = {
  'timothy-hay': {
    name: 'Timothy Hay',
    seedItem: 'timothy_hay_seed',   // key in ITEMS registry
    harvestItem: 'timothy_hay',     // what you get when harvested (future)
    growTimeMs: 2 * 60 * 60 * 1000, // 2 hours to full maturity
    stages: 4,                       // seed(0) → sprout(1) → growing(2) → mature(3)
    category: 'hay',
    description: 'A soft, fragrant grass. Rabbits love it.',
    // Placeholder stage colors — will be replaced with art later
    stageColors: ['#8B7355', '#6B8E4E', '#4A7A2E', '#3D6B1E'],
    stageSizes:  [0.2, 0.45, 0.7, 1.0], // scale relative to cell
    // Stage labels for UI (future)
    stageNames: ['Seed', 'Sprout', 'Growing', 'Mature'],
  },
  'cilantro': {
    name: 'Cilantro',
    seedItem: 'cilantro_seed',
    harvestItem: 'cilantro_herb',
    growTimeMs: 3 * 60 * 60 * 1000, // 3 hours
    stages: 4,
    category: 'herb',
    description: 'A bright, fragrant herb. Rabbits enjoy it as a treat.',
    stageColors: ['#8B7355', '#7BA05B', '#5C9A3A', '#3A8520'],
    stageSizes:  [0.2, 0.45, 0.7, 1.0],
    stageNames: ['Seed', 'Sprout', 'Growing', 'Mature'],
  },
};

/**
 * Check if a plant is currently watered (within the water window).
 */
export function isWatered(wateredAt, now = Date.now()) {
  if (!wateredAt) return false;
  return (now - wateredAt) < WATER_WINDOW_MS;
}

/**
 * Get the current growth stage of a plant (0-based index).
 *
 * Growth is gated by watering:
 *   - Only time spent while watered counts toward growth
 *   - We calculate "effective grow time" as the overlap between
 *     the watering window and the time since planting
 *   - If never watered, plant stays at stage 0
 *   - If watering expired, growth pauses at whatever stage it reached
 *
 * The model is simplified: we track a single wateredAt timestamp
 * (the most recent watering). Each watering contributes up to
 * WATER_WINDOW_MS of growth time. The cell also stores plantedAt
 * which anchors the timeline.
 *
 * For accurate multi-watering accumulation, we store the total
 * effective grow time as `grownMs` on the cell. Each watering
 * session adds its contribution. But for Phase 4 simplicity,
 * we compute it from wateredAt alone — one watering gives up to
 * 4 hours of growth. Re-watering resets the window.
 *
 * @param {string} plantId
 * @param {number} plantedAt — timestamp when planted
 * @param {number|null} wateredAt — timestamp when last watered
 * @param {number} now
 * @returns {number} stage index (0 to stages-1)
 */
export function getPlantStage(plantId, plantedAt, wateredAt, now = Date.now()) {
  const plant = PLANTS[plantId];
  if (!plant || !plantedAt) return 0;
  if (!wateredAt) return 0; // never watered = stays at seed

  const maxStage = plant.stages - 1;

  // Calculate how much growth time this watering session contributes.
  // Watering at time W means growth runs from W to min(W + WINDOW, now).
  const waterEnd = Math.min(wateredAt + WATER_WINDOW_MS, now);
  const effectiveGrowMs = Math.max(0, waterEnd - wateredAt);

  // Map effective time to stage
  const stageProgress = effectiveGrowMs / plant.growTimeMs;
  const stage = Math.min(maxStage, Math.floor(stageProgress * plant.stages));

  return stage;
}

/**
 * Get growth progress as a 0-1 fraction within the CURRENT stage.
 * Useful for smooth visual interpolation between stage visuals.
 */
export function getStageProgress(plantId, plantedAt, wateredAt, now = Date.now()) {
  const plant = PLANTS[plantId];
  if (!plant || !plantedAt) return 0;

  const stageLength = plant.growTimeMs / plant.stages;
  const currentStage = getPlantStage(plantId, plantedAt, wateredAt, now);
  const maxStage = plant.stages - 1;

  if (currentStage >= maxStage) return 1;

  // Effective grow time (same calc as getPlantStage)
  if (!wateredAt) return 0;
  const waterEnd = Math.min(wateredAt + WATER_WINDOW_MS, now);
  const effectiveGrowMs = Math.max(0, waterEnd - wateredAt);

  const stageStart = currentStage * stageLength;
  return Math.min(1, (effectiveGrowMs - stageStart) / stageLength);
}

/**
 * Check if a plant has reached its final growth stage.
 */
export function isMature(plantId, plantedAt, wateredAt, now = Date.now()) {
  const plant = PLANTS[plantId];
  if (!plant || !plantedAt) return false;
  return getPlantStage(plantId, plantedAt, wateredAt, now) >= plant.stages - 1;
}

/** Look up a plant config by its seed item ID */
export function getPlantBySeed(seedItemId) {
  return Object.entries(PLANTS).find(([, p]) => p.seedItem === seedItemId) || null;
}
