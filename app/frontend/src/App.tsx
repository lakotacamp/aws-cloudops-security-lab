import { useState } from 'react'
import './App.css'
import { seedColony } from './data/seedColony'

function App() {
  const [colony, setColony] = useState(seedColony)

  function handleAdvanceDay() {
    setColony((currentColony) => {
      const nextDay = currentColony.day + 1
      const nextFood = Math.max(currentColony.food - 9, 0)
      const nextWater = Math.max(currentColony.water - 7, 0)
      const nextMedicine = Math.max(currentColony.medicine - 1, 0)
      const nextMorale = Math.max(currentColony.morale - 2, 0)

      const nextRisk =
        nextFood < 80 || nextWater < 50 ? 'Elevated' : currentColony.risk

      return {
        ...currentColony,
        day: nextDay,
        food: nextFood,
        water: nextWater,
        medicine: nextMedicine,
        morale: nextMorale,
        risk: nextRisk,
        journalEntry: `Day ${nextDay}: The colony completed another hard day below the northern ridge. Food and water stores were rationed, medicine was checked, and the watch reported that risk remains ${nextRisk.toLowerCase()}.`,
      }
    })
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