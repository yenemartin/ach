# Onboarding A New Home

This document is the end-to-end checklist for launching a new adult family home site on the `afhcares.com` platform.

Use it when you need to set up a new home from scratch, update branding and photos, connect contact details, attach a subdomain, and verify the inquiry form.

## What You Need Before You Start

- home name
- short slug for the home
- final phone number
- final email address
- street address
- city and languages
- logo file
- exterior photo
- bedroom photo
- living room or shared-space photo
- short home description and care details
- desired subdomain

## Naming Rules

Use one short slug per home. Keep it lowercase and hyphenated.

Examples:

- `harbor-hearth`
- `cedar-grove`
- `mmengesha`

That slug is used in three places:

- the home profile filename
- the registry key in `apps/web/src/homes/index.js`
- the subdomain, such as `mmengesha.afhcares.com`

## Files You Will Touch

- home content file:
  - `apps/web/src/homes/harbor-hearth.js`
- home registry:
  - `apps/web/src/homes/index.js`
- images and logos:
  - `apps/web/public/brand/`

## Step 1. Create The Home Content File

Copy an existing home file and rename it to the new slug.

Example:

```text
apps/web/src/homes/mmengesha.js
```

A home file should include:

- `homeProfile`
- `contactForm`
- `defaultTheme`
- `careHighlights`
- `serviceHighlights`
- `serviceOfferings`
- `livingFeatures`
- `experienceSteps`
- `galleryImages`
- `faqs`

## Step 2. Update Brand And Identity

Inside the new home file, update:

- `homeProfile.name`
- `homeProfile.brandName`
- `homeProfile.brandInitials`
- `homeProfile.brandPrimaryColor`
- `homeProfile.logo`

Notes:

- `brandPrimaryColor` is the fastest way to tune the site look
- if the logo is finalized, use a color that matches the logo
- the page theme inherits from the home brand styling

## Step 3. Update Contact Details

Inside the home file, update:

- `homeProfile.phone`
- `homeProfile.phoneHref`
- `homeProfile.email`
- `homeProfile.address`
- `homeProfile.city`
- `homeProfile.languages`
- `homeProfile.subdomain`

Phone format:

- display format:
  - `"(425) 495-9974"`
- link format:
  - `"14254959974"`

## Step 4. Add Pictures And Logo

Put the image files into:

- `apps/web/public/brand/`

Recommended assets:

- logo
- exterior hero photo
- private room photo
- shared living area photo

Then update these fields in the home file:

- `homeProfile.logo`
- `homeProfile.heroImage`
- `homeProfile.secondaryImage`
- `galleryImages`

Example:

```js
logo: "/brand/mmengesha-logo.svg",
heroImage: "/brand/mmengesha-exterior.jpg",
secondaryImage: "/brand/mmengesha-bedroom.jpg"
```

Gallery example:

```js
export const galleryImages = [
  {
    title: "Welcoming exterior",
    caption: "A quiet residential setting with a calm, approachable feel.",
    alt: "Exterior view of the home",
    src: "/brand/mmengesha-exterior.jpg"
  },
  {
    title: "Shared living room",
    caption: "A bright common area for conversation, rest, and daily comfort.",
    alt: "Shared living room inside the home",
    src: "/brand/mmengesha-living-room.jpg"
  },
  {
    title: "Private room option",
    caption: "A simple, restful room designed to feel comfortable and home-like.",
    alt: "Private bedroom inside the home",
    src: "/brand/mmengesha-bedroom.jpg"
  }
];
```

## Step 5. Update The Copy

Review and replace any sample text in the new home file, especially:

- `tagline`
- `description`
- `story`
- `signatureNote`
- `quickFacts`
- `careHighlights`
- `serviceOfferings`
- `livingFeatures`
- `experienceSteps`
- `faqs`

Goal:

- make the home feel warm, personal, and trustworthy
- keep answers simple and easy to scan
- avoid anything that sounds clinical or generic

## Step 6. Register The Home

Open:

- `apps/web/src/homes/index.js`

Add the new home to the registry.

Example:

```js
import * as mmengesha from "./mmengesha";

export const homes = {
  "harbor-hearth": {
    key: "harbor-hearth",
    subdomain: "harbor-hearth.afhcares.com",
    aliases: [],
    ...harborHearth
  },
  mmengesha: {
    key: "mmengesha",
    subdomain: "mmengesha.afhcares.com",
    aliases: [],
    ...mmengesha
  }
};
```

## Step 7. Local Preview

For local development or Pages preview links, open:

```text
http://localhost:4173/?home=mmengesha
```

Production selection is hostname-based, but local preview still supports `?home=...`.

## Step 8. Contact Form Configuration

Keep this in the home file:

```js
export const contactForm = {
  endpoint: "/api/inquiries",
  successMessage: "Thank you for reaching out. We will follow up soon.",
  failureMessage: "We could not send your message right now. Please try again."
};
```

Do not hardcode the webhook URL in the home file.

The real forwarding target lives in Cloudflare Pages as:

- `INQUIRY_WEBHOOK_URL`

Recommended value format:

```text
https://afhcares-inquiry-worker.<your-workers-subdomain>.workers.dev/capture?token=<INBOUND_TOKEN>
```

More detail:

- `docs/cloudflare-inquiry-worker.md`
- `docs/email-notifications.md`

## Step 9. Cloudflare Pages Custom Domain

In Cloudflare Pages:

1. Open the `afhcares-site` Pages project
2. Go to `Custom domains`
3. Add the new subdomain

Example:

```text
mmengesha.afhcares.com
```

Wait until the status shows active.

## Step 10. Cloudflare DNS Record

Important:

- if `afhcares.com` uses Cloudflare nameservers, live DNS records must be created in Cloudflare DNS
- Route 53 records will not control live traffic unless the domain is delegated back to AWS

For each home subdomain, create this DNS record in Cloudflare:

- `Type`: `CNAME`
- `Name`: the home slug, such as `mmengesha`
- `Target`: `afhcares-site.pages.dev`

Recommended first setting:

- `Proxy status`: `DNS only`

Example:

```text
mmengesha -> CNAME -> afhcares-site.pages.dev
```

## Step 11. Worker And Lead Capture Check

The inquiry Worker should already be live.

Health check:

```text
https://afhcares-inquiry-worker.<your-workers-subdomain>.workers.dev/health
```

Setup check:

```text
https://afhcares-inquiry-worker.<your-workers-subdomain>.workers.dev/setup
```

The setup response should show:

- `hasInboundToken: true`
- `hasAdminToken: true`
- `hasKvBinding: true`

## Step 12. Publish

After content changes:

1. Commit the changes
2. Push to `main`
3. Wait for Cloudflare Pages to redeploy

## Step 13. Final Launch Checks

Open the live subdomain and verify:

- logo appears correctly
- brand color/theme looks right
- hero image is correct
- gallery images are correct
- phone number is correct
- email address is correct
- address is correct
- call button works
- contact form shows success after submit

Then verify inquiry capture:

```text
https://afhcares-inquiry-worker.<your-workers-subdomain>.workers.dev/inquiries?token=<ADMIN_TOKEN>
```

Make sure the new inquiry appears there.

## Common Problems

### The subdomain does not load

Check:

- the subdomain is attached in Cloudflare Pages
- the DNS record exists in Cloudflare DNS
- the record points to `afhcares-site.pages.dev`

### SSL error on the subdomain

Usually this is propagation.

Check:

- Pages custom domain status is active
- DNS record is correct
- wait a few minutes for SSL to finish provisioning

### The form shows an error

Check:

- `INQUIRY_WEBHOOK_URL` is set in Pages
- the Worker `/health` endpoint works
- the Worker `/setup` endpoint shows the secrets and KV binding

### Route 53 record exists but the site still fails

Check the active nameservers.

If `afhcares.com` is using Cloudflare nameservers, Route 53 is not authoritative for live traffic.

## Suggested Per-Home Asset Naming

Keep filenames consistent:

- `/brand/mmengesha-logo.svg`
- `/brand/mmengesha-exterior.jpg`
- `/brand/mmengesha-bedroom.jpg`
- `/brand/mmengesha-living-room.jpg`

## Related Docs

- `docs/updating-home-content.md`
- `docs/deploy-cloudflare-pages.md`
- `docs/cloudflare-inquiry-worker.md`
