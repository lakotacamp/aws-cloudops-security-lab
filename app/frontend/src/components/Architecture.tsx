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
      "Stores the built HTML, CSS, JavaScript, and public runtime configuration. The browser runs the simulation.",
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
      "Exposes GET /api/status and POST /api/diagnostic. Route throttles and bounded request handling limit unnecessary work.",
    security:
      "Public, stateless endpoints with no credentials or user data. Throttling is best effort, not a billing cap.",
    cost: "HTTP API request volume. Traffic abuse can create charges even with low idle cost.",
  },
  {
    name: "AWS Lambda",
    kind: "APPLICATION LOGIC",
    symbol: "λ",
    purpose: "Small, inspectable handlers",
    detail:
      "Returns health evidence or a single intentional 503. The diagnostic never mutates a global flag or persistent colony state.",
    security:
      "Execution role can write only to its log group. No storage permissions, secrets, or VPC access required.",
    cost: "Invocations and execution time at 128 MB. No provisioned concurrency.",
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
          <h2>Five services. Clear responsibilities.</h2>
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
        Static files: browser → CloudFront → S3. API requests: browser →
        CloudFront → API Gateway → Lambda. Logs and metrics → CloudWatch.
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
