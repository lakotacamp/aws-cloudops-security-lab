# Colony Simulator Ops Showcase — MVP Architecture

## Purpose

This document defines the first deployable architecture for the Colony Simulator Ops Showcase.

The purpose of the MVP architecture is to keep the first build small, understandable, and deployable while still creating a strong foundation for AWS CloudOps and security features.

The MVP should prove three things:

1. The project can run as a real web application.
2. The application can later connect to AWS-backed services.
3. The CloudOps/Security Ops Dashboard has a clear path toward real monitoring, logging, audit, and incident simulation.

This is not the final architecture. It is the first architecture that gets the project from idea to working portfolio artifact.

---

## Architecture Goals

The MVP architecture should support:

- A public-facing frontend for the Colony Simulator
- A basic Ops Dashboard page
- A seeded colony demo
- A simple local Advance Day interaction
- A future backend API connection
- A future AWS deployment path
- Public-safe documentation
- Clear separation between app code, infrastructure code, and documentation

The architecture should avoid unnecessary complexity until the first deployable version exists.

---

## MVP Architecture Principle

Build the simplest useful version first:

- Start with a local React/TypeScript frontend.
- Use local/static data for the first seeded colony demo.
- Add the Ops Dashboard as a frontend page before connecting real telemetry.
- Add AWS backend services only after the frontend shape is working.
- Use code for colony state and simulation rules.
- Use AI later for narration, not for core state logic.

The first version should be something I can understand, explain, run locally, and improve incrementally. Even if I am using ai to answer questions instead of stackoverflow, everything in this project needs to be coded by me.

---

## High-Level MVP Architecture

The MVP starts as a frontend-first project.

The first version should not require every AWS service on day one. Instead, it should create the application shape that AWS services can support later.

### MVP Stage 1 — Local Frontend

Initial local architecture:

- React / TypeScript frontend
- Static seeded colony data
- Local state for the Advance Day interaction
- Local/mock Ops Dashboard data
- Documentation in the public engineering repo

At this stage, the project can run locally and demonstrate the user experience without AWS cost or deployment complexity.

### MVP Stage 2 — Static Deployment

First deployment architecture:

- Frontend built as static files
- Hosted with Amazon S3
- Served through Amazon CloudFront
- Optional custom domain later through Route 53 and ACM

At this stage, the project becomes publicly accessible and linkable from GitHub, LinkedIn, and a portfolio website.

### MVP Stage 3 — First AWS Backend

First backend architecture:

- API Gateway exposes a small status endpoint
- Lambda handles the request
- CloudWatch receives backend logs
- Ops Dashboard displays backend status

At this stage, the project becomes a real AWS-backed application instead of a static frontend only.

### MVP Stage 4 — Persistent State

Next backend architecture:

- DynamoDB stores colony state and turn history
- Lambda reads and writes colony state
- Frontend loads state through API Gateway
- CloudWatch logs backend activity

At this stage, the colony simulation begins to persist across sessions.

### MVP Stage 5 — AI Narration and Ops Integration

Later MVP expansion:

- Backend sends structured simulation summaries to an AI model
- AI generates journal narration
- CloudWatch tracks success, failure, and latency
- Ops Dashboard displays selected operational signals
- Safe incident simulation is added behind controlled failure modes

At this stage, the project begins showing the full professional purpose: a live app with observable cloud operations behavior.

---

## Repository Layout

The repo should separate application code, operations dashboard code, infrastructure code, and documentation.

Planned structure:

aws-cloudops-security-lab/
  README.md

  app/
    frontend/
    backend/

  ops-dashboard/
    frontend/
    backend/

  infrastructure/
    cdk/
    scripts/

  docs/
    project/
      project-vision.md
      mvp-roadmap.md
      mvp-architecture.md

    architecture/
      diagrams/
      decisions/

    operations/
      runbooks/
      monitoring/
      incident-response/
      templates/

    security/
      iam/
      audit/
      compliance/

    blog/
      development-log/
      cloudops-learning/
      lessons-learned/

  screenshots/

---

## MVP Component Map

### 1. Public Colony Simulator Frontend

Path:

`app/frontend/`

Purpose:

The public-facing frontend is the first visible part of the project.

It should eventually allow a visitor to:

- View the project landing page
- Open the Colony Demo
- View a seeded colony
- Advance the simulation by one day
- Read a generated or placeholder journal entry
- Navigate to the Ops Dashboard
- Navigate to project documentation links

MVP behavior:

- Uses local/static data first
- Uses React state for the first Advance Day interaction
- Does not require AWS backend services at the beginning
- Should be understandable enough that I can explain each major component

---

### 2. Seeded Colony State

Initial location:

`app/frontend/src/data/`

Purpose:

The seeded colony state gives the simulation something concrete to display before a backend database exists.

The first colony object should include:

- Colony name
- Current day
- Location or region description
- Population count
- Food supply
- Tools or equipment level
- Morale
- Risk level
- Founding colonist list
- Current journal entry

MVP behavior:

- Stored locally in frontend code at first
- Updated by local simulation logic
- Later moved into DynamoDB when backend persistence is added

---

### 3. Local Simulation Logic

Initial location:

`app/frontend/src/simulation/`

Purpose:

The local simulation logic controls how colony state changes when the user advances the day.

Important rule:

The code should control the simulation state. AI narration comes later.

First simple rules:

- Day count increases by one
- Food decreases based on population
- Morale changes based on food and risk
- Risk may change based on a simple event
- Journal text summarizes the state change

MVP behavior:

- Deterministic enough to understand and debug
- Small enough to explain during an interview
- Written before adding AI calls

---

### 4. Ops Dashboard Page

Possible early location:

`app/frontend/src/pages/OpsDashboard`

Future possible location:

`ops-dashboard/frontend/`

Purpose:

The Ops Dashboard is the professional centerpiece of the project.

In the earliest MVP, it can use mock/local data to show the intended operational view.

First dashboard panels:

- Service health
- Advance Day workflow status
- Recent simulation events
- Mock latency or response status
- Incident history placeholder
- Security posture checklist
- Disabled or mock Simulate Incident button

MVP behavior:

- Starts with mock data
- Later displays real CloudWatch, Lambda, API Gateway, and incident simulation evidence
- Should make the CloudOps/security purpose of the project obvious to employers

---

### 5. First AWS Backend Status Endpoint

Future path:

`app/backend/`

Purpose:

The first backend feature should be intentionally small.

Recommended first endpoint:

**GET /status**

Expected response:

- Service name
- Environment
- Version
- Status
- Timestamp

AWS services:

- API Gateway receives the request
- Lambda handles the request
- CloudWatch stores backend logs
- Frontend displays the status on the Ops Dashboard

MVP behavior:

- Proves the frontend can call a real AWS backend
- Creates first CloudWatch log evidence
- Gives the Ops Dashboard its first real operational signal

---

### 6. Future Persistent Colony State

Future service:

DynamoDB

Purpose:

DynamoDB will eventually store colony state and turn history.

Future stored data:

- Colony ID
- Colony state
- Current day
- Founding colonists
- Turn history
- Journal entries
- Incident simulation history

This is not required for the first frontend shell.

---

## MVP Data Flow

The MVP should grow through clear data-flow stages.

### Stage 1 — Local Frontend Data Flow

In the first version, everything happens in the frontend.

Flow:

1. User opens the Colony Simulator frontend.
2. Frontend loads seeded colony data from local project files.
3. User clicks **Advance Day**.
4. React state updates the colony data in the browser.
5. Local simulation logic creates a simple journal summary.
6. Ops Dashboard shows mock operational data.

Purpose:

This stage proves the app experience before adding AWS complexity.

---

### Stage 2 — Static Hosted Frontend Data Flow

After the frontend works locally, it can be deployed as a static site.

Flow:

1. User opens the public site URL.
2. CloudFront serves the frontend.
3. S3 stores the built frontend files.
4. The browser runs the React application.
5. Colony demo still uses local/static data.
6. Ops Dashboard still uses mock/local data.

Purpose:

This stage creates the first live, linkable portfolio artifact.

---

### Stage 3 — First AWS Status Endpoint Data Flow

After the frontend is deployed, the Ops Dashboard should connect to a real AWS backend status endpoint.

Flow:

1. User opens the Ops Dashboard.
2. Frontend calls a `/status` API endpoint.
3. API Gateway receives the request.
4. Lambda returns service status information.
5. CloudWatch stores Lambda logs.
6. Ops Dashboard displays the backend status.

Purpose:

This stage proves the project is no longer only a static frontend. It has a real AWS-backed operational signal.

---

### Stage 4 — Persistent Colony State Data Flow

After the first backend endpoint works, colony state can move into DynamoDB.

Flow:

1. User opens the Colony Demo.
2. Frontend requests colony state from the backend.
3. API Gateway routes the request to Lambda.
4. Lambda reads colony state from DynamoDB.
5. Frontend displays the saved colony state.
6. User clicks **Advance Day**.
7. Lambda updates colony state and turn history in DynamoDB.
8. CloudWatch logs the backend request and result.

Purpose:

This stage turns the colony simulator into a persistent application.

---

### Stage 5 — AI Journal Narration Data Flow

After state persistence works, AI narration can be added.

Flow:

1. User clicks **Advance Day**.
2. Backend updates structured colony state.
3. Backend creates a structured summary of what changed.
4. AI model generates a journal entry from the structured summary.
5. Backend stores the journal entry with the turn history.
6. Frontend displays the new journal entry.
7. CloudWatch records success, failure, and latency information.

Purpose:

This stage adds AI storytelling while keeping simulation rules controlled by code.

---

## CloudOps, Security, and Cost-Control Plan

The MVP architecture should support CloudOps and security features without overbuilding too early.

### Observability Plan

Initial observability will be added in stages.

Early local/frontend stage:

- Show mock service health in the Ops Dashboard.
- Show mock Advance Day workflow status.
- Show placeholder incident history.
- Show placeholder security posture checks.

First AWS-backed stage:

- Capture Lambda logs in CloudWatch.
- Display backend `/status` response in the Ops Dashboard.
- Document where logs are stored.
- Document how backend errors would be investigated.

Later observability stages:

- Add structured application logs.
- Add CloudWatch metrics for Advance Day success and failure.
- Add CloudWatch alarms.
- Add SNS notification path.
- Add dashboard evidence and screenshots.

### Security Plan

The MVP should follow basic security principles from the beginning.

Initial security goals:

- Keep secrets out of the frontend.
- Do not commit credentials to GitHub.
- Use public-safe documentation only.
- Keep private study notes and rough planning out of the public repo.
- Keep AWS access controlled through IAM.

Future security goals:

- Use least-privilege IAM roles.
- Use environment variables or managed configuration for backend settings.
- Add WAF or rate limiting if public API abuse becomes a concern.
- Document IAM decisions in `docs/security/iam/`.
- Document audit behavior in `docs/security/audit/`.

### Audit Plan

CloudTrail will eventually be used to show AWS API activity evidence.

Planned audit examples:

- Deployment-related API activity
- IAM role or policy changes
- Lambda/API Gateway configuration changes
- DynamoDB table changes
- Incident simulation support activity

Audit documentation should explain what CloudTrail is used for and how it differs from CloudWatch monitoring.

### Incident Simulation Plan

The first incident simulation should be safe and controlled.

Recommended first incident:

**Simulated elevated latency or forced application-level failure for the Advance Day workflow.**

This should not attack real infrastructure or create unsafe load.

First incident flow:

- User selects a safe simulated incident.
- App sets a controlled failure mode.
- Backend logs the event.
- Ops Dashboard displays the incident status.
- Runbook explains how the incident would be triaged.
- Recovery/reset action clears the simulated incident.

### Cost-Control Plan

The MVP should avoid unnecessary AWS costs.

Cost-control rules:

- Start locally before deploying.
- Deploy the static frontend before adding backend services.
- Add one AWS service path at a time.
- Use low-traffic demo workloads.
- Avoid always-on compute when possible.
- Prefer serverless services for the MVP.
- Document cleanup steps for any temporary resources.
- Add cost notes to relevant architecture or runbook docs.

### Public/Private Documentation Rule

Public documentation should be employer-facing.

Public repo may include:

- Architecture documentation
- Runbooks
- Security decisions
- Cost-control notes
- Public-safe blog posts
- Screenshots of non-sensitive configurations
- Polished lessons learned

Do not publish:

- Raw study packets
- Quiz scores
- Mistake logs
- Private planning notes
- Personal routine notes
- Credentials, account IDs, secrets, or sensitive logs

---

## First Build Decision

The first implementation milestone should be:

**Create the first deployable frontend shell.**

This means the next coding work should create:

- A React / TypeScript frontend
- A landing page for the Colony Simulator Ops Showcase
- A Colony Demo page placeholder
- An Ops Dashboard page placeholder
- Basic navigation
- Local run instructions
- A structure that can later support seeded colony data and AWS integration

The first build should not begin with AWS infrastructure.

Reason:

A visible frontend shell gives the project something deployable, linkable, and expandable before adding backend complexity.

## What Comes Immediately After the Frontend Shell

After the frontend shell exists, the next implementation sequence should be:

1. Add seeded colony data.
2. Display the colony state.
3. Add local Advance Day logic.
4. Add a basic Ops Dashboard page with mock operational data.
5. Deploy the frontend.
6. Add the first AWS-backed `/status` endpoint.
7. Connect the Ops Dashboard to the real backend status response.

## What This Architecture Avoids

This MVP architecture intentionally avoids:

- Building the full simulation engine first
- Adding AI calls before structured state exists
- Adding DynamoDB before local state is understandable
- Adding incident simulation before a basic workflow exists
- Adding advanced AWS architecture before the app is visible
- Overbuilding multiplayer, procedural maps, or image generation too early

## MVP Architecture Summary

The MVP architecture follows this path:

1. Build a local frontend shell.
2. Add a seeded colony demo.
3. Add local simulation logic.
4. Add a mock Ops Dashboard.
5. Deploy the frontend.
6. Add a small AWS backend status endpoint.
7. Use that backend path as the first real CloudOps monitoring target.

This keeps the project narrow enough to build while still creating a clear path toward AWS CloudOps, security, observability, incident response, and portfolio website integration.