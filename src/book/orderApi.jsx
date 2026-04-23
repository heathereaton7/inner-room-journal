/* Client-side helper for calling /api/lulu/* and /api/stripe/* endpoints */

const API_BASE = '/api/lulu';
const STRIPE_BASE = '/api/stripe';

async function postJson(path, body, base = API_BASE) {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error || `${res.status} error`;
    throw new Error(msg);
  }
  return data;
}

// ─── Stripe ─────────────────────────────────────────────────────
export async function createPaymentIntent({ amountCents, currency = 'usd', orderId, customerEmail, babyName, motherName, shippingAddress }) {
  return postJson('/create-payment-intent', {
    amountCents, currency, orderId, customerEmail, babyName, motherName, shippingAddress,
  }, STRIPE_BASE);
}

// Compute what to charge the customer given Lulu's total cost.
// Formula: Lulu cost + flat-tiered markup.
export function computeCustomerPrice(luluTotal, currency = 'USD') {
  const base = Number(luluTotal) || 0;
  let markup = 20;
  if (base > 30) markup = 25;
  if (base > 50) markup = 30;
  const total = base + markup;
  return {
    luluCost: base,
    markup,
    total: Math.round(total * 100) / 100,
    currency,
  };
}

export async function getBookQuote({ pageCount, shippingAddress, quantity = 1, shippingLevel = 'MAIL', podPackageId }) {
  return postJson('/quote', { pageCount, shippingAddress, quantity, shippingLevel, podPackageId });
}

export async function uploadBookPdf({ kind, bookId, blob }) {
  const res = await fetch(`${API_BASE}/upload-book?kind=${kind}&bookId=${encodeURIComponent(bookId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/pdf' },
    body: blob,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Upload failed (${res.status})`);
  return data; // { url, pathname }
}

export async function createPrintOrder({
  title, interiorUrl, coverUrl, pageCount, quantity = 1,
  podPackageId, shippingLevel = 'GROUND', shippingAddress, externalId, contactEmail,
}) {
  return postJson('/create-print-job', {
    title, interiorUrl, coverUrl, pageCount, quantity,
    podPackageId, shippingLevel, shippingAddress, externalId, contactEmail,
  });
}

// Generate interior + cover PDFs, upload both, return URLs + page count.
// The caller passes the pregnancy state + current week.
export async function buildAndUploadBook({ pregnancy, motherName, currentWeek, dedication, bookId }) {
  const [{ pdf }, { PREGNANCY_WEEKS }, { default: PregnancyBookDocument }, { default: PregnancyCoverDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('../data/pregnancyWeeks.js'),
    import('./PregnancyBookDocument.jsx'),
    import('./PregnancyCoverDocument.jsx'),
  ]);

  const weeksToInclude = PREGNANCY_WEEKS.slice(0, Math.min(40, currentWeek || 1));

  // 1. Interior PDF
  const interiorDoc = (
    <PregnancyBookDocument
      pregnancy={{ ...pregnancy, bookDedication: dedication, motherName }}
      motherName={motherName || 'Mama'}
      weeksData={weeksToInclude}
      dedication={dedication}
    />
  );
  const interiorBlob = await pdf(interiorDoc).toBlob();
  // Crude page count heuristic: use file size to estimate, or trust the known layout.
  // More reliable: parse the PDF or have the component report pages. For now:
  const estimatedPages = 6 + weeksToInclude.length + (pregnancy.letters?.length || 0) + (Object.keys(pregnancy.milestones || {}).length > 0 ? 2 : 0);
  // Lulu requires a minimum — round up and make even
  const pageCount = Math.max(32, estimatedPages % 2 === 0 ? estimatedPages : estimatedPages + 1);

  // 2. Cover PDF (needs page count to compute spine)
  const coverDoc = (
    <PregnancyCoverDocument
      pregnancy={{ ...pregnancy, motherName }}
      motherName={motherName || 'Mama'}
      pageCount={pageCount}
    />
  );
  const coverBlob = await pdf(coverDoc).toBlob();

  // 3. Upload both
  const [interior, cover] = await Promise.all([
    uploadBookPdf({ kind: 'interior', bookId, blob: interiorBlob }),
    uploadBookPdf({ kind: 'cover',    bookId, blob: coverBlob }),
  ]);

  return {
    interiorUrl: interior.url,
    coverUrl:    cover.url,
    pageCount,
  };
}
