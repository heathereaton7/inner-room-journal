import { useRef, useEffect, useCallback, useState } from 'react';
import { GameLoop } from './GameLoop.js';
import { Camera } from './Camera.js';
import { Player } from './Player.js';
import { Input } from './Input.js';
import { InteractionZones } from './InteractionZones.js';
import { loadPlayerSprite, preloadSprite, render, initFireflies, setRendererWorldSize, setMapObjects, setTapMarkers } from './Renderer.js';
import { MapManager } from './MapManager.js';
import { ALL_MAPS } from './maps/index.js';
import { TILE } from './constants.js';
import { resolveSprite, SPRITES } from './sprites.js';
import Joystick from './Joystick.jsx';
import { AVATAR_NAV } from '../constants.js';

// Build the list of tappable markers (zones + door transitions) for the
// current map, so the renderer can draw a pulsing ring at each location.
function _refreshTapMarkers() {
  const zones = (mapManager.getZones() || []).map(z => ({ cx: z.cx, cy: z.cy, radius: z.radius }));
  const trans = (mapManager.current?.transitions || []).map(t => ({ cx: t.cx, cy: t.cy, radius: t.radius || 48 }));
  setTapMarkers([...zones, ...trans]);
}

// Singleton MapManager (survives remounts)
const mapManager = new MapManager();
mapManager.registerAll(ALL_MAPS);

/**
 * OverworldScreen — Top-level React component for the tile-based overworld.
 * Now supports multiple maps with door transitions via MapManager.
 *
 * Props:
 *   onEnterLocation(screenName) — called when player enters an interaction zone
 *   playerPos    — { x, y, mapId } | null — restored position
 *   onPosChange(x, y, mapId) — called when player moves
 *   spriteConfig — from sprites.js resolveSprite()
 *   startMap     — initial map ID (default: 'cabin-exterior')
 */
export default function OverworldScreen({ onEnterLocation, playerPos, onPosChange, spriteConfig, startMap }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const inputRef = useRef(null);
  const [promptZone, setPromptZone] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const [currentMapId, setCurrentMapId] = useState(null);

  // ── Load a map into the game engine ──
  const loadMap = useCallback((mapId, spawnId, game) => {
    const spawn = mapManager.load(mapId, spawnId);
    const { w, h } = mapManager.getWorldSize();
    const zoom = mapManager.getCamZoom();

    // Update game systems for new map dimensions
    game.player.setWorldSize(mapManager.current.cols, mapManager.current.rows);
    game.player.teleport(spawn.x, spawn.y);
    game.camera.setWorldSize(w, h);
    game.camera.snapTo(spawn.x, spawn.y);
    game.zones.setZones(mapManager.getZones());

    // Update renderer world size for fireflies
    setRendererWorldSize(w, h);
    initFireflies(mapManager.current.cols < 30 ? 15 : 50);
    setMapObjects(mapManager.current.objects || []);

    // Update canvas zoom
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, 0, 0);
      game.camera.resize(window.innerWidth / zoom, window.innerHeight / zoom);
    }

    // Store the active grid on the game ref for the update loop
    game.grid = mapManager.grid;
    game.currentMapId = mapId;

    // Tap markers for the new map (tap/pan navigation)
    _refreshTapMarkers();

    setCurrentMapId(mapId);
  }, []);

  // ── Handle map transitions (door triggers) ──
  const handleTransition = useCallback((targetMap, spawnId) => {
    const game = gameRef.current;
    if (!game || transitioning) return;

    setTransitioning(true);
    // Fade out → switch map → fade in
    setTimeout(() => {
      loadMap(targetMap, spawnId, game);
      setTimeout(() => setTransitioning(false), 300);
    }, 400);
  }, [transitioning, loadMap]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Determine starting map
    const initialMap = playerPos?.mapId || startMap || 'cabin-exterior';
    const initialSpawn = playerPos ? null : 'default';

    // Load initial map
    const spawn = mapManager.load(initialMap, initialSpawn || 'default');
    const { w, h } = mapManager.getWorldSize();
    const zoom = mapManager.getCamZoom();

    // Size canvas
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      const z = mapManager.getCamZoom();
      ctx.setTransform(dpr * z, 0, 0, dpr * z, 0, 0);
      if (gameRef.current) {
        gameRef.current.camera.resize(window.innerWidth / z, window.innerHeight / z);
      }
    };
    resize();
    window.addEventListener('resize', resize);

    // Load sprites
    const sprConfig = spriteConfig || resolveSprite(null);
    loadPlayerSprite(sprConfig);
    Object.values(SPRITES).forEach(s => {
      if (s.src !== sprConfig.src) preloadSprite(s);
    });

    // Create game systems
    const spawnX = playerPos?.x ?? spawn.x;
    const spawnY = playerPos?.y ?? spawn.y;

    const input = new Input();
    const player = new Player(spawnX, spawnY);
    player.setWorldSize(mapManager.current.cols, mapManager.current.rows);
    const camera = new Camera(window.innerWidth / zoom, window.innerHeight / zoom);
    camera.setWorldSize(w, h);
    const zones = new InteractionZones(mapManager.getZones());
    const loop = new GameLoop();

    camera.snapTo(player.x, player.y);
    setRendererWorldSize(w, h);
    initFireflies(mapManager.current.cols < 30 ? 15 : 50);
    setMapObjects(mapManager.current.objects || []);
    _refreshTapMarkers();
    input.attach();
    inputRef.current = input;

    let posReportTimer = 0;
    const game = { loop, camera, player, input, zones, grid: mapManager.grid, currentMapId: initialMap };
    gameRef.current = game;

    setCurrentMapId(initialMap);

    // Game loop
    loop.onUpdate = (dt) => {
      // When avatar navigation is disabled, the camera is driven by
      // finger-panning (see pointer handlers) — skip all player/zone
      // logic but keep the loop alive for fireflies + marker pulse.
      if (!AVATAR_NAV) return;

      const { dx, dy } = input.getDirection();
      player.update(dx, dy, dt, game.grid);
      camera.follow(player.x, player.y);
      zones.update(player.x, player.y);

      // Check door transitions
      const transition = mapManager.checkTransitions(player.x, player.y);
      if (transition) {
        handleTransition(transition.targetMap, transition.spawnId);
      }

      // Update React prompt state
      const nz = zones.nearbyZone;
      setPromptZone(prev => {
        if (prev?.id !== nz?.id) return nz;
        return prev;
      });

      // Report position
      if (onPosChange && player.moving) {
        posReportTimer += dt;
        if (posReportTimer > 0.1) {
          onPosChange(player.x, player.y, game.currentMapId);
          posReportTimer = 0;
        }
      }
    };

    loop.onRender = () => {
      render(ctx, game.grid, camera, player, zones, 0.016);
    };

    loop.start();

    return () => {
      loop.stop();
      input.detach();
      window.removeEventListener('resize', resize);
    };
  }, []); // runs once on mount

  // React to sprite config changes
  useEffect(() => {
    if (spriteConfig) loadPlayerSprite(spriteConfig);
  }, [spriteConfig?.src]);

  // Save position and trigger zone entry
  const enterZone = useCallback((screen) => {
    const game = gameRef.current;
    if (game && onPosChange) {
      onPosChange(game.player.x, game.player.y, game.currentMapId);
    }
    onEnterLocation(screen);
  }, [onEnterLocation, onPosChange]);

  const handleCanvasTap = useCallback((e) => {
    const game = gameRef.current;
    if (!game) return;
    const zone = game.zones.getEnterable(game.player.x, game.player.y);
    if (zone) enterZone(zone.screen);
  }, [enterZone]);

  // ── Drag-to-pan + tap-to-enter (tap/pan navigation mode) ──
  const dragRef = useRef(null);

  const clampCamera = useCallback(() => {
    const game = gameRef.current;
    if (!game) return;
    const cam = game.camera;
    if (cam.viewW >= cam.worldW) cam.x = (cam.worldW - cam.viewW) / 2;
    else cam.x = Math.max(0, Math.min(cam.worldW - cam.viewW, cam.x));
    if (cam.viewH >= cam.worldH) cam.y = (cam.worldH - cam.viewH) / 2;
    else cam.y = Math.max(0, Math.min(cam.worldH - cam.viewH, cam.y));
  }, []);

  const handlePointerDown = useCallback((e) => {
    if (AVATAR_NAV) return;
    const game = gameRef.current;
    if (!game || transitioning) return;
    dragRef.current = {
      startX: e.clientX, startY: e.clientY,
      camX: game.camera.x, camY: game.camera.y,
      moved: 0, t0: performance.now(),
    };
  }, [transitioning]);

  const handlePointerMove = useCallback((e) => {
    if (AVATAR_NAV) return;
    const d = dragRef.current;
    const game = gameRef.current;
    if (!d || !game) return;
    const zoom = mapManager.getCamZoom();
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    d.moved = Math.max(d.moved, Math.abs(dx) + Math.abs(dy));
    game.camera.x = d.camX - dx / zoom;
    game.camera.y = d.camY - dy / zoom;
    clampCamera();
  }, [clampCamera]);

  const handlePointerUp = useCallback((e) => {
    if (AVATAR_NAV) return;
    const d = dragRef.current;
    dragRef.current = null;
    const game = gameRef.current;
    if (!d || !game || transitioning) return;

    const dt = performance.now() - d.t0;
    // Treat as a tap only if the finger barely moved and was quick.
    if (d.moved > 10 || dt > 400) return;

    const zoom = mapManager.getCamZoom();
    const wx = e.clientX / zoom + game.camera.x;
    const wy = e.clientY / zoom + game.camera.y;

    // 1) Door transitions (e.g. into the market interior)
    const tr = mapManager.checkTransitions(wx, wy);
    if (tr) { handleTransition(tr.targetMap, tr.spawnId); return; }

    // 2) Interaction zones (enter a screen)
    let best = null, bestDist = Infinity;
    for (const z of mapManager.getZones()) {
      const ddx = wx - z.cx, ddy = wy - z.cy;
      const dist = Math.sqrt(ddx * ddx + ddy * ddy);
      if (dist < (z.radius || 48) && dist < bestDist) { best = z; bestDist = dist; }
    }
    if (best) enterZone(best.screen);
  }, [transitioning, handleTransition, enterZone]);

  const handleEnterZone = useCallback(() => {
    if (promptZone) enterZone(promptZone.screen);
  }, [promptZone, enterZone]);

  const isExterior = currentMapId === 'cabin-exterior';

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#0A0806' }}>
      <canvas
        ref={canvasRef}
        onClick={AVATAR_NAV ? handleCanvasTap : undefined}
        onPointerDown={AVATAR_NAV ? undefined : handlePointerDown}
        onPointerMove={AVATAR_NAV ? undefined : handlePointerMove}
        onPointerUp={AVATAR_NAV ? undefined : handlePointerUp}
        onPointerCancel={AVATAR_NAV ? undefined : handlePointerUp}
        style={{ display: 'block', width: '100%', height: '100%', touchAction: 'none' }}
      />

      {/* Transition fade overlay */}
      {transitioning && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: '#0A0806',
          animation: 'spaceFadeIn 0.35s ease both',
          pointerEvents: 'all',
        }} />
      )}

      {/* Floating interaction prompt (avatar nav only) */}
      {AVATAR_NAV && promptZone && !transitioning && (
        <button
          onClick={handleEnterZone}
          style={{
            position: 'fixed', top: '12%', left: '50%',
            transform: 'translateX(-50%)', zIndex: 55,
            background: 'rgba(26,22,18,0.92)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(201,169,110,0.3)',
            borderRadius: 14, padding: '11px 28px', cursor: 'pointer',
            color: 'rgba(255,240,200,0.9)',
            fontFamily: "'Cormorant Garamond','Georgia',serif",
            fontStyle: 'italic', fontSize: '0.95rem',
            letterSpacing: '0.02em',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5), 0 0 12px rgba(201,169,110,0.08)',
            animation: 'fadeUp 0.25s ease both',
          }}
        >
          {promptZone.screen?.startsWith('interact:') || promptZone.screen === 'check-in'
            ? promptZone.label
            : `Enter ${promptZone.label}`}
        </button>
      )}

      {/* Bridge arrow — only on exterior map */}
      {isExterior && !transitioning && (
        <button
          onClick={() => onEnterLocation('map2')}
          style={{
            position: 'fixed', bottom: 44, right: 28, zIndex: 58,
            background: 'rgba(26,22,18,0.88)',
            backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(201,169,110,0.3)',
            borderRadius: 14, padding: '11px 20px 11px 16px', cursor: 'pointer',
            color: 'rgba(255,240,200,0.88)',
            fontFamily: "'Cormorant Garamond','Georgia',serif",
            fontStyle: 'italic', fontSize: '0.88rem',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          Cross Bridge
          <span style={{ fontSize: '1.2em', animation: 'bridgeArrowBounce 1.8s ease-in-out infinite' }}>&#10132;</span>
        </button>
      )}

      <style>{`
        @keyframes bridgeArrowBounce {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }
      `}</style>

      {/* Virtual joystick (avatar nav only) */}
      {AVATAR_NAV && <Joystick inputRef={inputRef} />}
    </div>
  );
}
