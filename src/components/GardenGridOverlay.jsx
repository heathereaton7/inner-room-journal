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
 * In edit mode: shows grid lines, highlights cells, shows placement toolbar.
 * Outside edit mode: planted cells are tappable for watering / harvesting.
 * Always: renders soil + planted visuals on non-empty cells.
 *
 * Props:
 *   grid          — current grid state object
 *   setGrid       — state setter for grid (auto-saves)
 *   editMode      — boolean, whether placement toolbar is active
 *   inventory     — player inventory { itemId: qty }
 *   setInventory  — state setter for inventory (auto-saves)
 */

// Soil tile images
const SOIL_IMG = '/Plants/Freshly tilled soil tile.png';
const WATERED_SOIL_IMG = '/Plants/watered-soil.png';

// Toolbar items the player can place
const TOOL_SOIL = 'soil';

export default function GardenGridOverlay({
  grid, setGrid, editMode, inventory, setInventory,
}) {
  const [selectedTool, setSelectedTool] = useState(null);
  const [tick, setTick] = useState(0);
  const [toast, setToast] = useState(null); // {msg, key} for harvest/water feedback
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

  // Does the grid have any interactive planted cells? (for pointer events outside edit mode)
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
        // In edit mode: all cells tappable. Outside: only planted cells tappable.
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

          // Determine watered visual state
          const now = Date.now();
          const watered = isPlanted && isWatered(cell.wateredAt, now);
          const showWateredSoil = (isSoil || isPlanted) && watered;

          // Outside edit mode, only planted cells should capture taps
          const tappableOutsideEdit = !editMode && isPlanted;

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
                border: editMode
                  ? `1px solid rgba(201,169,110,${isEmpty ? 0.25 : 0.4})`
                  : 'none',
                borderRadius: editMode ? 3 : 0,
                background: editMode && isEmpty && selectedTool === TOOL_SOIL
                  ? 'rgba(201,169,110,0.08)'
                  : editMode && isSoil && selectedTool && selectedTool !== TOOL_SOIL
                    ? 'rgba(90,138,106,0.1)'
                    : 'transparent',
                cursor: (editMode || tappableOutsideEdit) ? 'pointer' : 'default',
                // Pass through taps on non-planted cells outside edit mode
                pointerEvents: editMode ? 'auto'
                  : isPlanted ? 'auto'
                  : 'none',
                transition: 'background 0.15s, border-color 0.15s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {/* Soil tile image — switches between dry and watered */}
              {(isSoil || isPlanted) && (
                <img
                  src={showWateredSoil ? WATERED_SOIL_IMG : SOIL_IMG}
                  alt=""
                  draggable={false}
                  style={{
                    position: 'absolute',
                    inset: '6%',
                    width: '88%',
                    height: '88%',
                    objectFit: 'cover',
                    borderRadius: 4,
                    opacity: 0.85,
                    pointerEvents: 'none',
                    filter: showWateredSoil
                      ? 'brightness(0.85) saturate(1.3)'
                      : 'brightness(0.95) saturate(1.1)',
                    transition: 'filter 0.5s ease',
                  }}
                />
              )}

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
            bottom: editMode ? 160 : 80,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 70,
            background: 'rgba(14,8,18,0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(201,169,110,0.3)',
            borderRadius: 12,
            padding: '8px 20px',
            fontFamily: SANS,
            fontSize: '0.75rem',
            fontWeight: 500,
            color: B.goldL,
            animation: 'fadeUp 0.3s ease',
            whiteSpace: 'nowrap',
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
          background: 'linear-gradient(to top, rgba(14,8,18,0.95), rgba(14,8,18,0.8) 70%, transparent)',
          padding: '40px 12px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          animation: 'fadeUp 0.3s ease',
        }}>
          <div style={{
            fontFamily: DISPLAY,
            fontSize: '0.72rem',
            color: 'rgba(220,200,255,0.4)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            Select and tap a tile to place
          </div>

          <div style={{
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            justifyContent: 'center',
            maxWidth: 360,
          }}>
            <ToolSlot
              label="Soil"
              icon={<div style={{ width: 28, height: 28, borderRadius: 4, background: '#6B4E2E', border: '2px solid #8B6E4E' }} />}
              selected={selectedTool === TOOL_SOIL}
              onTap={() => setSelectedTool(selectedTool === TOOL_SOIL ? null : TOOL_SOIL)}
              qty={null}
            />

            {seedItems.map(seed => (
              <ToolSlot
                key={seed.id}
                label={seed.name.replace(' Seeds', '')}
                icon={<span style={{ fontSize: '1.3rem' }}>{seed.emoji}</span>}
                selected={selectedTool === seed.id}
                onTap={() => setSelectedTool(selectedTool === seed.id ? null : seed.id)}
                qty={seed.qty}
              />
            ))}

            {seedItems.length === 0 && (
              <div style={{
                padding: '8px 14px',
                borderRadius: 8,
                background: 'rgba(255,248,232,0.04)',
                border: '1px dashed rgba(201,169,110,0.2)',
                color: 'rgba(220,200,255,0.3)',
                fontFamily: SANS,
                fontSize: '0.7rem',
              }}>
                No seeds in inventory
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}


/* ── Plant sprite paths (matched to actual filenames on disk) ── */
const PLANT_SPRITES = {
  'timothy-hay': [
    '/Plants/Timothy-Hay/timothystage0.png',
    '/Plants/Timothy-Hay/timothystage1.png',
    '/Plants/Timothy-Hay/timothystage2.png',
    '/Plants/Timothy-Hay/timothystage3.png',
  ],
  'cilantro': [
    '/Plants/Cilantro/Cilantro stage0.png',
    '/Plants/Cilantro/Cilantro stage 1.png',
    '/Plants/Cilantro/ cilantro stage 2 .png',
    '/Plants/Cilantro/cilantrostage3.png',
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

  // Resolve sprite — fallback to null if missing
  const sprite = PLANT_SPRITES[plantId]?.[stage] || null;

  // Dry indicator: desaturation when unwatered and not seed/mature
  const dryFilter = (!watered && stage > 0 && !mature)
    ? 'saturate(0.6) brightness(0.9)' : 'none';

  // If sprite exists, render as image with all existing effects preserved
  if (sprite) {
    return (
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        // Mature plants get the pulse animation
        animation: mature ? 'maturePulse 3s ease-in-out infinite' : 'none',
      }}>
        {mature && <style>{`
          @keyframes maturePulse {
            0%, 100% { filter: brightness(1); }
            50% { filter: brightness(1.15); }
          }
        `}</style>}

        {/* Glow behind mature plants */}
        {mature && (
          <div style={{
            position: 'absolute',
            inset: '-15%',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color}25 0%, transparent 65%)`,
            pointerEvents: 'none',
          }} />
        )}

        <img
          src={sprite}
          alt=""
          draggable={false}
          style={{
            width: '80%',
            height: '80%',
            objectFit: 'contain',
            pointerEvents: 'none',
            filter: dryFilter,
            transition: 'filter 0.5s ease',
            // Small drop shadow grounds the plant on the soil
            ...(stage > 0 ? { filter: `${dryFilter} drop-shadow(0 2px 3px rgba(0,0,0,0.25))`.replace('none ', '') } : {}),
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
        filter: dryFilter,
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
        transition: 'all 0.6s ease', filter: dryFilter,
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
        transition: 'all 0.6s ease', filter: dryFilter,
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
          50% { filter: brightness(1.15); }
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
        gap: 3,
        padding: '8px 12px 6px',
        minWidth: 64,
        borderRadius: 10,
        border: selected
          ? '1.5px solid rgba(201,169,110,0.6)'
          : '1px solid rgba(201,169,110,0.15)',
        background: selected
          ? 'rgba(201,169,110,0.12)'
          : 'rgba(255,248,232,0.04)',
        cursor: 'pointer',
        transition: 'all 0.15s',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {icon}
      <span style={{
        fontFamily: SANS,
        fontSize: '0.62rem',
        color: selected ? B.goldL : 'rgba(220,200,255,0.5)',
        fontWeight: selected ? 600 : 400,
      }}>
        {label}
      </span>

      {qty !== null && qty !== undefined && (
        <span style={{
          position: 'absolute',
          top: -4,
          right: -4,
          background: 'rgba(201,169,110,0.8)',
          color: '#0E0812',
          fontSize: '0.55rem',
          fontWeight: 700,
          fontFamily: SANS,
          borderRadius: 8,
          padding: '1px 5px',
          minWidth: 14,
          textAlign: 'center',
        }}>
          {qty}
        </span>
      )}
    </button>
  );
}
