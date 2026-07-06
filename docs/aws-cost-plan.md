# AWS Cost Plan

## Priority

Choose the lowest recurring-cost architecture that still leaves us with a real production path.

## Recommended v1 Stack

- S3 for static frontend hosting
- CloudFront for CDN and HTTPS delivery
- API Gateway HTTP API for the backend entry point
- Lambda for compute
- DynamoDB on-demand for operational data
- S3 for attachments and exports
- CloudWatch for logs

## Why This Is Cheaper

### Prefer pay-per-use over always-on

AWS Lambda pricing says functions are billed per request and execution duration, and the free tier includes 1 million requests and 400,000 GB-seconds per month.

DynamoDB pricing says on-demand capacity is available for read and write traffic, which avoids pre-paying for throughput when traffic is small or unpredictable.

Elastic Load Balancing pricing says Application Load Balancers charge hourly plus Load Balancer Capacity Units. That means a low-traffic app can still carry standing monthly cost.

### Keep the frontend static

A static frontend on S3 and CloudFront is usually cheaper than keeping a container or server process alive just to render dashboards and forms.

### Avoid network traps

NAT Gateways can become a surprising fixed cost. We should avoid private-subnet designs that require NAT unless there is a strong security or integration reason.

## Rough Decision Rules

- If traffic is low or uncertain: Lambda + API Gateway is the default.
- If the app becomes high-throughput and predictable: reevaluate containers later.
- If we only need listings, admin dashboards, forms, and CRUD: stay serverless.
- If we need long-running jobs: add event-driven workers, not an always-on app server first.

## Cost Controls To Add Early

- AWS Budgets with email alerts
- CloudWatch log retention limits
- S3 lifecycle rules for exports and temporary uploads
- DynamoDB TTL for ephemeral records
- separate environments only when they provide real value

## Current Source Notes

The pricing guidance above is based on official AWS pricing pages:

- AWS Lambda Pricing: https://aws.amazon.com/lambda/pricing/
- Amazon DynamoDB Pricing: https://aws.amazon.com/dynamodb/pricing/
- Elastic Load Balancing Pricing: https://aws.amazon.com/elasticloadbalancing/pricing/
- Amazon S3 Pricing: https://aws.amazon.com/s3/pricing/
- Amazon CloudFront Pricing: https://aws.amazon.com/cloudfront/pricing/
- Amazon API Gateway Pricing: https://aws.amazon.com/api-gateway/pricing/
