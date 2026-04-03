import { WORLD_W, WORLD_H, MAP_SCALE } from './constants.js';
import { resolveSprite, SPRITES } from './sprites.js';

// ─── Map Background Layers ─────────────────────────────────────────
// Multiple map images stacked vertically to form one seamless world.
const _mapLayers = []; // [{img, worldYStart, worldYEnd, imgH}]

/**
 * Load an array of map artwork images and stack them vertically.
 * Each image is positioned so they form a continuous vertical world.
 * @param {string[]} sources — array of image URLs, top to bottom
 * @returns {Promise<object[]>} resolved layer data
 */
export function loadMapImages(sources) {
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
      const worldH = img.height * MAP_SCALE;
      _mapLayers.push({
        img,
        worldYStart: yOffset,
        worldYEnd: yOffset + worldH,
        imgH: img.height,
        imgW: img.width,
      });
      yOffset += worldH;
    }
    console.log(`[Renderer] Loaded ${_mapLayers.length} map layers, total world height: ${yOffset}px`);
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

export function initFireflies(count = 50) {
  fireflies = [];
  for (let i = 0; i < count; i++) {
    fireflies.push({
      wx: Math.random() * WORLD_W,
      wy: Math.random() * WORLD_H,
      size: Math.random() * 1.5 + 0.8,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.003 + 0.001,
      sx: (Math.random() - 0.5) * 0.3,
      sy: (Math.random() - 0.5) * 0.2,
    });
  }
}

// ─── Main Render Function ──────────────────────────────────────────

/**
 * Draw the entire scene to the canvas.
 * Stacked map artwork layers are the background; the tile grid is invisible.
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
      // Skip layers entirely outside viewport
      if (camTop >= layer.worldYEnd || camBottom <= layer.worldYStart) continue;

      // Source rect in image coordinates
      const relY = camTop - layer.worldYStart;  // may be negative
      const sx = Math.max(0, camera.x / MAP_SCALE);
      const sy = Math.max(0, relY / MAP_SCALE);
      const sw = Math.min(viewW / MAP_SCALE, layer.imgW - sx);
      const sh = Math.min(
        (viewH - Math.max(0, layer.worldYStart - camTop)) / MAP_SCALE,
        layer.imgH - sy
      );

      if (sw <= 0 || sh <= 0) continue;

      // Destination rect on screen
      const dx = Math.max(0, (sx * MAP_SCALE - camera.x));
      const dy = Math.max(0, layer.worldYStart - camTop);
      const dw = sw * MAP_SCALE;
      const dh = sh * MAP_SCALE;

      ctx.drawImage(layer.img, sx, sy, sw, sh, dx, dy, dw, dh);
    }
  } else {
    // Fallback: dark background while images load
    ctx.fillStyle = '#0A0806';
    ctx.fillRect(0, 0, viewW, viewH);
  }

  // ── Ambient fireflies ──
  ffTime += dt;
  _drawFireflies(ctx, camera, dt);

  // ── Player avatar ──
  _drawPlayer(ctx, camera, player);

  // ── Interaction prompt (canvas version; DOM version also exists) ──
  if (zones.nearbyZone) {
    _drawInteractionPrompt(ctx, camera, zones.nearbyZone);
  }
}

// ─── Fireflies ─────────────────────────────────────────────────────

function _drawFireflies(ctx, camera, dt) {
  for (const ff of fireflies) {
    ff.wx += ff.sx;
    ff.wy += ff.sy;
    if (ff.wx < 64 || ff.wx > WORLD_W - 64) ff.sx *= -1;
    if (ff.wy < 64 || ff.wy > WORLD_H - 64) ff.sy *= -1;

    const { sx, sy } = camera.worldToScreen(ff.wx, ff.wy);
    if (sx < -20 || sx > camera.viewW + 20 || sy < -20 || sy > camera.viewH + 20) continue;

    const blink = Math.sin(ffTime * ff.speed * 1000 + ff.phase);
    const alpha = Math.max(0, blink * 0.5 + 0.3) * 0.6;

    ctx.beginPath();
    ctx.arc(sx, sy, ff.size * 4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,220,100,${alpha * 0.08})`;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(sx, sy, ff.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,235,150,${alpha})`;
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

    // Warm lantern glow beneath character
    const glowGrd = ctx.createRadialGradient(sx, sy + 10, 4, sx, sy + 10, drawW * 0.5);
    glowGrd.addColorStop(0, 'rgba(255,220,140,0.12)');
    glowGrd.addColorStop(1, 'rgba(255,220,140,0)');
    ctx.fillStyle = glowGrd;
    ctx.beginPath();
    ctx.arc(sx, sy + 10, drawW * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Subtle shadow beneath feet
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
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

  const text = `Enter ${zone.label}`;
  ctx.font = "600 13px 'DM Sans', sans-serif";
  const metrics = ctx.measureText(text);
  const pw = metrics.width + 32;
  const ph = 32;
  const px = sx - pw / 2;
  const py = sy - ph / 2;

  ctx.fillStyle = 'rgba(26,22,18,0.85)';
  ctx.beginPath();
  _roundRect(ctx, px, py, pw, ph, 12);
  ctx.fill();

  ctx.strokeStyle = 'rgba(201,169,110,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  _roundRect(ctx, px, py, pw, ph, 12);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,240,200,0.85)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, sx, sy);
}
