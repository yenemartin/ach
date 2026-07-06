# Updating Home Content

Each website can now read from a dedicated home profile file.

## Current Structure

- Active home profile: `apps/web/src/homes/harbor-hearth.js`
- Home selector: `apps/web/src/homes/index.js`
- Images and logo: `apps/web/public/brand/`

## Update Contact Info

Open `apps/web/src/homes/harbor-hearth.js` and edit:

- `homeProfile.phone`
- `homeProfile.phoneHref`
- `homeProfile.email`
- `homeProfile.address`
- `homeProfile.city`
- `homeProfile.languages`

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
4. Register it in `apps/web/src/homes/index.js`

Example:

```js
import * as harborHearth from "./harbor-hearth";
import * as sunriseGarden from "./sunrise-garden";

export const homes = {
  "harbor-hearth": { key: "harbor-hearth", ...harborHearth },
  "sunrise-garden": { key: "sunrise-garden", ...sunriseGarden }
};
```

## Preview A Specific Home

The site can load a specific home from the query string:

- `http://localhost:4173/?home=harbor-hearth`
- `http://localhost:4173/?home=sunrise-garden`

If no `home` value is provided, it defaults to `harbor-hearth`.

## Publish Changes

After updating content:

1. Commit the changes
2. Push to `main`
3. Cloudflare Pages redeploys automatically
