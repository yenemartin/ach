# Deploy To Cloudflare Pages

This project can be deployed without AWS.

## Recommended Setup

- Hosting: Cloudflare Pages
- Domain: `afhcares.com`
- Site type: static
- Inquiry handling: Cloudflare Pages Function + webhook forwarding

## Cloudflare Pages Settings

- Production branch: your main branch
- Framework preset: `Vite`
- Root directory: `apps/web`
- Build command: `npm run build`
- Output directory: `dist`

## Domain Setup

After the first successful deployment:

1. Open the Pages project in Cloudflare.
2. Add the custom domain `afhcares.com`.
3. Optionally add `www.afhcares.com`.
4. Update DNS or nameservers as Cloudflare instructs.

## Contact Form Setup

The site now posts inquiries to the Cloudflare Pages Function at:

```text
/api/inquiries
```

In Cloudflare Pages, add this environment variable:

- `INQUIRY_WEBHOOK_URL`

That webhook can point to the destination you want to use for lead delivery, such as:

- a private automation endpoint
- a Google Apps Script webhook
- a Make or Zapier webhook
- another service you control

If `INQUIRY_WEBHOOK_URL` is not configured, the form will return an error instead of silently pretending to work.
