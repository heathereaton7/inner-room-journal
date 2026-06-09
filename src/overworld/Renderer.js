import { WORLD_W, WORLD_H } from './constants.js';
import { AVATAR_NAV } from '../constants.js';
import { resolveSprite, SPRITES } from './sprites.js';

// ─── Tap markers (tap/pan navigation) ──────────────────────────────
// Soft pulsing rings drawn at each enterable location so the user knows
// where to tap when there is no walking avatar. Set per map.
let _tapMarkers = []; // [{cx, cy, radius}]
export function setTapMarkers(list) { _tapMarkers = list || []; }

// ─── Map Background Layers ─────────────────────────────────────────
// Multiple map images stacked vertically to form one seamless world.
const _mapLayers = []; // [{img, worldYStart, worldYEnd, imgH}]

// Current map scale (updated when map changes)
let _mapScale = 3;

/**
 * Load an array of map artwork images and stack them vertically.
 * @param {string[]} sources — array of image URLs, top to bottom
 * @param {number} [scale=3] — how much to scale each image
 * @returns {Promise<object[]>} resolved layer data
 */
export function loadMapImages(sources, scale) {
  if (scale != null) _mapScale = scale;
  return Promise.all(
    sources.map(src =>
      new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => {
          console.warn('[Renderer] Failed to load map layer:', src);
          resolve(null);
        };
        img.src = src;
      })
    )
  ).then(images => {
    _mapLayers.length = 0;
    let yOffset = 0;
    for (const img of images) {
      if (!img) continue;
      const worldH = img.height * _mapScale;
      _mapLayers.push({
        img,
        worldYStart: yOffset,
        worldYEnd: yOffset + worldH,
        imgH: img.height,
        imgW: img.width,
      });
      yOffset += worldH;
    }
    console.log(`[Renderer] Loaded ${_mapLayers.length} map layers (scale ${_mapScale}), total height: ${yOffset}px`);
    return _mapLayers;
  });
}

// ─── Player Sprite Cache ──────────────────────────────────────────
// Cache: { '/character-sprite.png': { img, frameW, frameH, cols, rows, dirRow } }
const _spriteCache = {};
let _activeSprite = null;  // current cache entry being drawn

/**
 * Load (or retrieve from cache) a player spritesheet and set it active.
 * @param {object} spriteConfig — from sprites.js resolveSprite()
 * @returns {Promise<HTMLImageElement|null>}
 */
export function loadPlayerSprite(spriteConfig) {
  const { src, cols = 4, rows = 4, dirRow } = spriteConfig;

  // Already cached — activate instantly (no flicker)
  if (_spriteCache[src]) {
    _activeSprite = _spriteCache[src];
    return Promise.resolve(_activeSprite.img);
  }

  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const entry = {
        img,
        frameW: img.width / cols,
        frameH: img.height / rows,
        cols, rows,
        dirRow: dirRow || { down: 0, left: 2, right: 1, up: 3 },
      };
      _spriteCache[src] = entry;
      _activeSprite = entry;
      console.log(`[Renderer] Sprite loaded: ${src} (${entry.frameW}x${entry.frameH} per frame)`);
      resolve(img);
    };
    img.onerror = () => {
      console.warn('[Renderer] Failed to load sprite:', src);
      resolve(null);
    };
    img.src = src;
  });
}

/**
 * Preload a spritesheet into cache without activating it.
 */
export function preloadSprite(spriteConfig) {
  const { src, cols = 4, rows = 4, dirRow } = spriteConfig;
  if (_spriteCache[src]) return Promise.resolve();
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      _spriteCache[src] = {
        img,
        frameW: img.width / cols,
        frameH: img.height / rows,
        cols, rows,
        dirRow: dirRow || { down: 0, left: 2, right: 1, up: 3 },
      };
      resolve();
    };
    img.onerror = () => resolve();
    img.src = src;
  });
}

// ─── Ambient Fireflies ─────────────────────────────────────────────
let fireflies = [];
let ffTime = 0;

// Current world bounds for fireflies
let _worldW = WORLD_W;
let _worldH = WORLD_H;

/** Update renderer world bounds (called when map changes). */
export function setRendererWorldSize(w, h) {
  _worldW = w;
  _worldH = h;
}

// Pre-computed color strings for firefly rendering (avoids per-frame string allocation)
const _ffGlowColors = [];
const _ffCoreColors = [];
for (let i = 0; i <= 100; i++) {
  const a = i / 100;
  _ffGlowColors[i] = `rgba(255,220,100,${(a * 0.08).toFixed(3)})`;
  _ffCoreColors[i] = `rgba(255,235,150,${a.toFixed(2)})`;
}

export function initFireflies(count = 50) {
  fireflies = [];
  for (let i = 0; i < count; i++) {
    fireflies.push({
      wx: Math.random() * _worldW,
      wy: Math.random() * _worldH,
      size: Math.random() * 1.5 + 0.8,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.003 + 0.001,
      sx: (Math.random() - 0.5) * 0.3,
      sy: (Math.random() - 0.5) * 0.2,
    });
  }
}

// ─── Object Image Cache ───────────────────────────────────────────
const _objCache = {}; // { src → Image }

function _getObjImage(src) {
  if (_objCache[src]) return _objCache[src];
  const img = new Image();
  img.src = src;
  img.onload = () => { _objCache[src] = img; };
  _objCache[src] = img; // store immediately (draws once loaded)
  return img;
}

// Active objects list (set when map changes)
let _mapObjects = [];

/** Set the current map's object list (called by MapManager/OverworldScreen). */
export function setMapObjects(objects) {
  _mapObjects = objects || [];
  // Pre-cache all object images
  for (const obj of _mapObjects) {
    if (obj.src) _getObjImage(obj.src);
  }
}

function _drawObject(ctx, camera, obj) {
  const img = _objCache[obj.src];
  if (!img || !img.complete || !img.naturalWidth) {
    // Fallback: draw a tinted rectangle placeholder
    const { sx, sy } = camera.worldToScreen(obj.x, obj.y);
    ctx.fillStyle = obj.color || 'rgba(80,60,40,0.6)';
    ctx.fillRect(sx, sy, obj.w, obj.h);
    // Label
    if (obj.label) {
      ctx.fillStyle = 'rgba(255,240,200,0.5)';
      ctx.font = "600 10px 'DM Sans', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText(obj.label, sx + obj.w / 2, sy + obj.h / 2 + 4);
    }
    return;
  }
  const { sx, sy } = camera.worldToScreen(obj.x, obj.y);
  ctx.drawImage(img, sx, sy, obj.w, obj.h);
}

// ─── Main Render Function ──────────────────────────────────────────

/**
 * Draw the entire scene to the canvas.
 * Render order: map bg → fireflies → objects behind player → player → objects in front → prompts
 */
export function render(ctx, grid, camera, player, zones, dt) {
  const { viewW, viewH } = camera;
  ctx.clearRect(0, 0, viewW, viewH);

  // ── Map background artwork (stacked layers) ──
  if (_mapLayers.length > 0) {
    ctx.imageSmoothingEnabled = true;
    if (ctx.imageSmoothingQuality) ctx.imageSmoothingQuality = 'high';

    const camTop = camera.y;
    const camBottom = camera.y + viewH;

    for (const layer of _mapLayers) {
      if (camTop >= layer.worldYEnd || camBottom <= layer.worldYStart) continue;

      const relY = camTop - layer.worldYStart;
      const sx = Math.max(0, camera.x / _mapScale);
      const sy = Math.max(0, relY / _mapScale);
      const sw = Math.min(viewW / _mapScale, layer.imgW - sx);
      const sh = Math.min(
        (viewH - Math.max(0, layer.worldYStart - camTop)) / _mapScale,
        layer.imgH - sy
      );

      if (sw <= 0 || sh <= 0) continue;

      const dx = Math.max(0, (sx * _mapScale - camera.x));
      const dy = Math.max(0, layer.worldYStart - camTop);
      const dw = sw * _mapScale;
      const dh = sh * _mapScale;

      ctx.drawImage(layer.img, sx, sy, sw, sh, dx, dy, dw, dh);
    }
  } else {
    ctx.fillStyle = '#0A0806';
    ctx.fillRect(0, 0, viewW, viewH);
  }

  // ── Ambient fireflies ──
  ffTime += dt;
  _drawFireflies(ctx, camera, dt);

  // ── Z-sorted rendering: objects + player ──
  // Player's z-base is their feet position (y)
  const playerZ = player.y;

  // Draw objects BEHIND the player (player is in front of them)
  for (const obj of _mapObjects) {
    if (obj.zBase > playerZ) _drawObject(ctx, camera, obj);
  }

  // Draw player (only when avatar navigation is enabled)
  if (AVATAR_NAV) _drawPlayer(ctx, camera, player);

  // Draw objects IN FRONT of the player (player is behind them)
  for (const obj of _mapObjects) {
    if (obj.zBase <= playerZ) _drawObject(ctx, camera, obj);
  }

  // ── Tap markers (shown instead of avatar for tap/pan navigation) ──
  if (!AVATAR_NAV) _drawTapMarkers(ctx, camera);

  // ── Interaction prompt ──
  if (AVATAR_NAV && zones.nearbyZone) {
    _drawInteractionPrompt(ctx, camera, zones.nearbyZone);
  }
}

// ─── Tap markers ───────────────────────────────────────────────────
// Soft pulsing gold rings at each enterable location, so the user can
// see where to tap when there is no walking avatar.
function _drawTapMarkers(ctx, camera) {
  if (!_tapMarkers.length) return;
  const vw = camera.viewW, vh = camera.viewH;
  const pulse = 0.5 + 0.5 * Math.sin(ffTime * 2.4); // 0..1 slow breath

  for (const m of _tapMarkers) {
    const sx = m.cx - camera.x;
    const sy = m.cy - camera.y;
    if (sx < -120 || sx > vw + 120 || sy < -120 || sy > vh + 120) continue;

    const baseR = 26 + 8 * pulse;
    const outerR = baseR + 14 + 10 * pulse;

    // Outer soft glow
    const grad = ctx.createRadialGradient(sx, sy, baseR * 0.3, sx, sy, outerR);
    grad.addColorStop(0, `rgba(255,210,130,${0.10 + 0.10 * pulse})`);
    grad.addColorStop(0.6, 'rgba(255,185,90,0.05)');
    grad.addColorStop(1, 'rgba(255,185,90,0)');
    ctx.beginPath();
    ctx.arc(sx, sy, outerR, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Crisp ring
    ctx.beginPath();
    ctx.arc(sx, sy, baseR, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,225,160,${0.35 + 0.30 * pulse})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,240,200,${0.6 + 0.3 * pulse})`;
    ctx.fill();
  }
}

// ─── Fireflies ─────────────────────────────────────────────────────

function _drawFireflies(ctx, camera, dt) {
  const vw = camera.viewW, vh = camera.viewH;
  for (let i = 0, len = fireflies.length; i < len; i++) {
    const ff = fireflies[i];
    ff.wx += ff.sx;
    ff.wy += ff.sy;
    if (ff.wx < 64 || ff.wx > _worldW - 64) ff.sx *= -1;
    if (ff.wy < 64 || ff.wy > _worldH - 64) ff.sy *= -1;

    const sx = ff.wx - camera.x;
    const sy = ff.wy - camera.y;
    if (sx < -20 || sx > vw + 20 || sy < -20 || sy > vh + 20) continue;

    const blink = Math.sin(ffTime * ff.speed * 1000 + ff.phase);
    const idx = Math.max(0, Math.min(100, ((blink * 0.5 + 0.3) * 60) | 0));

    ctx.beginPath();
    ctx.arc(sx, sy, ff.size * 4, 0, Math.PI * 2);
    ctx.fillStyle = _ffGlowColors[idx];
    ctx.fill();

    ctx.beginPath();
    ctx.arc(sx, sy, ff.size, 0, Math.PI * 2);
    ctx.fillStyle = _ffCoreColors[idx];
    ctx.fill();
  }
}

// ─── Player Avatar ─────────────────────────────────────────────────

function _drawPlayer(ctx, camera, player) {
  const { sx, sy } = camera.worldToScreen(player.x, player.y);

  if (_activeSprite) {
    // ── Sprite-based rendering ──
    const sprite = _activeSprite;
    const row = (sprite.dirRow[player.facing]) ?? 0;
    const col = player.animFrame % sprite.cols;

    // Source rectangle in spritesheet
    const srcX = col * sprite.frameW;
    const srcY = row * sprite.frameH;

    // Draw size on canvas — large enough to be visible at CAM_ZOOM 0.38
    const drawW = 160;
    const drawH = 160;

    // Subtle shadow beneath feet (simple ellipse, no gradient)
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + drawH * 0.22, drawW * 0.22, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw the sprite frame — centered horizontally, feet anchored at player y
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(
      sprite.img,
      srcX, srcY, sprite.frameW, sprite.frameH,   // source
      sx - drawW / 2, sy - drawH * 0.58, drawW, drawH  // dest (offset up so feet sit near y)
    );
  } else {
    // ── Fallback: bright visible placeholder while sprite loads ──
    const bob = player.moving ? Math.sin(player.animTimer * 15) * 2 : 0;

    // Glow
    ctx.fillStyle = 'rgba(255,220,140,0.15)';
    ctx.beginPath();
    ctx.arc(sx, sy + bob, 40, 0, Math.PI * 2);
    ctx.fill();

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + 24, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = '#8B6B4A';
    ctx.fillRect(sx - 12, sy - 4 + bob, 24, 28);

    // Head
    ctx.fillStyle = '#F5E8D0';
    ctx.beginPath();
    ctx.arc(sx, sy - 14 + bob, 14, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = '#5a3a2a';
    ctx.beginPath();
    ctx.arc(sx, sy - 18 + bob, 12, Math.PI, Math.PI * 2);
    ctx.fill();
  }
}

// ─── Rounded rect helper ───────────────────────────────────────────

function _roundRect(ctx, x, y, w, h, r) {
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

// ─── Interaction Prompt ────────────────────────────────────────────

function _drawInteractionPrompt(ctx, camera, zone) {
  const { sx, sy } = camera.worldToScreen(zone.cx, zone.cy - 60);

  // Interior interactions show just the label; exterior zones show "Enter {label}"
  const isInteract = zone.screen?.startsWith('interact:') || zone.screen === 'check-in';
  const text = isInteract ? zone.label : `Enter ${zone.label}`;
  ctx.font = "600 13px 'DM Sans', sans-serif";
  const metrics = ctx.measureText(text);
  const pw = metrics.width + 36;
  const ph = 34;
  const px = sx - pw / 2;
  const py = sy - ph / 2;

  // Background pill
  ctx.fillStyle = 'rgba(26,22,18,0.88)';
  ctx.beginPath();
  _roundRect(ctx, px, py, pw, ph, 14);
  ctx.fill();

  // Gold border
  ctx.strokeStyle = 'rgba(201,169,110,0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  _roundRect(ctx, px, py, pw, ph, 14);
  ctx.stroke();

  // Text
  ctx.fillStyle = 'rgba(255,240,200,0.9)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, sx, sy);
}
