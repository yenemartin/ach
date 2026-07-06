# API Contract

## Scope

This contract describes the first backend surface needed by the current web prototype.

Base assumption:

- public site is served from `afhcares.com`
- home pages are served from subdomains or equivalent routed paths
- API is exposed under `/api`

## Public Endpoints

### `GET /api/public/homes`

Returns published homes for the directory.

Example response shape:

```json
{
  "items": [
    {
      "id": "sunrise-garden",
      "name": "Sunrise Garden AFH",
      "city": "Kent, WA",
      "availability": "Open rooms",
      "featured": true,
      "teaser": "Warm, garden-backed home with family-style meals and quiet private rooms.",
      "promotion": "Free consultation week",
      "careTags": ["Memory support", "Mobility support"],
      "roomTypes": ["Private room", "Companion room"],
      "languages": ["English", "Amharic"],
      "subdomain": "sunrise-garden.afhcares.com"
    }
  ],
  "stats": [
    { "label": "Homes in directory", "value": "18" },
    { "label": "Featured homes", "value": "5" },
    { "label": "Cities covered", "value": "9" }
  ]
}
```

### `GET /api/public/homes/{id}`

Returns the detailed public page payload for one home.

Example response shape:

```json
{
  "id": "sunrise-garden",
  "name": "Sunrise Garden AFH",
  "subdomain": "sunrise-garden.afhcares.com",
  "city": "Kent, WA",
  "phone": "(206) 555-0148",
  "availability": "Open rooms",
  "about": "Sunrise Garden is a welcoming adult family home...",
  "highlights": ["Private and companion room options"],
  "promotions": ["Free consultation for July move-ins"],
  "gallery": ["Front exterior", "Shared living room", "Private bedroom"],
  "inquirySteps": [
    "Prospect submits contact or tour request",
    "Platform admin gets notified by email"
  ]
}
```

### `POST /api/public/inquiries`

Creates a new contact or tour request.

Request body:

```json
{
  "homeId": "sunrise-garden",
  "requestType": "tour",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "206-555-0101",
  "moveInTimeline": "Within 30 days",
  "preferredContactMethod": "Phone",
  "preferredTourDatetime": "2026-07-12T10:00",
  "message": "We would like to visit next week."
}
```

Response body:

```json
{
  "requestId": "REQ-1049",
  "status": "new"
}
```

Validation rules:

- `homeId`, `requestType`, `name`, `email`, and `preferredContactMethod` are required
- `requestType` must be `contact` or `tour`
- reject malformed email and obviously malformed phone data
- do not accept medical, diagnosis, medication, or resident-care fields in v1

## Admin Endpoints

### `GET /api/admin/dashboard`

Returns basic metrics and recent inquiries for the admin shell.

### `GET /api/admin/homes`

Returns all homes, including draft and archived records.

### `POST /api/admin/homes`

Creates a home and assigns a unique slug/subdomain.

### `PUT /api/admin/homes/{id}`

Updates home content, availability, promotions, and publish state.

## Notes

- Keep v1 payloads intentionally small and readable.
- Prefer a stable JSON contract over framework-specific responses.
- Public and admin contracts should share the same core home model where practical.

