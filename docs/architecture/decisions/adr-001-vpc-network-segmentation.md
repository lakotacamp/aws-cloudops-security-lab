# ADR-001 — VPC Network Segmentation for Colony Simulator Ops Showcase

## Status

Proposed

## Date

2026-05-29

## Context

The Colony Simulator Ops Showcase is intended to become a live portfolio project with a public-facing simulation experience, AWS-backed application infrastructure, and a CloudOps/Security Ops Dashboard.

As the project grows beyond the first frontend-only MVP, it may need backend application services, data storage, operational telemetry, audit evidence, and controlled incident simulation.

The network design should support those future needs without making the first deployable version unnecessarily complex.

## Decision

Use a three-tier VPC subnet model when VPC-backed infrastructure is needed:

1. Public subnet tier
2. Private subnet tier
3. Isolated subnet tier

The public subnet tier will support resources that intentionally need public internet routing, such as an Internet Gateway path or a NAT Gateway.

The private subnet tier will support application resources that need outbound internet access but should not be directly reachable from the public internet.

The isolated subnet tier will support resources that should not have direct internet access and should communicate only through controlled internal paths.

## Routing Model

### Public Subnet

The public subnet route table should include:

* Local VPC route
* `0.0.0.0/0` route to an Internet Gateway

This tier is for public entry or internet-adjacent resources.

### Private Subnet

The private subnet route table should include:

* Local VPC route
* `0.0.0.0/0` route to a NAT Gateway located in a public subnet

This tier is for application components that need outbound internet access without direct inbound internet routing.

### Isolated Subnet

The isolated subnet route table should include:

* Local VPC route only
* No `0.0.0.0/0` route to an Internet Gateway
* No `0.0.0.0/0` route to a NAT Gateway

This tier is for data or internal components that should not have direct internet access.

## Security Group and NACL Placement

Security groups should be the primary workload-level access control.

Use security groups to define which components can communicate with each other, such as:

* Public entry layer to backend application layer
* Backend application layer to data layer
* Operations or administrative components to only the resources they need

Network ACLs should be treated as subnet-level boundary controls.

For the MVP, NACLs should remain simple unless there is a clear security or operational reason to customize them. Because NACLs are stateless and rule-order dependent, unnecessary customization can make troubleshooting harder.

## CloudTrail Audit Relevance

Networking changes should be auditable.

CloudTrail should support investigation of AWS API activity related to:

* Route table creation or modification
* Route table association changes
* Internet Gateway creation, attachment, or deletion
* NAT Gateway creation or deletion
* Security group rule changes
* NACL changes
* Subnet or VPC configuration changes

This supports future operational questions such as:

* Who changed the route table?
* When was public routing added or removed?
* Who modified a security group?
* Was a networking change related to an incident?

CloudTrail provides audit evidence for API activity. CloudWatch provides operational metrics, logs, alarms, and dashboards. Both services are useful, but they answer different operational questions.

## Ops Dashboard Connection

The Ops Dashboard should eventually include public-safe networking and security context.

Possible future dashboard panels:

* Network tier summary
* Expected public/private/isolated route model
* Recent CloudTrail networking change events
* Recent security group changes
* VPC Flow Logs summary, if enabled
* Reachability check results, if implemented
* Links to networking runbooks and architecture documents

The dashboard should avoid exposing sensitive identifiers or account details. It should explain the operational model without leaking private infrastructure information.

## Consequences

### Benefits

* Clear separation between public, private, and isolated resources
* Easier explanation of network boundaries during interviews
* Better support for least-privilege network design
* Cleaner future connection to CloudTrail audit evidence
* Stronger foundation for Ops Dashboard networking panels
* Better alignment with CloudOps networking concepts

### Tradeoffs

* VPC-backed architecture adds complexity compared with a static frontend-only MVP
* NAT Gateways can add cost and should be introduced only when needed
* Over-customized NACLs can make troubleshooting harder
* Some early serverless components may not need VPC placement at all

## Implementation Guidance

Do not add VPC-backed infrastructure before it is needed.

Recommended sequence:

1. Build and deploy the frontend shell.
2. Add the first AWS-backed status endpoint.
3. Add backend and data components.
4. Introduce VPC-backed networking only when the architecture requires private routing or isolated data access.
5. Document each networking change as the architecture evolves.

## Public-Safe Documentation Rule

This decision record should remain employer-facing.

Do not add:

* Account IDs
* Resource IDs
* Raw lab notes
* Quiz results
* Retention check notes
* Cleanup details
* Personal study-process notes
* Screenshots containing sensitive values

This document should explain the architecture decision, not expose private learning materials.
