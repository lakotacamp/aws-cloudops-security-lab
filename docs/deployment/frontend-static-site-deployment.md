# Frontend Static Site Deployment Plan

## Purpose

This document defines the first deployment path for the Colony Simulator Ops Showcase frontend.

The current frontend is a React / TypeScript / Vite static application. It can be built into static files and hosted as the first public version of the project before backend, database, AI narration, or live AWS telemetry are added.

## Current Deployment Unit

The deployable frontend lives in:

`app/frontend/`

The production build command is:

`cd app/frontend`

`npm run build`

The build output is generated in:

`app/frontend/dist/`

The `dist/` folder is the static site artifact that can be deployed to a static hosting target.

## First Hosting Target

The preferred AWS hosting path is:

`Amazon S3 + Amazon CloudFront`

Planned supporting services:

* S3: stores the static frontend build artifacts.
* CloudFront: serves the frontend through a CDN.
* ACM: provides TLS certificate support when a custom domain is added.
* Route 53: manages DNS if a custom domain is used.
* CloudWatch: monitors distribution/API behavior in later phases.
* CloudTrail: provides audit visibility for infrastructure and configuration changes.

## Deployment Scope

The first deployment should include only the static frontend.

Included:

* React frontend
* Seeded colony state view
* Advance Day interaction
* Latest Turn Outcome panel
* Mock Ops Dashboard
* Architecture Path summary

Excluded from the first deployment:

* Backend API
* DynamoDB persistence
* Bedrock journal generation
* Authentication
* Real CloudWatch metrics
* Real CloudTrail query integration
* Incident simulation
* CI/CD automation

## Local Verification Before Deployment

Before deploying, run:

`cd app/frontend`

`npm run build`

Optional local production preview:

`npm run preview`

Acceptance criteria:

* The build completes without TypeScript or Vite errors.
* The app loads from the production preview.
* The Advance Day button updates colony state.
* The Latest Turn Outcome panel appears after advancing the day.
* The mock Ops Dashboard displays operational metric cards and recent events.
* No `node_modules`, `dist`, or `tsbuildinfo` files are committed to Git.

## AWS Deployment Acceptance Criteria

The first AWS-hosted version counts as complete when:

* A public URL loads the frontend.
* The page is served from static build artifacts.
* The Advance Day interaction works in the hosted environment.
* The mock Ops Dashboard is visible.
* The README points to the live demo or clearly marks where the demo link will go.
* The deployment avoids committing generated build output.
* The deployment has a documented cleanup/cost-control note.

## Security and Cost Notes

Initial security and cost controls:

* Do not expose AWS credentials in the frontend.
* Do not commit local environment files containing secrets.
* Do not commit build output unless a specific deployment method requires it.
* Prefer least-privilege IAM when creating AWS deployment resources.
* Add AWS Budget alerts before expanding into backend services.
* Document any public bucket, CloudFront, DNS, or certificate decisions.

## Future CloudOps Integration

After the static frontend is deployed, the next CloudOps/security milestones are:

1. Add first CloudWatch monitoring capability.
2. Add CloudTrail audit documentation for deployment/configuration changes.
3. Add a simple API Gateway + Lambda endpoint.
4. Connect frontend to the backend endpoint.
5. Add DynamoDB persistence for colony state.
6. Replace mock Ops Dashboard data with real operational signals.

## Current Status

Status: Deployment planning ready

Next step: choose hosting path and deploy the static frontend.
