/**
 * Coloring page library — tap-to-color "paint bucket" pages.
 *
 * Each page points to a black-and-white line-art PNG in /public. The art is
 * drawn on a canvas and the user flood-fills the enclosed white areas with the
 * glitter palette. Saved pictures are keyed by `id` (see app.jsx `coloring`).
 *
 * To add a page: drop the line art in `public/coloring pages/` and add an entry
 * here. `src` is URL-encoded so spaces in the filename load correctly.
 */

export const COLORING_PAGES = [
  {
    id: 'garden-serene',
    title: 'Serene Garden',
    verse: 'Consider the lilies of the field, how they grow.',
    reference: 'Matthew 6:28',
    src: encodeURI('/coloring pages/Serene Abundant Garden Scene.png'),
  },
];

export function getColoringPage(id) {
  return COLORING_PAGES.find(p => p.id === id);
}
