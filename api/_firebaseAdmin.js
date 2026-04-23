/**
 * Firebase Admin SDK initialization for serverless Firestore writes.
 *
 * Required env var: FIREBASE_SERVICE_ACCOUNT
 *   Paste the full contents of the service-account JSON file (from
 *   Firebase Console → Project Settings → Service Accounts → Generate new
 *   private key) as a single-line JSON string.
 *
 * Example:
 *   FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"...",...}'
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let cachedDb = null;

export function getAdminDb() {
  if (cachedDb) return cachedDb;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT env var');
  }

  let creds;
  try {
    creds = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (err) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is not valid JSON: ' + err.message);
  }

  // Normalize escaped newlines in the private key
  if (creds.private_key) {
    creds.private_key = creds.private_key.replace(/\\n/g, '\n');
  }

  const app = getApps().length
    ? getApps()[0]
    : initializeApp({ credential: cert(creds) });

  cachedDb = getFirestore(app);
  return cachedDb;
}

/**
 * Update a pregnancy order by its externalId (our own id) or by Lulu print job id.
 * Safe no-op if the order doesn't exist yet (webhooks can arrive before we
 * finish writing the order doc from the client).
 */
export async function updateOrderStatus({ externalId, luluPrintJobId, status, trackingUrl, extra = {} }) {
  const db = getAdminDb();
  const col = db.collection('pregnancy_orders');

  // Find by externalId first (this is our own id)
  let docRef = null;
  if (externalId) {
    const snap = await col.where('externalId', '==', externalId).limit(1).get();
    if (!snap.empty) docRef = snap.docs[0].ref;
  }
  if (!docRef && luluPrintJobId) {
    const snap = await col.where('luluPrintJobId', '==', luluPrintJobId).limit(1).get();
    if (!snap.empty) docRef = snap.docs[0].ref;
  }

  if (!docRef) {
    console.warn('updateOrderStatus: order not found for', { externalId, luluPrintJobId });
    return null;
  }

  const update = {
    ...extra,
    status,
    updatedAt: new Date().toISOString(),
  };
  if (trackingUrl) update.trackingUrl = trackingUrl;
  if (luluPrintJobId && !extra.luluPrintJobId) update.luluPrintJobId = luluPrintJobId;

  await docRef.set(update, { merge: true });
  return docRef.id;
}
