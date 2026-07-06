# Domain Model

## Home

An adult family home listing and public website tenant.

Fields:

- `home_id`
- `slug`
- `name`
- `status`
- `address`
- `city`
- `state`
- `phone`
- `contact_email`
- `description`
- `amenities[]`
- `care_tags[]`
- `room_types[]`
- `availability_status`
- `pricing_visibility`
- `promotion_headline`
- `promotion_body`
- `hero_image_url`
- `gallery_image_urls[]`
- `subdomain`
- `custom_domain`
- `is_featured`

### Field Notes

- `status`: `draft | published | archived`
- `availability_status`: `open_rooms | limited_availability | waitlist | currently_full`
- `pricing_visibility`: v1 should default to `contact_only`
- `subdomain`: for example `sunrise-home.afhcares.com`
- `custom_domain`: optional later for homes that want their own branded domain

## Inquiry Request

A contact or tour request submitted from a public home page.

Fields:

- `request_id`
- `home_id`
- `request_type`
- `name`
- `email`
- `phone`
- `move_in_timeline`
- `preferred_contact_method`
- `preferred_tour_datetime`
- `message`
- `status`

### Field Notes

- `request_type`: `contact | tour`
- `status`: `new | contacted | scheduled | closed`

## Roles

### `platform_admin`

Can create and manage all home listings, content, images, subdomains, and inquiry records.

### `home_manager`

Optional later role that can edit only their own home listing.

## v1 Boundaries

Include:

- listing management
- subdomain assignment
- public publishing controls
- availability updates
- promotions
- inquiry capture

Exclude:

- resident records
- care workflows
- medication tracking
- staff scheduling
- billing or payroll
