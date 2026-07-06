# Architecture

## Goal

Build a cheap-to-run multi-tenant marketing platform for adult family homes, with one public directory plus one public website per home.

## Recommended v1 Architecture

### Frontend

- React + Vite
- static build deployed to S3
- delivered through CloudFront

This fits the product well because the public experience is mostly directory pages, listing pages, forms, and an operator admin shell. We do not need always-on SSR infrastructure for v1.

### Backend

- API Gateway HTTP API
- Lambda handlers on ARM where possible
- shared backend modules in `apps/api`

Main responsibilities:

- public directory and listing data APIs
- contact and tour request submission
- admin CRUD for homes
- image upload handling
- publish and unpublish flows

### Data

- DynamoDB on-demand
- S3 for branding and gallery images

Suggested early records:

- homes
- inquiries
- upload metadata

### Auth

- start with a simple platform-admin login flow
- defer home-manager roles until later in v1 or v1.1

### Routing Model

- main platform domain `afhcares.com` for the central directory
- subdomain routing for each home, such as `sunrise-home.afhcares.com`
- optional future custom domains per home

### Observability

- CloudWatch logs
- budget alarms from the first deployment
- simple operator email notifications for new inquiries

## Services To Avoid Early

- ECS/Fargate for the main app
- RDS or Aurora
- NAT Gateway
- Step Functions
- WAF unless there is a concrete threat or customer requirement that justifies the monthly cost

## Cost Logic

This product may onboard homes gradually, so fixed-cost infrastructure is the main financial risk. A serverless stack keeps the platform inexpensive while traffic is modest and uneven.

## Core Product Areas

- public directory
- per-home public site
- operator admin
- inquiry capture
- media management

## Deployment Shape

- one frontend distribution
- one API Gateway
- one Lambda project with a few focused handlers
- one DynamoDB environment per stage
- one S3 bucket for site media

Keep `dev` and `prod` only at first.
