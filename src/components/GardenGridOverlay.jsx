import { useState, useMemo, useEffect, useCallback } from 'react';
import { SANS, DISPLAY, B } from '../constants.js';
import {
  DEFAULT_GRID_CONFIG, CELL_EMPTY, CELL_SOIL, CELL_PLANTED,
  getCell, placeSoil, plantSeed, waterCell, clearPlant,
} from '../systems/GardenGrid.js';
import { PLANTS, getPlantStage, isMature, isWatered } from '../systems/plants.js';
import { ITEMS } from '../items.js';

/**
 * GardenGridOverlay — renders the tile grid over the garden background.
 *
 * In edit mode: shows subtle grid guides, placement toolbar.
 * Outside edit mode: planted cells are tappable for watering / harvesting.
 * Always: renders soil + planted visuals integrated into the terrace.
 */

// Soil tile sprites — clean 384x384 RGBA with feathered edges
const SOIL_IMG = '/Plants/soil_tile.png';
const WATERED_SOIL_IMG = '/Plants/soil_tile_watered.png';

// Toolbar items the player can place
const TOOL_SOIL = 'soil';

export default function GardenGridOverlay({
  grid, setGrid, editMode, inventory, setInventory,
}) {
  const [selectedTool, setSelectedTool] = useState(null);
  const [tick, setTick] = useState(0);
  const [toast, setToast] = useState(null);
  const cfg = grid?.config || DEFAULT_GRID_CONFIG;

  // Re-render every 30 seconds so plant stages + watered state update visually.
  const hasPlants = grid?.cells?.some(c => c.type === CELL_PLANTED);
  useEffect(() => {
    if (!hasPlants) return;
    const id = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(id);
  }, [hasPlants]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(id);
  }, [toast]);

  // Available seed items from inventory
  const seedItems = useMemo(() => {
    if (!inventory) return [];
    return Object.entries(inventory)
      .filter(([id, qty]) => qty > 0 && ITEMS[id]?.gardenPlant)
      .map(([id, qty]) => ({ id, qty, ...ITEMS[id] }));
  }, [inventory]);

  // ── Handle cell tap (edit mode — placement) ──
  const onCellTapEdit = useCallback((row, col) => {
    if (!selectedTool) return;
    const cell = getCell(grid, row, col);
    if (!cell) return;

    if (selectedTool === TOOL_SOIL) {
      const next = placeSoil(grid, row, col);
      if (next) setGrid(next);
    } else {
      const item = ITEMS[selectedTool];
      if (!item?.gardenPlant) return;
      if ((inventory[selectedTool] || 0) < 1) return;
      const next = plantSeed(grid, row, col, item.gardenPlant);
      if (next) {
        setGrid(next);
        setInventory(prev => ({
          ...prev,
          [selectedTool]: (prev[selectedTool] || 1) - 1,
        }));
      }
    }
  }, [grid, selectedTool, inventory, setGrid, setInventory]);

  // ── Handle cell tap (non-edit — water / harvest) ──
  const onCellTapInteract = useCallback((row, col) => {
    const cell = getCell(grid, row, col);
    if (!cell || cell.type !== CELL_PLANTED || !cell.plantId) return;

    const plant = PLANTS[cell.plantId];
    if (!plant) return;
    const now = Date.now();

    // Priority 1: mature → harvest
    if (isMature(cell.plantId, cell.plantedAt, cell.wateredAt, now)) {
      const harvestId = plant.harvestItem;
      const next = clearPlant(grid, row, col);
      if (next) {
        setGrid(next);
        if (harvestId) {
          setInventory(prev => ({
            ...prev,
            [harvestId]: (prev[harvestId] || 0) + 1,
          }));
        }
        setToast({ msg: `Harvested ${plant.name}`, key: now });
      }
      return;
    }

    // Priority 2: not watered (or dried out) → water
    if (!isWatered(cell.wateredAt, now)) {
      const next = waterCell(grid, row, col);
      if (next) {
        setGrid(next);
        setToast({ msg: `Watered ${plant.name}`, key: now });
      }
    }
  }, [grid, setGrid, setInventory]);

  // ── Unified cell tap dispatcher ──
  const onCellTap = useCallback((row, col) => {
    if (editMode) {
      onCellTapEdit(row, col);
    } else {
      onCellTapInteract(row, col);
    }
  }, [editMode, onCellTapEdit, onCellTapInteract]);

  if (!grid) return null;

  const hasInteractable = hasPlants;

  return (
    <>
      {/* ── Grid cells layer ── */}
      <div style={{
        position: 'absolute',
        left: `${cfg.offsetX}%`,
        top: `${cfg.offsetY}%`,
        width: `${cfg.gridW}%`,
        height: `${cfg.gridH}%`,
        zIndex: editMode ? 15 : 10,
        pointerEvents: (editMode || hasInteractable) ? 'auto' : 'none',
      }}>
        {grid.cells.map((cell, i) => {
          const left = (cell.col / cfg.cols) * 100;
          const top = (cell.row / cfg.rows) * 100;
          const w = 100 / cfg.cols;
          const h = 100 / cfg.rows;
          const isEmpty = cell.type === CELL_EMPTY;
          const isSoil = cell.type === CELL_SOIL;
          const isPlanted = cell.type === CELL_PLANTED;

          const now = Date.now();
          const watered = isPlanted && isWatered(cell.wateredAt, now);
          const showWateredSoil = (isSoil || isPlanted) && watered;
          const tappableOutsideEdit = !editMode && isPlanted;
          const hasSoilOrPlant = isSoil || isPlanted;

          return (
            <div
              key={i}
              onClick={() => onCellTap(cell.row, cell.col)}
              style={{
                position: 'absolute',
                left: `${left}%`,
                top: `${top}%`,
                width: `${w}%`,
                height: `${h}%`,
                boxSizing: 'border-box',
                // Subtle dashed grid guides in edit mode — nearly invisible
                border: editMode
                  ? `1px dashed rgba(180,150,100,${isEmpty ? 0.10 : 0.18})`
                  : 'none',
                borderRadius: 0,
                // Gentle highlight on valid placement targets
                background: editMode && isEmpty && selectedTool === TOOL_SOIL
                  ? 'rgba(180,150,100,0.05)'
                  : editMode && isSoil && selectedTool && selectedTool !== TOOL_SOIL
                    ? 'rgba(90,138,106,0.06)'
                    : 'transparent',
                cursor: (editMode || tappableOutsideEdit) ? 'pointer' : 'default',
                pointerEvents: editMode ? 'auto'
                  : isPlanted ? 'auto'
                  : 'none',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                // Clip soil edges cleanly at cell boundary
                overflow: 'hidden',
              }}
            >
              {/* Soil sprite — snapped in edit mode, polished in play mode */}
              {hasSoilOrPlant && (() => {
                const soilFilter = showWateredSoil
                  ? 'brightness(0.78) saturate(1.15) drop-shadow(0 3px 4px rgba(0,0,0,0.18))'
                  : 'brightness(0.90) saturate(0.95) drop-shadow(0 3px 4px rgba(0,0,0,0.18))';

                // Edit mode: perfect grid alignment, no offsets, no filters
                if (editMode) {
                  return (
                    <img
                      src={showWateredSoil ? WATERED_SOIL_IMG : SOIL_IMG}
                      alt=""
                      draggable={false}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        pointerEvents: 'none',
                        opacity: 0.92,
                        filter: 'none',
                        transform: 'none',
                        transition: 'all 0.2s ease',
                        zIndex: 1,
                      }}
                    />
                  );
                }

                // Play mode: micro-offset + overscale + lighting for natural feel
                const seed = cell.row * 7 + cell.col * 13;
                const nudgeX = ((seed % 5) - 2) * 0.5;
                const nudgeY = ((seed % 3) - 1) * 0.8;
                return (
                  <img
                    src={showWateredSoil ? WATERED_SOIL_IMG : SOIL_IMG}
                    alt=""
                    draggable={false}
                    style={{
                      position: 'absolute',
                      inset: '-9%',
                      width: '118%',
                      height: '118%',
                      objectFit: 'contain',
                      pointerEvents: 'none',
                      opacity: 0.92,
                      filter: soilFilter,
                      transform: `translate(${nudgeX}px, ${nudgeY + 1}px)`,
                      transition: 'all 0.2s ease',
                      zIndex: 1,
                    }}
                  />
                );
              })()}

              {/* Plant growth visual */}
              {isPlanted && cell.plantId && (
                <PlantVisual
                  plantId={cell.plantId}
                  plantedAt={cell.plantedAt}
                  wateredAt={cell.wateredAt}
                  tick={tick}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Harvest / water toast ── */}
      {toast && (
        <div
          key={toast.key}
          style={{
            position: 'fixed',
            bottom: editMode ? 150 : 80,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 70,
            background: 'rgba(14,8,18,0.82)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(201,169,110,0.2)',
            borderRadius: 10,
            padding: '7px 18px',
            fontFamily: SANS,
            fontSize: '0.73rem',
            fontWeight: 500,
            color: B.goldL,
            animation: 'fadeUp 0.3s ease',
            whiteSpace: 'nowrap',
            letterSpacing: '0.01em',
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* ── Placement toolbar (edit mode only) ── */}
      {editMode && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 55,
          background: 'linear-gradient(to top, rgba(14,8,18,0.88), rgba(14,8,18,0.55) 75%, transparent)',
          padding: '32px 16px 22px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          animation: 'fadeUp 0.3s ease',
        }}>
          {/* Hint label */}
          <div style={{
            fontFamily: SANS,
            fontSize: '0.65rem',
            fontWeight: 400,
            color: 'rgba(220,200,255,0.3)',
            letterSpacing: '0.06em',
          }}>
            Tap a tile to place
          </div>

          {/* Tool slots */}
          <div style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'center',
          }}>
            {/* Soil tool */}
            <ToolSlot
              label="Soil"
              icon={<div style={{
                width: 26, height: 26, borderRadius: 5,
                background: 'linear-gradient(135deg, #8B6E4E, #5A3E1E)',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1)',
              }} />}
              selected={selectedTool === TOOL_SOIL}
              onTap={() => setSelectedTool(selectedTool === TOOL_SOIL ? null : TOOL_SOIL)}
              qty={null}
            />

            {/* Seed tools from inventory */}
            {seedItems.map(seed => (
              <ToolSlot
                key={seed.id}
                label={seed.name.replace(' Seeds', '')}
                icon={<span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{seed.emoji}</span>}
                selected={selectedTool === seed.id}
                onTap={() => setSelectedTool(selectedTool === seed.id ? null : seed.id)}
                qty={seed.qty}
              />
            ))}

            {/* Empty state if no seeds */}
            {seedItems.length === 0 && (
              <div style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px dashed rgba(180,150,100,0.15)',
                color: 'rgba(220,200,255,0.25)',
                fontFamily: SANS,
                fontSize: '0.65rem',
              }}>
                No seeds
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}


/* ── Plant sprite paths — clean transparent PNGs from sprite sheet ── */
const PLANT_SPRITES = {
  'timothy-hay': [
    '/Plants/timothy_stage_0.png',
    '/Plants/timothy_stage_1.png',
    '/Plants/timothy_stage_2.png',
    '/Plants/timothy_stage_3.png',
  ],
  'cilantro': [
    '/Plants/cilantro_stage_0.png',
    '/Plants/cilantro_stage_1.png',
    '/Plants/cilantro_stage_2.png',
    '/Plants/cilantro_stage_3.png',
  ],
};

/* ── PlantVisual — renders a plant sprite at its current growth stage ── */
function PlantVisual({ plantId, plantedAt, wateredAt, tick }) {
  const plant = PLANTS[plantId];
  if (!plant) return null;

  const now = Date.now();
  const stage = getPlantStage(plantId, plantedAt, wateredAt, now);
  const mature = stage >= plant.stages - 1;
  const watered = isWatered(wateredAt, now);
  const color = plant.stageColors[stage] || '#6B8E4E';

  const sprite = PLANT_SPRITES[plantId]?.[stage] || null;

  // Dry indicator: desaturation when unwatered and not seed/mature
  const isDry = !watered && stage > 0 && !mature;
  const dryFilter = isDry ? 'saturate(0.55) brightness(0.85)' : '';
  const shadowFilter = stage > 0 ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : '';
  const combinedFilter = [dryFilter, shadowFilter].filter(Boolean).join(' ') || 'none';

  // If sprite exists, render as image
  if (sprite) {
    return (
      <div style={{
        position: 'absolute',
        inset: '-5%',  // allow slight overflow for natural feel
        zIndex: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        animation: mature ? 'maturePulse 3s ease-in-out infinite' : 'none',
      }}>
        <style>{`
          @keyframes maturePulse {
            0%, 100% { filter: brightness(1); }
            50% { filter: brightness(1.12); }
          }
        `}</style>

        {/* Warm glow behind mature plants */}
        {mature && (
          <div style={{
            position: 'absolute',
            inset: '-20%',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color}30 0%, ${color}10 40%, transparent 70%)`,
            pointerEvents: 'none',
          }} />
        )}

        <img
          src={sprite}
          alt=""
          draggable={false}
          style={{
            width: '95%',
            height: '95%',
            objectFit: 'contain',
            pointerEvents: 'none',
            filter: combinedFilter,
            transition: 'filter 0.5s ease',
          }}
        />
      </div>
    );
  }

  // ── Fallback: procedural shapes if sprite missing ──
  const size = plant.stageSizes[stage] || 0.3;

  if (stage === 0) {
    return (
      <div style={{
        position: 'relative', zIndex: 2,
        width: `${size * 100}%`, height: `${size * 100}%`,
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 4px ${color}44`,
        transition: 'all 0.6s ease',
        filter: combinedFilter,
      }} />
    );
  }

  if (stage === 1) {
    return (
      <div style={{
        position: 'relative', zIndex: 2,
        width: `${size * 100}%`, height: `${size * 120}%`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-end',
        transition: 'all 0.6s ease', filter: combinedFilter,
      }}>
        <div style={{ display: 'flex', gap: 1, marginBottom: -1 }}>
          <div style={{ width: 6, height: 4, borderRadius: '50% 50% 0 50%', background: color, transform: 'rotate(-20deg)' }} />
          <div style={{ width: 6, height: 4, borderRadius: '50% 50% 50% 0', background: color, transform: 'rotate(20deg)' }} />
        </div>
        <div style={{ width: 2, height: '55%', background: `linear-gradient(to top, #6B5A3E, ${color})`, borderRadius: 1 }} />
      </div>
    );
  }

  if (stage === 2) {
    return (
      <div style={{
        position: 'relative', zIndex: 2,
        width: `${size * 100}%`, height: `${size * 110}%`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-end',
        transition: 'all 0.6s ease', filter: combinedFilter,
      }}>
        <div style={{ display: 'flex', gap: 0, marginBottom: -2 }}>
          <div style={{ width: 9, height: 6, borderRadius: '50% 50% 0 50%', background: color, transform: 'rotate(-25deg)', boxShadow: `0 0 4px ${color}33` }} />
          <div style={{ width: 9, height: 6, borderRadius: '50% 50% 50% 0', background: color, transform: 'rotate(25deg)', boxShadow: `0 0 4px ${color}33` }} />
        </div>
        <div style={{ display: 'flex', gap: 2, marginBottom: -1 }}>
          <div style={{ width: 7, height: 5, borderRadius: '50% 50% 0 50%', background: color, opacity: 0.8, transform: 'rotate(-35deg)' }} />
          <div style={{ width: 7, height: 5, borderRadius: '50% 50% 50% 0', background: color, opacity: 0.8, transform: 'rotate(35deg)' }} />
        </div>
        <div style={{ width: 3, height: '50%', background: `linear-gradient(to top, #5A4A2E, ${color})`, borderRadius: 1 }} />
      </div>
    );
  }

  // Stage 3 fallback — mature procedural
  return (
    <div style={{
      position: 'relative', zIndex: 2,
      width: `${size * 100}%`, height: `${size * 100}%`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'flex-end',
      transition: 'all 0.6s ease',
      animation: 'maturePulse 3s ease-in-out infinite',
    }}>
      <style>{`
        @keyframes maturePulse {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.12); }
        }
      `}</style>
      <div style={{ position: 'absolute', inset: '-30%', borderRadius: '50%', background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ width: '90%', height: '45%', borderRadius: '50% 50% 30% 30%', background: `radial-gradient(ellipse at 50% 40%, ${color}, ${color}CC)`, boxShadow: `0 0 8px ${color}44, inset 0 -2px 4px rgba(0,0,0,0.15)`, marginBottom: -2 }} />
      <div style={{ display: 'flex', gap: 1, marginBottom: -2 }}>
        <div style={{ width: 10, height: 7, borderRadius: '50% 50% 0 50%', background: color, opacity: 0.85, transform: 'rotate(-30deg)' }} />
        <div style={{ width: 10, height: 7, borderRadius: '50% 50% 50% 0', background: color, opacity: 0.85, transform: 'rotate(30deg)' }} />
      </div>
      <div style={{ width: 4, height: '35%', background: `linear-gradient(to top, #4A3A1E, ${color}AA)`, borderRadius: 2 }} />
    </div>
  );
}


/* ── ToolSlot — a single item in the placement toolbar ── */
function ToolSlot({ label, icon, selected, onTap, qty }) {
  return (
    <button
      onClick={onTap}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        padding: '8px 14px 6px',
        minWidth: 58,
        borderRadius: 12,
        border: selected
          ? '1px solid rgba(201,169,110,0.45)'
          : '1px solid rgba(180,150,100,0.10)',
        background: selected
          ? 'rgba(201,169,110,0.10)'
          : 'rgba(255,248,232,0.03)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        WebkitTapHighlightColor: 'transparent',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      {icon}
      <span style={{
        fontFamily: SANS,
        fontSize: '0.6rem',
        color: selected ? B.goldL : 'rgba(220,200,255,0.4)',
        fontWeight: selected ? 600 : 400,
        letterSpacing: '0.02em',
      }}>
        {label}
      </span>

      {qty !== null && qty !== undefined && (
        <span style={{
          position: 'absolute',
          top: -3,
          right: -3,
          background: selected ? 'rgba(201,169,110,0.85)' : 'rgba(180,150,100,0.6)',
          color: '#0E0812',
          fontSize: '0.5rem',
          fontWeight: 700,
          fontFamily: SANS,
          borderRadius: 7,
          padding: '1px 4px',
          minWidth: 13,
          textAlign: 'center',
          transition: 'background 0.2s',
        }}>
          {qty}
        </span>
      )}
    </button>
  );
}
