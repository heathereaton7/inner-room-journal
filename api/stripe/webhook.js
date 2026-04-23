/**
 * POST /api/stripe/webhook
 *
 * Receives Stripe events. Verifies signature via the webhook signing secret.
 * On payment_intent.succeeded we could trigger fulfillment here, but we
 * instead let the client initiate the Lulu print job immediately after
 * payment confirmation on its side (simpler UX).
 *
 * This endpoint exists to keep a durable log of payment outcomes.
 *
 * Required env var: STRIPE_WEBHOOK_SECRET (from Stripe Dashboard → Webhooks)
 */

import { getStripe } from './_config.js';

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const stripe = getStripe();
    const signature = req.headers['stripe-signature'];
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) return res.status(500).json({ error: 'Missing STRIPE_WEBHOOK_SECRET' });

    // Read raw body
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const rawBody = Buffer.concat(chunks);

    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch (err) {
      console.warn('Stripe signature verification failed', err.message);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log('[Stripe] payment succeeded', {
          id:       event.data.object.id,
          amount:   event.data.object.amount,
          metadata: event.data.object.metadata,
        });
        break;
      case 'payment_intent.payment_failed':
        console.warn('[Stripe] payment failed', {
          id:       event.data.object.id,
          reason:   event.data.object.last_payment_error?.message,
        });
        break;
      case 'charge.refunded':
        console.log('[Stripe] charge refunded', { id: event.data.object.id });
        break;
      default:
        // ignore events we don't handle
        break;
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('stripe webhook error', err);
    return res.status(500).json({ error: err.message });
  }
}
