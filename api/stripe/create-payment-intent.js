/**
 * POST /api/stripe/create-payment-intent
 *
 * Creates a Stripe PaymentIntent for a keepsake book order.
 * Client uses the returned `clientSecret` with Stripe Elements to collect
 * payment. After payment success, the client can safely call
 * /api/lulu/create-print-job to create the real Lulu print job.
 *
 * Body:
 *   {
 *     amountCents: number,    // total to charge, e.g. 4900 for $49.00
 *     currency?: string,      // default 'usd'
 *     orderId?: string,       // our own id (for matching later)
 *     customerEmail?: string,
 *     babyName?: string,
 *     motherName?: string,
 *     shippingAddress?: object // for receipt only; NOT used to charge
 *   }
 *
 * Response:
 *   { clientSecret, paymentIntentId }
 */

import { getStripe, setCors } from './_config.js';

export default async function handler(req, res) {
  setCors(res, req.headers.origin);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  try {
    const stripe = getStripe();
    const {
      amountCents,
      currency = 'usd',
      orderId,
      customerEmail,
      babyName,
      motherName,
      shippingAddress,
    } = req.body || {};

    if (!amountCents || amountCents < 100) {
      return res.status(400).json({ error: 'amountCents is required and must be >= 100 (one dollar)' });
    }

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amountCents),
      currency,
      automatic_payment_methods: { enabled: true },
      description: `Keepsake book${babyName ? ` — The Story of ${babyName}` : ''}`,
      receipt_email: customerEmail,
      metadata: {
        orderId:     orderId || '',
        babyName:    babyName || '',
        motherName:  motherName || '',
        source:      'inner-room-journal-nursery',
      },
      shipping: shippingAddress ? {
        name: shippingAddress.name,
        phone: shippingAddress.phone_number,
        address: {
          line1: shippingAddress.street1,
          line2: shippingAddress.street2 || undefined,
          city:  shippingAddress.city,
          state: shippingAddress.state_code,
          postal_code: shippingAddress.postcode,
          country: shippingAddress.country_code,
        },
      } : undefined,
    });

    return res.status(200).json({
      clientSecret:     intent.client_secret,
      paymentIntentId:  intent.id,
    });
  } catch (err) {
    console.error('create-payment-intent error', err);
    return res.status(500).json({ error: err.message || 'Failed to create payment intent' });
  }
}
