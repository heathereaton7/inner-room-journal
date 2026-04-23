/**
 * POST /api/lulu/upload-book
 * Accepts a PDF (interior or cover) from the client and uploads it to
 * Vercel Blob, returning a public URL that Lulu can fetch to print from.
 *
 * We expect the request body to be raw bytes (Content-Type: application/pdf).
 * The kind + bookId are passed as query params.
 *
 * Query:
 *   kind=interior|cover  (required)
 *   bookId=<unique id>   (required — used in the blob filename)
 *
 * Response:
 *   { url: 'https://<blob>.public.blob.vercel-storage.com/...pdf' }
 *
 * Required env var: BLOB_READ_WRITE_TOKEN (auto-set when you enable Vercel Blob)
 */

import { put } from '@vercel/blob';
import { setCors } from './_auth.js';

// Disable the default body parser — we receive raw PDF bytes
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  setCors(res, req.headers.origin);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { kind, bookId } = req.query;
    if (!kind || !['interior', 'cover'].includes(kind)) {
      return res.status(400).json({ error: 'kind query param must be "interior" or "cover"' });
    }
    if (!bookId) {
      return res.status(400).json({ error: 'bookId query param is required' });
    }

    // Read the raw body as a Buffer
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    if (buffer.length === 0) {
      return res.status(400).json({ error: 'Empty PDF body' });
    }
    if (buffer.length > 25 * 1024 * 1024) {
      return res.status(413).json({ error: 'PDF too large (25MB max)' });
    }
    // Basic sanity check: PDF should start with %PDF-
    if (buffer.slice(0, 5).toString() !== '%PDF-') {
      return res.status(400).json({ error: 'Upload does not appear to be a PDF' });
    }

    const safeId = String(bookId).replace(/[^a-z0-9-]/gi, '-').toLowerCase().slice(0, 64);
    const path = `pregnancy-books/${safeId}/${kind}-${Date.now()}.pdf`;

    const blob = await put(path, buffer, {
      access: 'public',
      contentType: 'application/pdf',
    });

    return res.status(200).json({ url: blob.url, pathname: blob.pathname });
  } catch (err) {
    console.error('upload-book error', err);
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
}
