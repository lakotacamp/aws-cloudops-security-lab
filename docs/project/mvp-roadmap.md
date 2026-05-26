# Colony Simulator Ops Showcase — MVP Roadmap

## Purpose

This roadmap defines the first buildable version of the Colony Simulator Ops Showcase.

The goal is to create a narrow, deployed portfolio project that combines:

1. A public-facing AI-assisted colony simulation
2. A real AWS-backed application architecture
3. A CloudOps/Security Ops Dashboard
4. Public-safe engineering documentation
5. A future portfolio website presentation

The MVP should be small enough to finish, but strong enough to show real software engineering, AWS, CloudOps, and security thinking.

---

## Guiding Principle

Build a real deployed product first.

Then attach CloudOps and security capabilities to it.

Practically, this is a project to show my experience coding, aws cloudops services, and cybersecurity concepts to potential employers. Personally, I am treating this as my first deployed game, which is built using aws and explores the use of generative ai agent integration for dynamic storytelling.

The repo should not become a disconnected AWS lab scrapbook. Every public artifact should connect back to the Colony Simulator Ops Showcase.

---

## MVP Definition

The first MVP should let a visitor:

1. Open the project landing page.
2. View a small seeded colony.
3. Press or preview an **Advance Day** interaction.
4. See colony state change in a simple, readable way.
5. See a journal entry generated from colony state.
6. Open a basic Ops Dashboard page.
7. Understand what AWS services will support the project.
8. Review the public engineering record in GitHub.

The MVP does not need to include the full game vision.

---

## MVP Theme

The public-facing theme should be a fictional frontier settlement simulation.

This keeps the project inspired by history, settlement survival, simulation, and dynamic storytelling.

Possible public framing:

> An AI-assisted settlement simulator where each turn updates a living colony state and generates a narrative journal entry. Built as a cloud operations showcase with AWS-backed infrastructure, monitoring, logging, security documentation, and incident simulation.

---

## MVP Non-Goals

The following are intentionally out of scope for the first MVP:

- Multiplayer
- Full procedural map generation
- AI image generation
- Complex economy simulation
- Combat systems
- Diplomacy systems
- Long-term family tree simulation
- Real-time gameplay
- Advanced chaos engineering
- Full production-grade multi-region architecture

These may become future features after the first deployed version exists. Multiplayer in particular should be the first stretch goal because it can be facilitated using aws services and can showcase ability to use cloud architecting.

---

## Architecture Direction

The long-term target architecture is serverless and AWS-backed.

Planned service direction:

| Layer | Likely Service(s) | Purpose |
|---|---|---|
| Frontend hosting | S3 + CloudFront | Host the public web app |
| Custom domain / TLS | Route 53 + ACM | DNS and HTTPS |
| API layer | API Gateway | Public backend entry point |
| Backend logic | Lambda | API handlers and simulation functions |
| Workflow orchestration | Step Functions | Traceable Advance Day workflow |
| Data persistence | DynamoDB | Colony state, characters, turn history, incidents |
| AI narration | Amazon Bedrock | Generate journal entries from structured state |
| Monitoring | CloudWatch | Logs, metrics, dashboards, alarms |
| Audit | CloudTrail | AWS API activity evidence |
| Notifications | SNS | Alarm/incident notification path |
| Security controls | IAM, WAF, Secrets Manager / Parameter Store | Least privilege, rate limiting, secrets/config |
| Infrastructure as Code | CDK in TypeScript | Reproducible AWS infrastructure |

The first coding milestone does not need all of these services. The first milestone should create a frontend shell that can later connect to real AWS services.

---

# Development Phases

## Phase 0 — Public Project Foundation

Status: In progress.

Goal:

Create enough public documentation that the project is understandable on GitHub before code is added.

Deliverables:

- [x] Project vision document
- [x] Documentation folder reorganization
- [x] README roadmap update
- [ ] MVP roadmap document
- [ ] MVP architecture document
- [ ] Initial GitHub issue backlog

Definition of done:

A visitor can open the repo and understand what the project is, why it exists, what the MVP is, and how it will demonstrate CloudOps/security skills.

---

## Phase 1 — Frontend Shell

Goal:

Create the first visible application shell.

This should be a simple React/TypeScript frontend that can run locally and later be deployed.

Deliverables:

- [ ] Create frontend app folder
- [ ] Add basic landing page
- [ ] Add navigation for:
  - Colony Demo
  - Ops Dashboard
  - Architecture / Docs
- [ ] Add simple project styling
- [ ] Add local run instructions
- [ ] Commit initial frontend shell

Definition of done:

The project can be run locally and shows a presentable first page.

## Phase 2 — Seeded Colony Demo

Goal:

Create the first non-AWS local version of the colony simulation.

This should use local/static data first so the frontend is easy to understand before backend complexity is added.

Deliverables:

 Create a seeded colony data object
 Display colony name, location, population, morale, food, tools, and risk level
 Display 5–10 founding colonists
 Display one starter journal entry
 Add a simple “Advance Day” button
 Make the button update visible state locally

Definition of done:

A visitor can see a small colony and click an interaction that changes something on the page.

Important design rule:

Use structured state for the simulation. AI narration comes later.

## Phase 3 — Local Simulation Engine

Goal:

Create a simple deterministic simulation loop.

The point is not to build a full game engine. The point is to show that colony state changes according to understandable rules.

Deliverables:

 Add a simple turn/day counter
 Add food consumption
 Add morale change
 Add weather or event modifier
 Add risk level update
 Generate a simple non-AI journal entry from state changes
 Add basic tests or manual test notes if appropriate

Definition of done:

Clicking Advance Day changes state in a way that can be explained and debugged.

Example rule:

Each day:
- food decreases based on population
- morale changes based on food level and event pressure
- risk changes based on weather/event conditions
- journal text summarizes the result

## Phase 4 — Basic Ops Dashboard Page

Goal:

Create the first visible Ops Dashboard page.

At this stage, the dashboard can use mock/local data. It should show what will eventually be backed by real AWS telemetry.

Deliverables:

 Add Ops Dashboard page
 Add service health panel
 Add Advance Day success/failure panel
 Add latency/status placeholder
 Add incident history placeholder
 Add security posture checklist placeholder
 Add “Simulate Incident” disabled or mock button

Definition of done:

The dashboard communicates the professional purpose of the project even before AWS telemetry is connected.

## Phase 5 — First AWS-Backed Feature

Goal:

Connect the project to the first real AWS-backed capability.

Recommended first real feature:

API Gateway + Lambda hello/status endpoint

Deliverables:

 Create backend folder
 Create simple Lambda function
 Expose function through API Gateway
 Connect frontend to status endpoint
 Display backend status on Ops Dashboard
 Log backend request in CloudWatch
 Document the architecture update

Definition of done:

The frontend calls a real AWS backend endpoint and displays the result.

This is the first major transition from static project to cloud-backed project.

## Phase 6 — Persistent Colony State

Goal:

Move colony state from local/frontend-only state into DynamoDB.

Deliverables:

 Create DynamoDB table design
 Add colony state save/load endpoint
 Store seeded colony state
 Store turn history
 Display saved state in frontend
 Add cost/control notes

Definition of done:

The colony state is stored in AWS and can be loaded through the application.

## Phase 7 — AI Journal Narration

Goal:

Use AI to narrate structured simulation results.

Important rule:

Code runs the simulation. The model narrates the result.

Deliverables:

 Create structured simulation summary
 Add prompt template
 Call AI model through backend
 Store generated journal entry
 Add fallback behavior if AI call fails
 Log invocation success/failure
 Add cost and safety notes

Definition of done:

The journal entry is generated from structured colony state and stored as part of turn history.

## Phase 8 — Observability and Ops Dashboard Integration

Goal:

Connect the Ops Dashboard to real operational signals.

Deliverables:

 Add structured backend logs
 Add custom metrics for Advance Day success/failure
 Add latency metric
 Add CloudWatch dashboard or dashboard-backed notes
 Add CloudWatch alarm
 Add SNS notification path
 Display selected operational state in Ops Dashboard

Definition of done:

The Ops Dashboard shows real operational evidence, not just mock data.

## Phase 9 — Safe Incident Simulation

Goal:

Add a controlled incident simulation that demonstrates CloudOps thinking without creating unsafe behavior.

Recommended first incident:

Simulate elevated Advance Day latency or forced application-level failure.

Deliverables:

 Add failure-mode flag
 Add controlled simulated delay or failure
 Log the incident event
 Update dashboard incident history
 Trigger or document alarm behavior
 Add incident response runbook
 Add recovery/reset behavior

Definition of done:

A visitor can understand how the system detects, displays, and recovers from a safe simulated incident.

## Phase 10 — Portfolio Website Integration

Goal:

Make the project easy to show on a portfolio website and LinkedIn.

Deliverables:

 Create portfolio project card
 Add links to:
Live Colony Demo
Ops Dashboard
GitHub Repo
Architecture Docs
Runbooks
 Add short project description
 Add screenshots or short GIF/video
 Add “What this demonstrates” section
 Add LinkedIn-safe project summary

Definition of done:

A recruiter or hiring manager can reach the live project, dashboard, and GitHub record from the portfolio website.

## Public Blog / Development Log Plan

Public blog-style writeups may be added later under:

docs/blog/development-log/
docs/blog/cloudops-learning/
docs/blog/lessons-learned/

Allowed public blog topics:

Why the project is built as a live product instead of a lab scrapbook
How the frontend shell was created
How the colony state model works
How the Advance Day loop works
How CloudWatch monitors the system
How CloudTrail supports auditability
How IAM least privilege is used
How the incident simulation works
How costs are controlled

Blog posts must be polished and employer-facing.

Do not publish:

raw study packets
quiz scores
mistake logs
confusion notes
personal routine notes
private accountability reports

## MVP Acceptance Criteria

The MVP is complete when:

 The project has a live deployed frontend.
 A visitor can view a seeded colony.
 A visitor can trigger or preview an Advance Day action.
 The project displays a journal entry.
 The project has a basic Ops Dashboard page.
 At least one real AWS-backed endpoint exists.
 CloudWatch logs exist for the backend path.
 The README links to project vision, roadmap, architecture, and runbooks.
 The repo contains public-safe documentation only.
 The project can be shown on a portfolio website or LinkedIn.

