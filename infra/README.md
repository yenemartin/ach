# Infrastructure

This folder will hold AWS infrastructure definitions for ACH.

v1 target:

- static frontend on S3 + CloudFront
- HTTP API on API Gateway
- Lambda functions
- DynamoDB tables
- S3 upload bucket
- budget alarms

We should keep the first infrastructure pass intentionally small and avoid any service that creates a standing monthly bill unless it is clearly necessary.
