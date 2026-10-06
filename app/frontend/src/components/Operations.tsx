import { useState } from "react";
import { runProbe, type Probe, type RuntimeConfig } from "../lib/operations";

export default function Operations({
  config,
  ready,
  turnDuration,
}: {
  config: RuntimeConfig;
  ready: boolean;
  turnDuration: number | null;
}) {
  const [probes, setProbes] = useState<Probe[]>([]);
  const [busy, setBusy] = useState(false);
  const latest = probes[0];
  const failures = probes.filter((p) => !p.ok).length;
  const average = probes.length
    ? (
        probes.reduce((sum, p) => sum + p.durationMs, 0) / probes.length
      ).toFixed(1)
    : null;
  async function check(diagnostic: boolean) {
    setBusy(true);
    try {
      const result = await runProbe(config, diagnostic);
      setProbes((items) => [result, ...items].slice(0, 30));
    } finally {
      setBusy(false);
    }
  }
  const source = config.apiBaseUrl
    ? "Configured API · measurements from this browser session"
    : "Browser demonstration · no AWS requests";
  return (
    <>
      <div className="section-bar">
        <div>
          <span className="eyebrow">02 / MISSION CONTROL</span>
          <h2>Observe. Interrupt. Recover.</h2>
        </div>
        <span className="outline-badge">
          {config.apiBaseUrl
            ? "API connected in configuration"
            : "Local demonstration"}
        </span>
      </div>
      <p className="signal-source">
        {source}. Request history resets on refresh. AWS alarm state is
        available in the deployed CloudWatch dashboard, not inferred here.
      </p>
      <div className="metric-grid">
        {[
          [
            "Latest probe",
            latest ? (latest.ok ? "Responding" : "Degraded") : "Not checked",
            latest
              ? `${latest.source} · ${latest.status || "network error"}`
              : "Run a health check to collect evidence",
          ],
          [
            "Mean request duration",
            average === null ? "—" : `${average} ms`,
            "Observed client time; includes network overhead",
          ],
          [
            "Failed probes",
            probes.length ? `${failures} / ${probes.length}` : "—",
            "Includes intentional diagnostics · last 30 probes",
          ],
          [
            "Last colony turn",
            turnDuration === null ? "—" : `${turnDuration} ms`,
            "Browser simulation + local save; not Lambda duration",
          ],
        ].map(([label, value, detail]) => (
          <article className="metric-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{detail}</small>
          </article>
        ))}
      </div>
      <div className="ops-layout">
        <section className="probe-panel">
          <span className="eyebrow">A CONTROLLED EXPERIMENT</span>
          <h3>
            One failed request.
            <br />A visible recovery.
          </h3>
          <p>
            Run a baseline probe, trigger a diagnostic failure, then probe
            again. The diagnostic affects only its own request. It never changes
            colony data or a global service flag.
          </p>
          <div className="experiment-steps">
            <span>01 · Baseline</span>
            <span>02 · Failure</span>
            <span>03 · Recovery</span>
          </div>
          <div className="probe-buttons">
            <button
              className="primary-button"
              disabled={busy || !ready}
              onClick={() => check(false)}
            >
              {busy
                ? "Checking…"
                : latest && !latest.ok
                  ? "Verify recovery"
                  : "Check service"}{" "}
              <span>↗</span>
            </button>
            <button
              className="secondary-button"
              disabled={busy || !ready}
              onClick={() => check(true)}
            >
              Trigger diagnostic failure
            </button>
          </div>
          <div
            className={`probe-result ${latest && !latest.ok ? "failed" : ""}`}
            role="status"
          >
            <strong>
              {latest
                ? latest.ok
                  ? "Probe succeeded"
                  : "Failure observed"
                : "Waiting for your first probe"}
            </strong>
            <p>
              {latest?.message ??
                "Nothing has been measured yet. Choose “Check service” to begin."}
            </p>
            {latest && (
              <small>
                {new Date(latest.timestamp).toLocaleTimeString()} ·{" "}
                {latest.durationMs} ms · {latest.source}
              </small>
            )}
          </div>
        </section>
        <section className="evidence-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">REQUEST EVIDENCE</span>
              <h3>The last 30 probes.</h3>
            </div>
            <span>{probes.length} recorded</span>
          </div>
          {probes.length ? (
            <ol className="probe-history">
              {probes.map((probe) => (
                <li key={probe.id + probe.timestamp}>
                  <span className={`event-dot ${probe.ok ? "" : "error"}`} />
                  <div>
                    <strong>
                      {probe.diagnostic ? "Diagnostic request" : "Health probe"}
                      <b>{probe.status || "ERR"}</b>
                    </strong>
                    <small>
                      {new Date(probe.timestamp).toLocaleTimeString()} ·{" "}
                      {probe.durationMs} ms · {probe.source}
                    </small>
                    <code title={probe.id}>{probe.id}</code>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="empty-evidence">
              <span aria-hidden="true">⌁</span>
              <p>Evidence begins with a request.</p>
              <small>
                No fabricated latency, availability, or alarm values.
              </small>
            </div>
          )}
        </section>
      </div>
      <div className="ops-notes">
        <article>
          <span className="eyebrow">DETECTION</span>
          <h3>HTTP errors are not Lambda errors.</h3>
          <p>
            The diagnostic returns HTTP 503 intentionally. The Lambda invocation
            can still complete successfully. The AWS template therefore alarms
            on API Gateway 5xx responses.
          </p>
        </article>
        <article>
          <span className="eyebrow">INVESTIGATION</span>
          <h3>A request ID connects the story.</h3>
          <p>
            In AWS mode, match the request ID here with structured Lambda logs
            and API access logs. Bodies, credentials, and source IPs are
            excluded from the configured log format.
          </p>
        </article>
        <article>
          <span className="eyebrow">RECOVERY</span>
          <h3>Verify behavior after a failure.</h3>
          <p>
            A successful follow-up probe proves that request succeeded.
            CloudWatch alarm transitions can lag behind because metrics are
            aggregated over time.
          </p>
        </article>
      </div>
    </>
  );
}
