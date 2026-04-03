import { useRef, useEffect, useCallback, useState } from 'react';
import { GameLoop } from './GameLoop.js';
import { Camera } from './Camera.js';
import { Player } from './Player.js';
import { Input } from './Input.js';
import { InteractionZones } from './InteractionZones.js';
import { loadMapImages, loadPlayerSprite, render, initFireflies } from './Renderer.js';
import { buildWorldGrid, SPAWN_X, SPAWN_Y } from './worldMap.js';
import { MAP_IMAGES, CAM_ZOOM } from './constants.js';
import Joystick from './Joystick.jsx';

// Build the grid once (singleton, reused across mounts)
let worldGrid = null;

/**
 * OverworldScreen — Top-level React component for the tile-based overworld.
 * Replaces the old static image map.
 *
 * Props:
 *   onEnterLocation(screenName)  — called when player enters an interaction zone
 *   playerPos  — { x, y } | null — restored position (remembers where player was)
 *   onPosChange(x, y)  — called when player moves (so app.jsx can save position)
 */
export default function OverworldScreen({ onEnterLocation, playerPos, onPosChange }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const inputRef = useRef(null);
  const [promptZone, setPromptZone] = useState(null);

  useEffect(() => {
    // Build grid once
    if (!worldGrid) worldGrid = buildWorldGrid();

    // Start loading the illustrated map backgrounds (renders dark until loaded)
    loadMapImages(MAP_IMAGES);
    // Load player character sprite
    loadPlayerSprite('/character-sprite.png');

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Size canvas to fill window (apply CAM_ZOOM so more of the world is visible)
    const zoom = CAM_ZOOM;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, 0, 0);
      if (gameRef.current) {
        gameRef.current.camera.resize(window.innerWidth / zoom, window.innerHeight / zoom);
      }
    };
    resize();
    window.addEventListener('resize', resize);

    // Create game systems
    const spawnX = playerPos?.x ?? SPAWN_X;
    const spawnY = playerPos?.y ?? SPAWN_Y;

    const input = new Input();
    const player = new Player(spawnX, spawnY);
    const camera = new Camera(window.innerWidth / zoom, window.innerHeight / zoom);
    const zones = new InteractionZones();
    const loop = new GameLoop();

    camera.snapTo(player.x, player.y);
    initFireflies(50);
    input.attach();
    inputRef.current = input;

    // Position reporting throttle
    let posReportTimer = 0;

    // Game loop
    loop.onUpdate = (dt) => {
      const { dx, dy } = input.getDirection();
      player.update(dx, dy, dt, worldGrid);
      camera.follow(player.x, player.y);
      zones.update(player.x, player.y);

      // Update React prompt state (only on zone change)
      const nz = zones.nearbyZone;
      setPromptZone(prev => {
        if (prev?.id !== nz?.id) return nz;
        return prev;
      });

      // Report position back to app.jsx (throttled to ~10Hz)
      if (onPosChange && player.moving) {
        posReportTimer += dt;
        if (posReportTimer > 0.1) {
          onPosChange(player.x, player.y);
          posReportTimer = 0;
        }
      }
    };

    loop.onRender = () => {
      render(ctx, worldGrid, camera, player, zones, 0.016);
    };

    gameRef.current = { loop, camera, player, input, zones };
    loop.start();

    return () => {
      loop.stop();
      input.detach();
      window.removeEventListener('resize', resize);
    };
  }, []); // runs once on mount

  // Save position and trigger zone entry
  const enterZone = useCallback((screen) => {
    const game = gameRef.current;
    if (game && onPosChange) {
      onPosChange(game.player.x, game.player.y);
    }
    onEnterLocation(screen);
  }, [onEnterLocation, onPosChange]);

  // Handle tap on canvas to enter a zone
  const handleCanvasTap = useCallback((e) => {
    const game = gameRef.current;
    if (!game) return;
    const zone = game.zones.getEnterable(game.player.x, game.player.y);
    if (zone) {
      enterZone(zone.screen);
    }
  }, [enterZone]);

  // Handle the floating "Enter" button
  const handleEnterZone = useCallback(() => {
    if (promptZone) {
      enterZone(promptZone.screen);
    }
  }, [promptZone, enterZone]);

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#0A0806' }}>
      <canvas
        ref={canvasRef}
        onClick={handleCanvasTap}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />

      {/* Floating interaction prompt (DOM for crisp text + accessibility) */}
      {promptZone && (
        <button
          onClick={handleEnterZone}
          style={{
            position: 'fixed',
            top: '15%',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 55,
            background: 'rgba(26,22,18,0.88)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(201,169,110,0.25)',
            borderRadius: 14,
            padding: '10px 26px',
            cursor: 'pointer',
            color: 'rgba(255,240,200,0.85)',
            fontFamily: "'Cormorant Garamond','Georgia',serif",
            fontStyle: 'italic',
            fontSize: '0.92rem',
            letterSpacing: '0.02em',
            boxShadow: '0 4px 24px rgba(0,0,0,0.45)',
            transition: 'opacity 0.2s ease',
          }}
        >
          Enter {promptZone.label}
        </button>
      )}

      {/* Bridge arrow — navigate to second map */}
      <button
        onClick={() => onEnterLocation('map2')}
        style={{
          position: 'fixed',
          bottom: 44,
          right: 28,
          zIndex: 58,
          background: 'rgba(26,22,18,0.88)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(201,169,110,0.3)',
          borderRadius: 14,
          padding: '11px 20px 11px 16px',
          cursor: 'pointer',
          color: 'rgba(255,240,200,0.88)',
          fontFamily: "'Cormorant Garamond','Georgia',serif",
          fontStyle: 'italic',
          fontSize: '0.88rem',
          letterSpacing: '0.03em',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5), 0 0 18px rgba(201,169,110,0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          transition: 'box-shadow 0.3s ease',
        }}
      >
        Cross Bridge
        <span style={{
          fontSize: '1.2em',
          lineHeight: 1,
          display: 'inline-block',
          animation: 'bridgeArrowBounce 1.8s ease-in-out infinite',
        }}>&#10132;</span>
      </button>

      {/* Bridge arrow bounce animation */}
      <style>{`
        @keyframes bridgeArrowBounce {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }
      `}</style>

      {/* Virtual joystick */}
      <Joystick inputRef={inputRef} />
    </div>
  );
}
