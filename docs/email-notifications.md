# Email Notifications

The inquiry form can now do both:

- store the inquiry in the Cloudflare Worker KV store
- send an email notification to the company email shown on the site

The worker reads the company destination from the form payload as:

- `contactEmail`

For Harbor Hearth right now, that is:

- `yenemartin@gmail.com`

## How It Works

1. The website submits the inquiry to `/api/inquiries`
2. Cloudflare Pages validates the payload
3. Pages forwards it to the Cloudflare Worker
4. The Worker stores it in KV
5. The Worker forwards it to a Google Apps Script mailer webhook
6. Google Apps Script sends the email to the home's `contactEmail`

## What You Need

- the Cloudflare inquiry Worker already deployed
- the Pages environment variable `INQUIRY_WEBHOOK_URL` already working
- a Google account that can send mail through Apps Script

## Google Apps Script Setup

Create a new Apps Script project and paste in:

- `docs/google-apps-script-inquiry-mailer.js`

Then:

1. In Apps Script, open `Project Settings`
2. Add a script property:
   - `EMAIL_NOTIFICATION_TOKEN`
3. Give it a long random string
4. Deploy the script as a web app

Recommended deploy settings:

- `Execute as`: `Me`
- `Who has access`: `Anyone`

After deploy, you will get a web app URL that looks like:

```text
https://script.google.com/macros/s/AKfycb.../exec
```

## Cloudflare Worker Variables

In the Cloudflare Worker, add:

- `EMAIL_NOTIFICATION_WEBHOOK_URL`

Value format:

```text
https://script.google.com/macros/s/AKfycb.../exec?token=<EMAIL_NOTIFICATION_TOKEN>
```

Optional:

- `EMAIL_NOTIFICATION_TOKEN`

This repo's current Google Apps Script example validates by query-string token, so the token belongs in the webhook URL itself.

## Worker Setup Check

After saving the Worker variable, open:

```text
https://afhcares-inquiry-worker.<your-workers-subdomain>.workers.dev/setup
```

You want to see:

- `hasEmailNotificationWebhook: true`

## Test

1. Submit the live contact form
2. Confirm the form shows success
3. Confirm the inquiry email arrives in the company inbox
4. Confirm the same inquiry still appears in the Worker KV list

KV check:

```text
https://afhcares-inquiry-worker.<your-workers-subdomain>.workers.dev/inquiries?token=<ADMIN_TOKEN>
```

## Important Note

If the Worker cannot send the email notification, it now returns an error instead of pretending everything succeeded.

That means:

- no silent failure
- if the site says success, both storage and email notification should have worked
