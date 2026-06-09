/**
 * ROOM THEMES — selectable "style of room" backdrops for the cozy activity
 * screens (Word Search, Diamond Art, Pregnancy / Fertility meditations, etc.).
 *
 * Each theme drives <CottageBackground>: the full-bleed scene image plus its
 * atmospheric layers (weather over the window glass and flickering candle
 * glows anchored to the lanterns in the painting).
 *
 * To add a new room: drop the image in /public, add one entry here, and it
 * automatically appears in the "Room Style" picker in the bottom menu.
 *
 *   window  — viewport-% box framing just the glass so weather only falls there
 *   weather — 'rain' | 'snow' | 'none'
 *   candles — glow positions (viewport %) calibrated to the lantern flames
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
  },
];

export const DEFAULT_ROOM_THEME = 'cottage-rain';

export const ROOM_THEME_KEY = 'irj-room-theme';
export const ROOM_THEME_EVENT = 'room-theme-change';

export function getRoomTheme(id) {
  return ROOM_THEMES.find(t => t.id === id) || ROOM_THEMES[0];
}
