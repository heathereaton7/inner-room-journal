/**
 * POST /api/lulu/create-print-job
 * Creates a real print job on Lulu. Lulu prints and ships directly to customer.
 *
 * Body:
 *   {
 *     title: string,             // e.g. "The Story of Little Tulip"
 *     interiorUrl: string,       // public PDF URL (from /api/lulu/upload-book)
 *     coverUrl: string,          // public PDF URL (from /api/lulu/upload-book)
 *     pageCount: number,
 *     quantity?: number (default 1),
 *     podPackageId?: string (default 6x9 hardcover cream),
 *     shippingLevel?: 'MAIL'|'GROUND'|'EXPEDITED'|'EXPRESS' (default GROUND),
 *     shippingAddress: {
 *       name, street1, street2?, city, state_code, country_code, postcode, phone_number, email?
 *     },
 *     externalId?: string,       // our own order id for matching webhooks
 *     contactEmail: string       // for Lulu order notifications
 *   }
 *
 * Response:
 *   {
 *     id: <lulu print job id>,
 *     status: <status>,
 *     trackingUrl?: string,
 *     raw: <full lulu response>
 *   }
 */

import { luluFetch, DEFAULT_HARDCOVER_ID, setCors } from './_auth.js';

export default async function handler(req, res) {
  setCors(res, req.headers.origin);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      title,
      interiorUrl,
      coverUrl,
      pageCount,
      quantity = 1,
      podPackageId = DEFAULT_HARDCOVER_ID,
      shippingLevel = 'MAIL',
      shippingAddress,
      externalId,
      contactEmail,
    } = req.body || {};

    // Validate inputs
    if (!title)           return res.status(400).json({ error: 'title is required' });
    if (!interiorUrl)     return res.status(400).json({ error: 'interiorUrl is required' });
    if (!coverUrl)        return res.status(400).json({ error: 'coverUrl is required' });
    if (!pageCount)       return res.status(400).json({ error: 'pageCount is required' });
    if (!shippingAddress) return res.status(400).json({ error: 'shippingAddress is required' });
    if (!contactEmail)    return res.status(400).json({ error: 'contactEmail is required' });

    // Validate shipping address has required Lulu fields
    const requiredAddrFields = ['name', 'street1', 'city', 'country_code', 'postcode', 'phone_number'];
    for (const f of requiredAddrFields) {
      if (!shippingAddress[f]) {
        return res.status(400).json({ error: `shippingAddress.${f} is required` });
      }
    }

    const body = {
      contact_email: contactEmail,
      external_id: externalId || `irj-${Date.now()}`,
      line_items: [{
        title,
        cover: {
          source_url: coverUrl,
        },
        interior: {
          source_url: interiorUrl,
        },
        pod_package_id: podPackageId,
        quantity,
      }],
      shipping_address: shippingAddress,
      shipping_level: shippingLevel,
    };

    const data = await luluFetch('/print-jobs/', {
      method: 'POST',
      body,
    });

    return res.status(200).json({
      id: data.id,
      status: data.status?.name || 'CREATED',
      externalId: data.external_id,
      trackingUrl: data.line_items?.[0]?.tracking_urls?.[0] || null,
      estimatedShipping: data.estimated_shipping_dates,
      raw: data,
    });
  } catch (err) {
    console.error('Lulu create-print-job error', err);
    return res.status(err.status || 500).json({
      error: err.message || 'Failed to create print job',
      details: err.data || null,
    });
  }
}
