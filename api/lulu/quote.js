/**
 * POST /api/lulu/quote
 * Returns a print + ship cost estimate from Lulu for a given page count,
 * book SKU, and shipping address. No commitment — just a price quote.
 *
 * Body:
 *   {
 *     pageCount: number,
 *     quantity?: number (default 1),
 *     shippingAddress: { name, street1, city, state_code, country_code, postcode, phone_number },
 *     podPackageId?: string (defaults to 6x9 hardcover cream),
 *     shippingLevel?: 'MAIL'|'GROUND'|'EXPEDITED'|'EXPRESS' (default GROUND)
 *   }
 *
 * Response:
 *   {
 *     lineItem: { total, unit, shipping, taxes, currency },
 *     shippingOptions: [...],
 *     raw: <full lulu response>
 *   }
 */

import { luluFetch, DEFAULT_HARDCOVER_ID, setCors } from './_auth.js';

export default async function handler(req, res) {
  setCors(res, req.headers.origin);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { pageCount, quantity = 1, shippingAddress, podPackageId = DEFAULT_HARDCOVER_ID, shippingLevel = 'GROUND' } = req.body || {};

    if (!pageCount || pageCount < 32) {
      return res.status(400).json({ error: 'pageCount is required and must be at least 32' });
    }
    if (!shippingAddress) {
      return res.status(400).json({ error: 'shippingAddress is required' });
    }

    const body = {
      line_items: [{
        page_count: pageCount,
        pod_package_id: podPackageId,
        quantity,
      }],
      shipping_address: shippingAddress,
      shipping_option: shippingLevel,
    };

    const data = await luluFetch('/print-job-cost-calculations/', {
      method: 'POST',
      body,
    });

    const lineItem = data.line_item_costs?.[0] || {};
    const shippingCost = data.shipping_cost || {};
    const taxes = data.total_tax || '0.00';
    const total = data.total_cost_incl_tax || '0.00';
    const currency = data.currency || 'USD';

    return res.status(200).json({
      lineItem: {
        unit:        lineItem.total_cost_excl_discounts || lineItem.cost_excl_discounts || '0',
        total:       lineItem.total_cost_incl_discounts || lineItem.cost_incl_discounts || '0',
        shipping:    shippingCost.total_cost_incl_tax || '0',
        taxes,
        currency,
      },
      total,
      currency,
      raw: data,
    });
  } catch (err) {
    console.error('Lulu quote error', err);
    return res.status(err.status || 500).json({
      error: err.message || 'Failed to get quote',
      details: err.data || null,
    });
  }
}
