/**
 * Hidden Object scenes — tap-on-scene "I Spy" puzzles.
 *
 * Each scene hides a list of objects inside a single illustration.
 * Tap an object on the scene to find it; finding them all reveals a verse.
 *
 * Object positions are expressed as PERCENTAGES of the rendered image box
 * (the image is shown with object-fit:contain, so % maps 1:1 onto the art):
 *   x, y — center of the object's hit-spot (0–100, % of width / height)
 *   r    — radius of the tappable area (% of the image WIDTH)
 *
 * To re-calibrate after swapping art: open the play screen, tap where the
 * object is, and the screen logs the tapped x/y % to the console — paste
 * those numbers in here.
 */
export const HIDDEN_OBJECT_SCENES = [
  {
    id: 'cozy-cabin',
    title: 'The Cozy Cabin',
    reference: 'Matthew 6:6',
    verseText: 'But thou, when thou prayest, enter into thy closet, and when thou hast shut thy door, pray to thy Father which is in secret.',
    src: '/hiddenobject-cabin.png',
    objects: [
      { id: 'teapot',     label: 'Teapot',          x: 12, y: 8,  r: 7 },
      { id: 'globe',      label: 'Globe',           x: 9,  y: 18, r: 7 },
      { id: 'clock',      label: 'Clock',           x: 10, y: 24, r: 6 },
      { id: 'mirror',     label: 'Oval mirror',     x: 42, y: 17, r: 7 },
      { id: 'guitar',     label: 'Guitar',          x: 56, y: 44, r: 8 },
      { id: 'lamp',       label: 'Lit lamp',        x: 70, y: 30, r: 7 },
      { id: 'sailboat',   label: 'Toy sailboat',    x: 86, y: 37, r: 7 },
      { id: 'star',       label: 'Star ornament',   x: 83, y: 20, r: 6 },
      { id: 'plant',      label: 'Potted plant',    x: 33, y: 53, r: 7 },
      { id: 'candle',     label: 'Lit candle',      x: 42, y: 58, r: 6 },
      { id: 'magnifier',  label: 'Magnifying glass',x: 49, y: 79, r: 7 },
      { id: 'key',        label: 'Old key',         x: 57, y: 79, r: 6 },
      { id: 'teddy',      label: 'Teddy bear',      x: 12, y: 88, r: 8 },
      { id: 'lantern',    label: 'Lantern',         x: 23, y: 84, r: 7 },
      { id: 'dog',        label: 'Sleeping dog',    x: 74, y: 84, r: 9 },
      { id: 'backpack',   label: 'Backpack',        x: 12, y: 76, r: 8 },
    ],
  },
];

export function getScene(id) {
  return HIDDEN_OBJECT_SCENES.find(s => s.id === id) || null;
}
