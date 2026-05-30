import './App.css'

function App() {
  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">Colony Simulator Ops Showcase</p>

        <h1>AI-assisted colony simulation with a CloudOps command center.</h1>

        <p className="hero-copy">
          A portfolio project that combines a living settlement simulation with
          AWS-backed operations, monitoring, security documentation, and incident
          response workflows.
        </p>

        <div className="hero-actions">
          <a href="#colony-demo">View Colony Demo</a>
          <a href="#ops-dashboard">Open Ops Dashboard</a>
        </div>
      </section>

      <section className="grid">
        <article id="colony-demo" className="card">
          <h2>Colony Demo</h2>
          <p>
            The first MVP will display a seeded settlement, founding colonists,
            colony resources, morale, risk, and a journal entry generated from
            structured simulation state.
          </p>
          <p className="status">Status: Frontend shell in progress</p>
        </article>

        <article id="ops-dashboard" className="card">
          <h2>Ops Dashboard</h2>
          <p>
            The Ops Dashboard will show service health, workflow status, logs,
            incident history, security posture, and eventually real AWS
            operational signals.
          </p>
          <p className="status">Status: Mock dashboard placeholder</p>
        </article>

        <article className="card">
          <h2>Architecture Path</h2>
          <p>
            The build starts locally with React and TypeScript, then grows into
            S3, CloudFront, API Gateway, Lambda, DynamoDB, CloudWatch,
            CloudTrail, IAM, and safe incident simulation.
          </p>
          <p className="status">Status: MVP architecture documented</p>
        </article>
      </section>
    </main>
  )
}

export default App