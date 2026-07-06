# API

This folder will hold the serverless backend for AFH Cares.

V1 responsibilities:

- public directory data
- per-home public page data
- inquiry and tour request submission
- platform-admin CRUD for homes
- publish and unpublish workflow
- image upload coordination

Recommended runtime for v1:

- Node.js Lambda handlers
- API Gateway HTTP API
- DynamoDB on-demand
- S3 for media

Initial focus:

- keep the public read APIs cache-friendly
- keep inquiry submission simple and low-risk
- support platform-admin first, with home-manager roles later

