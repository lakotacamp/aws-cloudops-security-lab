import { useState } from "react";
const repo = "https://github.com/lakotacamp/aws-cloudops-security-lab";
const services = [
  {
    name: "CloudFront",
    kind: "EDGE DELIVERY",
    symbol: "◇",
    purpose: "One HTTPS entry point",
    detail:
      "Serves the frontend and routes /api requests to API Gateway. Static assets can be cached; API responses are not cached.",
    security:
      "HTTPS redirect, security headers, and signed requests to the private S3 origin.",
    cost: "Requests and data transfer on pay-as-you-go. No server runs while idle.",
  },
  {
    name: "Amazon S3",
    kind: "STATIC ORIGIN",
    symbol: "▤",
    purpose: "A private home for the app",
    detail:
      "Stores the frontend and completed woodcut PNGs. The browser owns the simulation and the diary; the illustrator can write only under illustrations/.",
    security:
      "Block Public Access, server-side encryption, and a bucket policy restricted to the CloudFront distribution.",
    cost: "Stored bytes and requests. Retained objects can keep accruing small storage charges after stack removal.",
  },
  {
    name: "API Gateway",
    kind: "REQUEST BOUNDARY",
    symbol: "⇄",
    purpose: "A narrow public API",
    detail:
      "Exposes status, diagnostic, and illustration job routes. The illustrator accepts an anonymous edition ID and a bounded list of game choices, never a freeform prompt.",
    security:
      "Public endpoints. Illustration jobs have atomic daily and monthly limits; request throttling alone is not a billing cap.",
    cost: "HTTP API request volume. Traffic abuse can create charges even with low idle cost.",
  },
  {
    name: "AWS Lambda",
    kind: "APPLICATION LOGIC",
    symbol: "λ",
    purpose: "Small, inspectable handlers",
    detail:
      "One handler returns diagnostic evidence. A separate illustrator validates choices, claims a bounded job, then invokes itself asynchronously to generate the woodcut.",
    security:
      "The diagnostic role can write only its logs. The illustrator has a separate role limited to one model, its job table, its own invocation, logs, and the image prefix.",
    cost: "Diagnostic runs at 128 MB; illustrator runs at 256 MB. No provisioned concurrency or automatic model retries.",
  },
  {
    name: "DynamoDB",
    kind: "JOBS & ALLOWANCES",
    symbol: "▥",
    purpose: "One paid job per recorded page",
    detail:
      "A transaction reserves the unique page job and increments shared daily and monthly counters together. Reopening a page reuses its existing job.",
    security:
      "The browser cannot read the table directly. The API returns only a job state and image path. Quota rows expire; completed job records are retained.",
    cost: "On-demand reads, writes, and storage. The model-attempt limits do not cap these separate request charges.",
  },
  {
    name: "Bedrock",
    kind: "THE ILLUSTRATOR",
    symbol: "✧",
    purpose: "A fresh woodcut for each new turn",
    detail:
      "Stable Image Core in us-west-2 draws a scene from the same validated turn that drives the diary. Model output has no authority over game state.",
    security:
      "Server-owned prompts, one image per job, no automatic invocation retries. The operator must enable model access and the illustration feature.",
    cost: "Charged per image. Shared default allowances are 20 attempts per UTC day and 200 per UTC month, including failed attempts.",
  },
  {
    name: "CloudWatch",
    kind: "OPERATIONAL EVIDENCE",
    symbol: "⌁",
    purpose: "Logs, a dashboard, an alarm",
    detail:
      "Captures structured request logs and native service metrics. A 5xx alarm detects the diagnostic request and recovers after non-breaching evaluation.",
    security:
      "Seven-day log retention. Public UI exposes only the response for the visitor’s own request.",
    cost: "Log ingestion/storage, a standard alarm, and a dashboard. Free allowances depend on your account.",
  },
] as const;
export default function Architecture() {
  const [selected, setSelected] = useState(0);
  const item = services[selected];
  return (
    <>
      <div className="section-bar">
        <div>
          <span className="eyebrow">03 / THE ENGINEERING</span>
          <h2>A small world. Clear responsibilities.</h2>
        </div>
        <span className="outline-badge">Deployment blueprint</span>
      </div>
      <p className="signal-source">
        This diagram describes the included CloudFormation stack. Its presence
        does not assert that the stack is deployed. The Operations view
        identifies the active measurement source.
      </p>
      <div className="architecture-flow">
        <div className="flow-client">
          Visitor’s browser <small>Simulation + local save</small>
        </div>
        <span className="flow-arrow">→</span>
        <div className="service-buttons">
          {services.map((service, i) => (
            <button
              key={service.name}
              aria-pressed={selected === i}
              onClick={() => setSelected(i)}
            >
              <span className="service-symbol">{service.symbol}</span>
              <small>{service.kind}</small>
              <strong>{service.name}</strong>
            </button>
          ))}
        </div>
      </div>
      <p className="flow-explanation">
        Static files: browser → CloudFront → S3. Probes: API Gateway →
        diagnostic Lambda. Illustrations: API Gateway → illustrator Lambda →
        DynamoDB allowance → Bedrock → S3. Logs and metrics → CloudWatch.
      </p>
      <section className="service-detail">
        <div>
          <span className="eyebrow">{item.kind}</span>
          <h3>{item.name}</h3>
          <p>{item.purpose}</p>
        </div>
        <div>
          <h4>Responsibility</h4>
          <p>{item.detail}</p>
          <h4>Security boundary</h4>
          <p>{item.security}</p>
          <h4>Cost model</h4>
          <p>{item.cost}</p>
        </div>
      </section>
      <div className="architecture-decisions">
        <article>
          <span>01</span>
          <h3>Code owns the world.</h3>
          <p>
            Typed state and deterministic rules decide every turn. Journal text
            is generated from those results. No LLM or external model is
            involved.
          </p>
        </article>
        <article>
          <span>02</span>
          <h3>Evidence earns its label.</h3>
          <p>
            Browser timings are browser timings. API responses identify their
            source. No static “healthy” card stands in for a measurement.
          </p>
        </article>
        <article>
          <span>03</span>
          <h3>Small enough to operate.</h3>
          <p>
            No always-on compute, database, NAT gateway, or orchestration layer
            is needed for this scope. Persistence is explicitly browser-local.
          </p>
        </article>
      </div>
      <div className="document-links">
        <a
          href={`${repo}/tree/main/infrastructure`}
          target="_blank"
          rel="noreferrer"
        >
          Inspect the infrastructure <span>↗</span>
        </a>
        <a
          href={`${repo}/blob/main/docs/operations/runbooks/diagnostic-failure.md`}
          target="_blank"
          rel="noreferrer"
        >
          Follow the incident runbook <span>↗</span>
        </a>
        <a
          href={`${repo}/blob/main/docs/deployment/aws-deployment.md`}
          target="_blank"
          rel="noreferrer"
        >
          Deployment & cleanup <span>↗</span>
        </a>
      </div>
    </>
  );
}
