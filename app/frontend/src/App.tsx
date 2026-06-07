import { useState } from 'react'
import './App.css'
import { opsEvents, opsMetrics } from './data/mockOpsDashboard'
import { seedColony } from './data/seedColony'
import { advanceDay, type TurnOutcome } from './simulation/advanceDay'

function App() {
  const [colony, setColony] = useState(seedColony)
  const [latestTurnOutcome, setLatestTurnOutcome] =
    useState<TurnOutcome | null>(null)

  function handleAdvanceDay() {
    const result = advanceDay(colony)

    setColony(result.colony)
    setLatestTurnOutcome(result.outcome)
  }

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

      <section id="colony-demo" className="colony-panel">
        <div className="section-heading">
          <p className="eyebrow">Seeded Colony State</p>
          <h2>{colony.name}</h2>
          <p>{colony.location}</p>
        </div>

        <div className="stat-grid">
          <article className="stat-card">
            <span>Day</span>
            <strong>{colony.day}</strong>
          </article>

          <article className="stat-card">
            <span>Population</span>
            <strong>{colony.population}</strong>
          </article>

          <article className="stat-card">
            <span>Food</span>
            <strong>{colony.food}</strong>
          </article>

          <article className="stat-card">
            <span>Water</span>
            <strong>{colony.water}</strong>
          </article>

          <article className="stat-card">
            <span>Medicine</span>
            <strong>{colony.medicine}</strong>
          </article>

          <article className="stat-card">
            <span>Morale</span>
            <strong>{colony.morale}</strong>
          </article>

          <article className="stat-card">
            <span>Risk</span>
            <strong>{colony.risk}</strong>
          </article>
        </div>

        <button className="advance-button" onClick={handleAdvanceDay}>
          Advance Day
        </button>

        {latestTurnOutcome && (
          <article className="turn-outcome-card">
            <h3>Latest Turn Outcome</h3>
            <p>{latestTurnOutcome.summary}</p>

            <div className="outcome-grid">
              <span>Food: {latestTurnOutcome.foodChange}</span>
              <span>Water: {latestTurnOutcome.waterChange}</span>
              <span>Medicine: {latestTurnOutcome.medicineChange}</span>
              <span>Morale: {latestTurnOutcome.moraleChange}</span>
            </div>
          </article>
        )}

        <div className="colony-grid">
          <article className="card">
            <h3>Founding Colonists</h3>

            <div className="colonist-list">
              {colony.foundingColonists.map((colonist) => (
                <section className="colonist-card" key={colonist.name}>
                  <h4>{colonist.name}</h4>
                  <p className="colonist-role">{colonist.role}</p>
                  <p>{colonist.note}</p>
                </section>
              ))}
            </div>
          </article>

          <article className="card journal-card">
            <h3>Colony Journal</h3>
            <p>{colony.journalEntry}</p>
          </article>
        </div>
      </section>

      <section className="grid">
        <article id="ops-dashboard" className="card ops-dashboard-card">
          <div className="section-heading compact-heading">
            <p className="eyebrow">CloudOps Preview</p>
            <h2>Ops Dashboard</h2>
            <p>
              Mock operational signals for the local simulation loop. These
              panels will later map to CloudWatch metrics, logs, alarms,
              CloudTrail audit evidence, and incident-response workflows.
            </p>
          </div>

          <div className="ops-metric-grid">
            {opsMetrics.map((metric) => (
              <section className="ops-metric-card" key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <p>{metric.detail}</p>
              </section>
            ))}
          </div>

          <div className="ops-event-list">
            <h3>Recent Operational Events</h3>

            {opsEvents.map((event) => (
              <section className="ops-event" key={`${event.time}-${event.title}`}>
                <span>{event.time}</span>
                <div>
                  <strong>{event.title}</strong>
                  <p>{event.detail}</p>
                </div>
              </section>
            ))}
          </div>

          <p className="status">Status: Mock dashboard data</p>
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