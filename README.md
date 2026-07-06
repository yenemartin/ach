# ACH

ACH is now set up as a **static marketing-site prototype** for an adult family home brand under `afhcares.com`.

The current version is intentionally simple:

- brochure-style homepage
- photo-forward layout
- care highlights, FAQs, and testimonials
- clear phone, email, and tour-request calls to action
- no required backend for launch

This keeps hosting and maintenance as close to zero as possible.

## Current Direction

The fastest low-cost path is:

- build the site in `apps/web`
- deploy it as a static site on Cloudflare Pages
- point `afhcares.com` to the production deployment
- use the Cloudflare Pages inquiry endpoint plus the Cloudflare Inquiry Worker for lead capture

This repo still contains earlier backend and AWS exploration work, but the current launch path does **not** depend on AWS.

## Repo Layout

```text
apps/
  api/   earlier backend prototype work
  web/   current static marketing site
docs/
infra/
scripts/
```

## Local Development

From [apps/web](C:/Users/mirth/OneDrive/Documents/restaurant%20web%20service/ach/apps/web):

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

## Cloudflare Pages

Recommended Cloudflare Pages settings:

- Framework preset: `Vite`
- Root directory: `apps/web`
- Build command: `npm run build`
- Output directory: `dist`

Quick guide:

- [docs/deploy-cloudflare-pages.md](C:/Users/mirth/OneDrive/Documents/restaurant%20web%20service/ach/docs/deploy-cloudflare-pages.md)
- [docs/cloudflare-inquiry-worker.md](C:/Users/mirth/OneDrive/Documents/restaurant%20web%20service/ach/docs/cloudflare-inquiry-worker.md)

## Next Best Improvements

1. Replace placeholder images and text with real home content.
2. Finalize Cloudflare inquiry capture secrets and live-domain testing.
3. Add a Google Map embed and final contact details.
4. Add favicon, SEO tags, and social share preview image.

## Inquiry Capture

The current form flow is:

- browser submits to `/api/inquiries`
- Cloudflare Pages Function validates the payload
- Pages forwards the payload to `INQUIRY_WEBHOOK_URL`

Recommended webhook target:

- [docs/cloudflare-inquiry-worker.md](C:/Users/mirth/OneDrive/Documents/restaurant%20web%20service/ach/docs/cloudflare-inquiry-worker.md)
