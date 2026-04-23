/**
 * POST /api/lulu/webhook
 * Receives status updates from Lulu when a print job changes state:
 *   CREATED → IN_PRODUCTION → PRINTED → SHIPPED → DELIVERED (or CANCELLED / REJECTED)
 *
 * You configure this URL in your Lulu developer dashboard:
 *   https://developers.lulu.com/user-profile/payment-and-billing/integrations
 *
 * Lulu signs webhooks with HMAC-SHA256 using the secret you set in their dashboard.
 * We verify the signature via the X-Lulu-HMAC-SHA256 header.
 *
 * For now this endpoint logs the event and returns 200. In Phase 3 we'll:
 *   1. Look up the order in Firestore by external_id
 *   2. Update its status + tracking info
 *   3. Email the customer
 *
 * Required env var: LULU_WEBHOOK_SECRET (set this in both Vercel AND Lulu)
 */

import { createHmac } from 'node:crypto';

// Keep raw body for signature verification
export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Read raw body
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const rawBody = Buffer.concat(chunks).toString('utf8');

    // Verify HMAC signature if secret is configured
    const secret = process.env.LULU_WEBHOOK_SECRET;
    const signature = req.headers['x-lulu-hmac-sha256'];

    if (secret) {
      if (!signature) {
        console.warn('Webhook missing signature header');
        return res.status(401).json({ error: 'missing signature' });
      }
      const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
      if (expected !== signature) {
        console.warn('Webhook signature mismatch');
        return res.status(401).json({ error: 'invalid signature' });
      }
    }

    let event;
    try { event = JSON.parse(rawBody); }
    catch { return res.status(400).json({ error: 'invalid json' }); }

    const topic = event.topic || 'unknown';
    const data  = event.data  || {};

    // TODO (Phase 3): persist to Firestore and notify user
    // For now just log so we can confirm webhook delivery end-to-end.
    console.log('[Lulu Webhook]', {
      topic,
      printJobId:     data.id,
      externalId:     data.external_id,
      status:         data.status?.name,
      trackingUrl:    data.line_items?.[0]?.tracking_urls?.[0],
    });

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook error', err);
    return res.status(500).json({ error: err.message });
  }
}
