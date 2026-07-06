# Cloudflare Inquiry Worker

This is the lowest-cost lead-capture option in the current stack.

Instead of paying for a third-party form tool, the Pages site can forward inquiries to a small Cloudflare Worker that stores them in Cloudflare KV.

## What It Does

- accepts inquiry submissions from the Pages function
- stores each inquiry in KV
- gives you a protected JSON endpoint to review recent inquiries
- avoids adding AWS or a paid monthly form service

Worker source:

- `cloudflare/inquiry-worker/src/index.js`
- `cloudflare/inquiry-worker/wrangler.toml`

## Worker Endpoints

- `POST /capture`
  - receives inquiries from the Pages function
- `GET /inquiries`
  - returns recent inquiries from KV
  - protected by an admin token
- `GET /health`
  - simple health check
- `GET /setup`
  - confirms whether secrets are present

## 1. Create A KV Namespace

In Cloudflare, create a KV namespace for inquiries.

Suggested name:

- `afhcares-inquiries`

Then copy the namespace ID into:

- `cloudflare/inquiry-worker/wrangler.toml`

Replace:

```toml
id = "REPLACE_WITH_KV_NAMESPACE_ID"
```

with your real namespace ID.

## 2. Deploy The Worker

Create a new Worker in Cloudflare and use the files from:

- `cloudflare/inquiry-worker/`

Use this worker name if available:

- `afhcares-inquiry-worker`

After deploy, your worker URL will look like:

```text
https://afhcares-inquiry-worker.<your-subdomain>.workers.dev
```

## 3. Add Worker Secrets

Add these two secrets in the Worker settings:

- `INBOUND_TOKEN`
- `ADMIN_TOKEN`

Use long random strings for both.

Example shape:

```text
INBOUND_TOKEN = 6f3a1c9c4d5e7a8b9c0d1e2f3a4b5c6d
ADMIN_TOKEN   = 2d9f7a1b8c4e6f0a3d5c7b9e1f2a4c6e
```

## 4. Set The Pages Environment Variable

In your Cloudflare Pages project, set:

- `INQUIRY_WEBHOOK_URL`

Value:

```text
https://afhcares-inquiry-worker.<your-subdomain>.workers.dev/capture?token=<INBOUND_TOKEN>
```

Example:

```text
https://afhcares-inquiry-worker.example-subdomain.workers.dev/capture?token=6f3a1c9c4d5e7a8b9c0d1e2f3a4b5c6d
```

That is the exact kind of value to paste into Pages.

## 5. View Captured Inquiries

To view recent inquiries, open:

```text
https://afhcares-inquiry-worker.<your-subdomain>.workers.dev/inquiries?token=<ADMIN_TOKEN>
```

Example:

```text
https://afhcares-inquiry-worker.example-subdomain.workers.dev/inquiries?token=2d9f7a1b8c4e6f0a3d5c7b9e1f2a4c6e
```

This returns JSON so you can confirm submissions are being captured.

## Example Inquiry Payload

The Worker expects the same payload already sent by the Pages function:

```json
{
  "homeKey": "harbor-hearth",
  "homeName": "Harbor Hearth Adult Family Home",
  "homeSubdomain": "harbor-hearth.afhcares.com",
  "inquiryType": "tour_request",
  "name": "Jane Doe",
  "phone": "(206) 555-0101",
  "email": "jane@example.com",
  "moveInTimeline": "Within 30 days",
  "message": "We are looking for a peaceful home near Seattle.",
  "submittedAt": "2026-07-06T18:30:00.000Z"
}
```

## Test Flow

1. Deploy the Worker
2. Set `INQUIRY_WEBHOOK_URL` in Cloudflare Pages
3. Redeploy the Pages site
4. Submit the contact form from a live home page
5. Open the Worker `GET /inquiries` URL with the admin token
6. Confirm the inquiry appears in the list

## Notes

- This is storage-first, not email-first
- It is good for low-cost launch and demos
- Later, the Worker can also forward inquiries to email, Slack, or another automation target
