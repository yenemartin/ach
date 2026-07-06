# Deploy To Cloudflare Pages

This project can be deployed without AWS.

## Recommended Setup

- Hosting: Cloudflare Pages
- Domain: `afhcares.com`
- Site type: static
- Inquiry handling: phone, email, or hosted form service

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

## Lowest-Cost Inquiry Options

Use one of these for launch:

- phone number + email only
- hosted form endpoint such as Formspree
- Tally
- Google Form embed

The current prototype is designed to post to a hosted form endpoint configured per home profile.
