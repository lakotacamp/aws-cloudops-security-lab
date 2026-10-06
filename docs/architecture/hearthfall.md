# Hearthfall: current architecture

This document describes the v0.3 book edition and its CloudFormation deployment design. See the root README for verified deployment status.

The book edition adds an isolated illustrator Lambda, DynamoDB job allowances, and Bedrock. Its deployment, model costs, and controls are documented in the [book release review](../deployment/book-release-review.md). The diagnostic API keeps the verified v0.2 behavior.

## Data and request paths

1. Vite builds static HTML, CSS, JavaScript, an original SVG favicon, and public runtime configuration.
2. React loads a validated local save or the seeded day-12 expedition. The browser owns the simulation; image requests send only an anonymous edition UUID and recorded choices.
3. A priority plus deterministic weather produces a new state and journal outcome. Resource deltas reflect actual changes after clamping.
4. React saves the expedition to localStorage and updates the UI. Storage failure produces a notice; play continues in memory.
5. A visitor-triggered probe calls the configured API, or a clearly labeled browser simulation when no endpoint is configured.
6. In AWS, CloudFront forwards `/api/*` to API Gateway without caching. The allowlisted route invokes Lambda.
7. Lambda returns a request ID and logs structured evidence. Native API/Lambda metrics feed a private CloudWatch dashboard and an API 5xx alarm.
8. On a new turn, the separate illustration API replays allowlisted choices, then atomically claims a unique edition/day job and daily/monthly allowance in DynamoDB. It invokes its asynchronous worker once.
9. The worker creates an event-specific woodcut through Stable Image Core in `us-west-2`, writes the PNG under `illustrations/*` in private S3, and marks the job ready. CloudFront serves the image. Historical pages read existing jobs without creating new art; refresh reuses the same job.

Browser timings include client/network overhead. Lambda's `durationMs` measures handler work. CloudWatch Lambda Duration is service telemetry. None is presented as interchangeable with the others.

## Security boundaries

| Boundary | Control | Remaining limitation |
| --- | --- | --- |
| Internet → frontend | CloudFront HTTPS, CSP, HSTS, frame denial, nosniff | Static resources are intentionally public. |
| CloudFront → S3 | OAC SigV4, all S3 Block Public Access settings, distribution-scoped read policy, TLS-only bucket access | Deployment identity can upload new application code. |
| API Gateway → Lambda | Invoke policy restricted to this account and API path | The HTTP API is intentionally public and directly reachable. |
| Diagnostic Lambda → AWS | Execution role allows only writing its own pre-created log group | Deployer requires broader permissions to manage infrastructure; it is not the runtime identity. |
| Illustrator → AWS | Separate role: one model, one table, its own invocation/logs, and only the bucket's illustrations prefix | Public visitors share finite model allowances; other AWS usage charges are not capped. |
| Anonymous visitor → diagnostic | Default disabled, one request only, route throttle 0.1 rps/burst 1, three-second Lambda timeout | Throttles are best effort; callers can generate usage charges and intentional 5xx alarms. |
| Browser → persistence | Version/bounds validation and text rendering | LocalStorage is not tamper-proof or backed up. Same-origin script can access it. |
| Service → logs | No bodies, headers, query strings, or source IPs in configured application/access log formats; seven-day retention | Account operators can see request identifiers and timing. AWS retains its own platform records under its policies. |

There are no static AWS credentials or secrets in the application. The diagnostic runtime has no database or model access; the illustrator has only its explicit scoped permissions. CORS is browser behavior, not authorization. The frontend does not publish AWS account IDs, log streams, dashboard access, or credentials.

## Failure behavior and recovery

- **Diagnostic enabled:** POST returns 503; next GET independently returns 200. No flag is toggled by the visitor.
- **Diagnostic disabled:** POST returns 403; enablement requires an operator's stack update.
- **Throttle:** API Gateway may return 429; it must not be confused with the intentional 503.
- **Network/integration failure:** UI reports unavailable/invalid response; local game remains playable. Probes have an eight-second client timeout and no automatic retries.
- **Real Lambda failure:** inspect Lambda Errors and logs, API 5xx, integration permissions and stack events. A successful health probe alone does not establish global availability.
- **Save corruption:** fresh camp and warning; existing storage is untouched until the next explicit play/reset operation.

## Changes and ownership

Edit `app/backend/handler.py` or `infrastructure/build-template.mjs`, regenerate `template.json`, then run tests and `cfn-lint`. Review the CloudFormation change set before deployment. Update static files with immutable caching for hashed assets and no-cache for entry/config files. Keep old assets through a release rollback window.

The API stage explicitly depends on both route resources. Its route-specific throttle keys are plain strings, which do not establish an implicit CloudFormation dependency. See the [deployment incident and regression fix](../operations/deployment-incident.md).

The stack uses no VPC or NAT because Lambda has no private dependencies. No database is needed while saves are local. Additional services should solve an observed requirement rather than enlarge the service list.
