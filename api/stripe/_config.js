/**
 * Shared Stripe SDK init + CORS helper.
 * Reads STRIPE_SECRET_KEY from Vercel env (never committed).
 */

import Stripe from 'stripe';

let cachedStripe = null;
export function getStripe() {
  if (cachedStripe) return cachedStripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY env var');
  cachedStripe = new Stripe(key, {
    // pin a stable API version; bump intentionally when upgrading
    apiVersion: '2024-06-20',
  });
  return cachedStripe;
}

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
