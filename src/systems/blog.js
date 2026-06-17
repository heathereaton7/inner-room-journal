/**
 * PORCH BLOG — Firestore data layer.
 *
 * A cozy bulletin-board blog. Posts live in the top-level `blogPosts`
 * collection (kept separate from the social prayer-feed `posts` collection).
 *
 * Each post document:
 *   title      string   — post title (required)
 *   teaser     string   — the one line shown on the pin
 *   body       string   — the full reflection
 *   videoUrl   string   — optional Faith-Full / YouTube link
 *   status     string   — 'published' | 'draft'
 *   createdAt  Timestamp — server timestamp (newest first ordering)
 *   authorUid  string   — the owner who wrote it
 *
 * Security (see firestore.rules):
 *   - anyone (even signed-out) may READ posts where status == 'published'
 *   - only BLOG_OWNER_UID may create / update / delete
 */
import { db } from '../firebase.js';
import {
  collection, doc, addDoc, setDoc, deleteDoc,
  getDocs, getDoc, query, where, orderBy, serverTimestamp,
} from '../firebase.js';

const COLLECTION = 'blogPosts';

/**
 * Brand styling tokens for the Porch Blog (sampled from Heather's logo).
 * Serif for titles + body reflections; sans-serif for buttons/labels/forms.
 */
export const BLOG = {
  sage:     '#5E7560', // frames, headers, primary buttons, post titles
  sageDk:   '#4A5E4D', // darker sage for borders/depth
  rose:     '#C8A39B', // accents: quote bar, the Faith-Full button
  roseDk:   '#B68B82',
  taupe:    '#A99779', // dates / muted meta text
  cream:    '#FAF8F4', // paper / reading background
  charcoal: '#3C3C3C', // body text / ink
  cork:     '#AE7D4D', // the pin board surface (fallback)
  paper:    '#F3EAD6', // the pinned note cards
};
export const BLOG_SERIF = "'Cormorant Garamond','Georgia',serif";
export const BLOG_SANS  = "'DM Sans','Helvetica Neue',sans-serif";

// Normalize a Firestore doc → plain post object the UI can render.
function toPost(d) {
  const data = d.data() || {};
  return {
    id: d.id,
    title: data.title || '',
    teaser: data.teaser || '',
    body: data.body || '',
    videoUrl: data.videoUrl || '',
    status: data.status || 'published',
    authorUid: data.authorUid || '',
    // createdAt may be a Firestore Timestamp; expose a JS Date too.
    createdAt: data.createdAt || null,
    createdAtMs: data.createdAt?.toMillis ? data.createdAt.toMillis() : 0,
  };
}

// Sort newest first by createdAt (falls back gracefully if missing).
function byNewest(a, b) {
  return (b.createdAtMs || 0) - (a.createdAtMs || 0);
}

/**
 * Fetch PUBLISHED posts, newest first. Public — works signed-out.
 * We avoid a composite index by querying on status only and sorting client-side.
 */
export async function fetchPublishedPosts() {
  if (!db) return [];
  try {
    const snap = await getDocs(
      query(collection(db, COLLECTION), where('status', '==', 'published'))
    );
    return snap.docs.map(toPost).sort(byNewest);
  } catch (e) {
    console.warn('[blog] fetchPublishedPosts failed:', e?.message || e);
    return [];
  }
}

/**
 * Fetch ALL posts (published + drafts), newest first. OWNER ONLY —
 * the security rules will reject this for non-owners.
 */
export async function fetchAllPosts() {
  if (!db) return [];
  try {
    const snap = await getDocs(
      query(collection(db, COLLECTION), orderBy('createdAt', 'desc'))
    );
    return snap.docs.map(toPost);
  } catch (e) {
    console.warn('[blog] fetchAllPosts failed:', e?.message || e);
    return [];
  }
}

export async function fetchPost(id) {
  if (!db || !id) return null;
  try {
    const d = await getDoc(doc(db, COLLECTION, id));
    return d.exists() ? toPost(d) : null;
  } catch (e) {
    console.warn('[blog] fetchPost failed:', e?.message || e);
    return null;
  }
}

/**
 * Create a new post. `status` is 'published' or 'draft'.
 * Returns the new post id.
 */
export async function createPost({ title, teaser, body, videoUrl, status, authorUid }) {
  if (!db) throw new Error('No database connection');
  const ref = await addDoc(collection(db, COLLECTION), {
    title: (title || '').trim(),
    teaser: (teaser || '').trim(),
    body: (body || '').trim(),
    videoUrl: (videoUrl || '').trim(),
    status: status === 'draft' ? 'draft' : 'published',
    authorUid: authorUid || '',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * Update an existing post (merge). Used to publish a draft, or edit.
 */
export async function updatePost(id, fields) {
  if (!db || !id) throw new Error('No database connection');
  const clean = {};
  if (fields.title != null) clean.title = String(fields.title).trim();
  if (fields.teaser != null) clean.teaser = String(fields.teaser).trim();
  if (fields.body != null) clean.body = String(fields.body).trim();
  if (fields.videoUrl != null) clean.videoUrl = String(fields.videoUrl).trim();
  if (fields.status != null) clean.status = fields.status === 'draft' ? 'draft' : 'published';
  await setDoc(doc(db, COLLECTION, id), clean, { merge: true });
}

export async function deletePost(id) {
  if (!db || !id) throw new Error('No database connection');
  await deleteDoc(doc(db, COLLECTION, id));
}

/**
 * Format a post date as "Month Day" (e.g. "June 14").
 * Accepts a Firestore Timestamp, a JS Date, a number (ms), or null.
 */
export function formatPostDate(createdAt) {
  let date;
  if (!createdAt) date = new Date();
  else if (typeof createdAt === 'number') date = new Date(createdAt);
  else if (createdAt.toDate) date = createdAt.toDate();
  else if (createdAt instanceof Date) date = createdAt;
  else date = new Date();
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}
