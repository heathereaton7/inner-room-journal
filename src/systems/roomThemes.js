import { useState, useEffect } from 'react';

/**
 * ROOM THEMES — the app-wide SEASON catalog.
 *
 * Selecting a theme is a single global "Season" switch: it re-skins the WHOLE
 * app so everything stays consistent (pick Christmas and the kitchen, cabin and
 * activity backdrops all become Christmas — never mismatched).
 *
 * Each theme drives <CottageBackground>: the full-bleed activity scene image
 * plus its atmospheric layers (weather over the window glass and flickering
 * candle glows anchored to the lanterns in the painting).
 *
 * To add a new season: drop the image(s) in /public, add one entry here, and it
 * automatically appears in the "Season" picker in the bottom menu.
 *
 *   window  — viewport-% box framing just the glass so weather only falls there
 *   weather — 'rain' | 'snow' | 'petals' | 'leaves' | 'none'
 *   candles — glow positions (viewport %) calibrated to the lantern flames
 *
 * Optional per-area asset overrides re-skin other screens for this season.
 * When absent, that screen keeps its default image — so a season only needs
 * art for the areas it has been painted for:
 *   kitchen — full-screen kitchen background image
 *   cabin   — full-screen cabin interior background image
 *   sounds  — SOUND_LIBRARY ids highlighted as this season's music
 */
export const ROOM_THEMES = [
  {
    id: 'cottage-rain',
    name: 'Rainy Cottage',
    description: 'Candlelit nook with rain on the glass',
    tag: 'Cozy',
    src: '/wordsearchbackgroundone.png',
    weather: 'rain',
    window: { left: '17%', top: '2%', width: '82%', height: '66%', radius: '48% 48% 5% 5% / 30% 30% 4% 4%' },
    candles: [
      { left: '9%', top: '18%', color: '#FFB36A', size: 170, duration: 6.5 },
      { left: '78%', top: '65%', color: '#FFC07A', size: 180, duration: 8.0 },
    ],
  },
  {
    id: 'christmas',
    name: 'Christmas Cabin',
    description: 'Snowfall, string lights & cocoa by the window',
    tag: 'Holiday',
    src: '/christmas.png',
    weather: 'snow',
    window: { left: '25%', top: '2%', width: '73%', height: '67%', radius: '48% 48% 4% 4% / 28% 28% 3% 3%' },
    candles: [
      { left: '8.5%', top: '17%', color: '#FFB36A', size: 150, duration: 6.5 },
      { left: '78%', top: '66%', color: '#FFC07A', size: 165, duration: 8.0 },
      { left: '60%', top: '83%', color: '#FFD89A', size: 90,  duration: 7.2 },
    ],
    kitchen: '/christmaskitchenfinal.png',
    // Arched window over the kitchen sink (viewport-% box) — snow falls here when weather==='snow'
    kitchenWindow: { left: '52%', top: '5%', width: '46%', height: '53%' },
    cabin: '/christmascabinmap.png',
    sounds: ['xmas-mistletoe', 'xmas-peppermint', 'xmas-seasonal'],
  },
  {
    id: 'spring',
    name: 'Spring Cottage',
    description: 'Blossom petals drift past a sunlit waterfall',
    tag: 'Seasonal',
    src: '/spring.png',
    weather: 'petals',
    window: { left: '24%', top: '2%', width: '74%', height: '70%', radius: '48% 48% 4% 4% / 28% 28% 3% 3%' },
    candles: [
      { left: '9%', top: '18%', color: '#FFB36A', size: 150, duration: 6.5 },
      { left: '75%', top: '67%', color: '#FFC07A', size: 160, duration: 8.0 },
    ],
  },
  {
    id: 'rainy-spring',
    name: 'Rainy Spring Day',
    description: 'Misty rain on the glass over a blossoming valley',
    tag: 'Seasonal',
    src: '/rainyspring.png',
    weather: 'rain',
    window: { left: '24%', top: '2%', width: '74%', height: '62%', radius: '48% 48% 4% 4% / 28% 28% 3% 3%' },
    candles: [
      { left: '9%', top: '18%', color: '#FFB36A', size: 150, duration: 6.5 },
      { left: '76%', top: '63%', color: '#FFC07A', size: 160, duration: 8.0 },
    ],
    cabin: '/rainyspringcabinmap.png',
  },
  {
    id: 'fall',
    name: 'Autumn Cabin',
    description: 'Amber leaves drift over a golden waterfall valley',
    tag: 'Seasonal',
    src: '/fall.png',
    weather: 'leaves',
    window: { left: '26%', top: '2%', width: '72%', height: '64%', radius: '48% 48% 4% 4% / 28% 28% 3% 3%' },
    candles: [
      { left: '9%', top: '18%', color: '#FFB36A', size: 150, duration: 6.5 },
      { left: '78%', top: '64%', color: '#FFC07A', size: 160, duration: 8.0 },
    ],
    cabin: '/fallcabinmap.png',
  },
];

export const DEFAULT_ROOM_THEME = 'cottage-rain';

export const ROOM_THEME_KEY = 'irj-room-theme';
export const ROOM_THEME_EVENT = 'room-theme-change';

export function getRoomTheme(id) {
  return ROOM_THEMES.find(t => t.id === id) || ROOM_THEMES[0];
}

/**
 * useRoomTheme — shared reactive hook returning the active season/theme object.
 * Reads localStorage and stays live by listening for ROOM_THEME_EVENT (in-tab
 * menu changes) and the 'storage' event (other tabs). Any screen can call this
 * to re-skin itself for the current season without prop-threading.
 */
export function useRoomTheme() {
  const read = () => {
    try {
      const raw = localStorage.getItem(ROOM_THEME_KEY);
      const id = raw ? JSON.parse(raw) : DEFAULT_ROOM_THEME;
      return getRoomTheme(id);
    } catch {
      return getRoomTheme(DEFAULT_ROOM_THEME);
    }
  };
  const [theme, setTheme] = useState(read);
  useEffect(() => {
    const h = () => setTheme(read());
    window.addEventListener(ROOM_THEME_EVENT, h);
    window.addEventListener('storage', h);
    return () => {
      window.removeEventListener(ROOM_THEME_EVENT, h);
      window.removeEventListener('storage', h);
    };
  }, []);
  return theme;
}
