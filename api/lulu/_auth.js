/**
 * Lulu Direct API — OAuth 2.0 client credentials flow.
 * Fetches a short-lived access token using LULU_CLIENT_KEY + LULU_CLIENT_SECRET
 * from process.env. Tokens cached in-memory within a single function invocation
 * and reused across parallel calls.
 *
 * Environment variables required:
 *   LULU_CLIENT_KEY     — from developers.lulu.com > API Keys
 *   LULU_CLIENT_SECRET  — generated alongside the key
 *   LULU_API_BASE       — optional, defaults to https://api.lulu.com
 */

// Simple in-memory token cache per Node process
let cachedToken = null;
let cachedTokenExpiresAt = 0;

export async function getLuluAccessToken() {
  const now = Date.now();
  if (cachedToken && cachedTokenExpiresAt > now + 60_000) {
    return cachedToken;
  }

  const clientKey    = process.env.LULU_CLIENT_KEY;
  const clientSecret = process.env.LULU_CLIENT_SECRET;
  if (!clientKey || !clientSecret) {
    throw new Error('Missing LULU_CLIENT_KEY or LULU_CLIENT_SECRET environment variable.');
  }
  const apiBase = process.env.LULU_API_BASE || 'https://api.lulu.com';

  // Lulu's OAuth token endpoint (Keycloak-based)
  const tokenUrl = `${apiBase}/auth/realms/glasstree/protocol/openid-connect/token`;
  const basicAuth = Buffer.from(`${clientKey}:${clientSecret}`).toString('base64');

  const body = new URLSearchParams({ grant_type: 'client_credentials' });

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type':  'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Lulu auth failed (${res.status}): ${err.slice(0, 400)}`);
  }

  const json = await res.json();
  const token = json.access_token;
  const ttl   = (json.expires_in || 3600) * 1000;

  cachedToken = token;
  cachedTokenExpiresAt = now + ttl;
  return token;
}

// Convenience: wraps fetch with auth + JSON defaults.
export async function luluFetch(path, { method = 'GET', body, headers = {} } = {}) {
  const apiBase = process.env.LULU_API_BASE || 'https://api.lulu.com';
  const token = await getLuluAccessToken();

  const res = await fetch(`${apiBase}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type':  'application/json',
      'Accept':        'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    const message = (data && data.detail) || (typeof data === 'string' ? data : JSON.stringify(data));
    const err = new Error(`Lulu API ${res.status} ${path}: ${message}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// Standard 6×9 hardcover SKU used for keepsake books.
// Full SKU reference: https://api.lulu.com/print-job-cost-calculations/ (POD packages)
// SKU parts: Trim (0600X0900) + Color interior (FC) + Paper (CREAM) + ... etc
// This is a sensible default; can be made configurable later.
export const DEFAULT_POD_PACKAGE_ID = '0600X0900FCSTDPB080CW444MXX'; // 6x9 paperback cream — widely available
export const DEFAULT_HARDCOVER_ID   = '0600X0900FCSTDCW080CW444GXX'; // 6x9 hardcover cream

// CORS helper — allows innerroomjournal.com + localhost (dev)
export function setCors(res, origin = '') {
  const allowed = [
    'https://innerroomjournal.com',
    'https://www.innerroomjournal.com',
    'http://localhost:5173',
    'http://localhost:4173',
  ];
  const allow = allowed.includes(origin) ? origin : 'https://innerroomjournal.com';
  res.setHeader('Access-Control-Allow-Origin', allow);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
