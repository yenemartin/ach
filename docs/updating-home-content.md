# Updating Home Content

Each website can now read from a dedicated home profile file.

## Current Structure

- Active home profile: `apps/web/src/homes/harbor-hearth.js`
- Home selector: `apps/web/src/homes/index.js`
- Images and logo: `apps/web/public/brand/`
- Subdomain mapping: `apps/web/src/homes/index.js`

## Update Contact Info

Open `apps/web/src/homes/harbor-hearth.js` and edit:

- `homeProfile.phone`
- `homeProfile.phoneHref`
- `homeProfile.email`
- `homeProfile.address`
- `homeProfile.city`
- `homeProfile.languages`
- `homeProfile.subdomain`

## Configure The Contact Form

Each home file also includes:

- `contactForm.endpoint`
- `contactForm.successMessage`
- `contactForm.failureMessage`

Replace the placeholder endpoint with the hosted form URL for that home.

Example:

```js
export const contactForm = {
  endpoint: "https://formspree.io/f/abcde123",
  successMessage: "Thank you for reaching out. We will follow up soon.",
  failureMessage: "We could not send your message right now. Please try again."
};
```

The form now sends these fields:

- `homeKey`
- `homeName`
- `homeSubdomain`
- `inquiryType`
- `name`
- `phone`
- `email`
- `moveInTimeline`
- `message`

## Update Images

Put the new files in `apps/web/public/brand/`.

Then update these fields in `apps/web/src/homes/harbor-hearth.js`:

- `homeProfile.logo`
- `homeProfile.heroImage`
- `homeProfile.secondaryImage`
- `galleryImages`

Example:

```js
logo: "/brand/sunrise-logo.svg",
heroImage: "/brand/sunrise-front.jpg",
secondaryImage: "/brand/sunrise-bedroom.jpg"
```

## Add Another Home

1. Copy `apps/web/src/homes/harbor-hearth.js`
2. Rename it, for example:
   - `apps/web/src/homes/sunrise-garden.js`
3. Update all text, images, and contact info
4. Set that home's `homeProfile.subdomain`
5. Set that home's `contactForm.endpoint`
6. Register it in `apps/web/src/homes/index.js`

Example:

```js
import * as harborHearth from "./harbor-hearth";
import * as sunriseGarden from "./sunrise-garden";

export const homes = {
  "harbor-hearth": {
    key: "harbor-hearth",
    subdomain: "harbor-hearth.afhcares.com",
    aliases: [],
    ...harborHearth
  },
  "sunrise-garden": {
    key: "sunrise-garden",
    subdomain: "sunrise-garden.afhcares.com",
    aliases: [],
    ...sunriseGarden
  }
};
```

## Preview A Specific Home

Production routing is hostname-based. The site loads the matching home when the hostname matches a registered subdomain such as:

- `https://harbor-hearth.afhcares.com`
- `https://sunrise-garden.afhcares.com`

For local development and `pages.dev` previews, the site can still load a specific home from the query string:

- `http://localhost:4173/?home=harbor-hearth`
- `http://localhost:4173/?home=sunrise-garden`

If no `home` value is provided, it defaults to `harbor-hearth`.

## Publish Changes

After updating content:

1. Commit the changes
2. Push to `main`
3. Cloudflare Pages redeploys automatically
4. In Cloudflare Pages, attach the home's subdomain under `Custom domains`
