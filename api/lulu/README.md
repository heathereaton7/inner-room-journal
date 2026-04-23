# Lulu Direct Print-on-Demand Integration

Phase 2 of the Keepsake Book feature. These serverless functions run on Vercel
and let the Nursery quote, create, and track real print jobs with Lulu.

## Endpoints

| Method | Path                            | Purpose |
|--------|---------------------------------|---------|
| POST   | `/api/lulu/quote`               | Get print + ship cost for a given book |
| POST   | `/api/lulu/upload-book`         | Upload a PDF (interior or cover) to Vercel Blob |
| POST   | `/api/lulu/create-print-job`    | Create a real print job (books gets printed + shipped) |
| POST   | `/api/lulu/webhook`             | Receives status updates from Lulu |

## Setup — one-time

### 1. Vercel environment variables

Go to **Vercel → your project → Settings → Environment Variables** and add:

| Name                    | Value                                    | Environments        |
|-------------------------|------------------------------------------|---------------------|
| `LULU_CLIENT_KEY`       | (from developers.lulu.com → API Keys)    | Production, Preview |
| `LULU_CLIENT_SECRET`    | (ditto)                                  | Production, Preview |
| `LULU_API_BASE`         | `https://api.lulu.com`                   | Production, Preview |
| `LULU_WEBHOOK_SECRET`   | (make up any random string, then set same value in Lulu dashboard) | Production, Preview |
| `BLOB_READ_WRITE_TOKEN` | auto-populated when you enable Vercel Blob below | all |

After saving, trigger a redeploy (push any commit, or click **Redeploy** on the latest deployment).

### 2. Enable Vercel Blob

1. In your Vercel dashboard go to **Storage** → **Create Database** → **Blob**.
2. Name it `inner-room-blob` (or anything).
3. Connect it to your `inner-room-journal` project.
4. Vercel automatically sets the `BLOB_READ_WRITE_TOKEN` env var.

### 3. Configure Lulu webhook

1. Go to **developers.lulu.com → Payment & Billing → Integrations**.
2. Add a webhook with URL: `https://innerroomjournal.com/api/lulu/webhook`
3. Set the HMAC secret to the same value you used for `LULU_WEBHOOK_SECRET` above.
4. Subscribe to events: `PRINT_JOB_STATUS_CHANGED` (at minimum).

### 4. Rotate the initial API keys (recommended)

Because the original keys were shared in chat during setup, regenerate them:

1. Go to **developers.lulu.com → API Keys**.
2. Click **Generate new secret**.
3. Copy the new secret.
4. Update `LULU_CLIENT_SECRET` in Vercel with the new value.
5. Redeploy.

(The Client Key stays the same — only the secret changes.)

## Testing

### Quick auth test

```sh
curl -X POST https://innerroomjournal.com/api/lulu/quote \
  -H "Content-Type: application/json" \
  -d '{
    "pageCount": 80,
    "shippingAddress": {
      "name": "Test User",
      "street1": "123 Main St",
      "city": "Austin",
      "state_code": "TX",
      "country_code": "US",
      "postcode": "78701",
      "phone_number": "5125551212"
    }
  }'
```

Expected: a JSON response with print + shipping cost. If you get a 500 with
`Missing LULU_CLIENT_KEY`, the env vars aren't populated yet.

### Full order test

Phase 2 will add an "Order a hardcover copy" button inside The Nursery that
wires the three endpoints together end-to-end.

## Book format

All keepsake books use:
- Trim: 6" × 9"
- Binding: hardcover
- Interior paper: cream
- Default SKU: `0600X0900FCSTDCW080CW444GXX` (6×9 hardcover cream)

Override via `podPackageId` in the request body if you add other formats later.

## Cost expectations (rough)

For a typical 120-page hardcover to US address:
- Print cost:  ~$15
- Shipping:    ~$8 (ground)
- **Your cost: ~$23**

Suggested retail: **$49** — leaves ~$26 margin after Stripe fees.
