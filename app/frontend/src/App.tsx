import { useEffect, useState } from "react";
import "./App.css";
import "./Colony.css";
import SettlementMap from "./components/SettlementMap";
import Operations from "./components/Operations";
import Architecture from "./components/Architecture";
import {
  advanceDay,
  expeditionStatus,
  priorities,
  weatherFor,
  type Priority,
} from "./simulation/advanceDay";
import {
  loadExpedition,
  newExpedition,
  saveKey,
  type Expedition,
} from "./lib/storage";
import { loadRuntimeConfig, type RuntimeConfig } from "./lib/operations";

const repository = "https://github.com/lakotacamp/aws-cloudops-security-lab";
const signed = (number: number) => (number > 0 ? `+${number}` : `${number}`);
function TomeOrnament() {
  return (
    <svg
      className="tome-ornament"
      viewBox="0 0 240 40"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M8 20h70m84 0h70M20 16h45m110 0h45M74 20c16 0 17-14 29-14 9 0 10 10 3 10-6 0-4-7 1-5M166 20c-16 0-17-14-29-14-9 0-10 10-3 10 6 0 4-7-1-5M74 20c16 0 17 14 29 14 9 0 10-10 3-10-6 0-4 7 1 5M166 20c-16 0-17 14-29 14-9 0-10-10-3-10 6 0 4 7-1 5" />
        <path d="m120 8 8 12-8 12-8-12z" />
      </g>
      <circle cx="120" cy="20" r="2" fill="currentColor" />
      <circle cx="5" cy="20" r="2" fill="currentColor" />
      <circle cx="235" cy="20" r="2" fill="currentColor" />
    </svg>
  );
}
function App() {
  const [initial] = useState(loadExpedition);
  const [expedition, setExpedition] = useState(initial.expedition);
  const [notice, setNotice] = useState(initial.notice);
  const [view, setView] = useState<"colony" | "operations" | "architecture">(
    "colony",
  );
  const [priority, setPriority] = useState<Priority>("balanced");
  const [resetConfirm, setResetConfirm] = useState(false);
  const [config, setConfig] = useState<RuntimeConfig>({ apiBaseUrl: "" });
  const [configError, setConfigError] = useState("");
  const [configLoaded, setConfigLoaded] = useState(false);
  const [turnDuration, setTurnDuration] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    loadRuntimeConfig()
      .then((value) => {
        if (active) setConfig(value);
      })
      .catch(() => {
        if (active)
          setConfigError(
            "Cloud configuration could not be loaded. Browser mode remains available.",
          );
      })
      .finally(() => {
        if (active) setConfigLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);
  const { colony, history } = expedition;
  const outcome = history[0];
  const status = expeditionStatus(colony);
  const nextWeather = weatherFor(colony.day + 1);
  function store(next: Expedition) {
    setExpedition(next);
    try {
      localStorage.setItem(saveKey, JSON.stringify(next));
      setNotice("");
    } catch {
      setNotice(
        "Browser storage is unavailable. You can keep playing, but refresh will lose this session. Export your journal to keep a copy.",
      );
    }
  }
  function takeTurn() {
    const start = performance.now();
    const result = advanceDay(colony, priority);
    store({
      version: 1,
      colony: result.colony,
      history: [result.outcome, ...history].slice(0, 18),
    });
    setTurnDuration(Math.round((performance.now() - start) * 100) / 100);
  }
  function exportJournal() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(expedition, null, 2)], {
        type: "application/json",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `hearthfall-day-${colony.day}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className={`app-shell ${view === "colony" ? "colony-theme" : ""}`}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <a className="brand" href="#main" onClick={() => setView("colony")}>
          <span className="brand-mark" aria-hidden="true">
            H<span>✦</span>
          </span>
          <span>
            HEARTHFALL<small>COLONY SIMULATOR / OPS SHOWCASE</small>
          </span>
        </a>
        <nav aria-label="Main navigation">
          {(["colony", "operations", "architecture"] as const).map((tab) => (
            <button
              key={tab}
              aria-current={view === tab ? "page" : undefined}
              onClick={() => setView(tab)}
            >
              {tab === "colony"
                ? "The colony"
                : tab === "operations"
                  ? "Operations"
                  : "Architecture"}
            </button>
          ))}
        </nav>
        <a
          className="source-link"
          href={repository}
          target="_blank"
          rel="noreferrer"
        >
          Source code <span aria-hidden="true">↗</span>
        </a>
      </header>
      <main id="main">
        <section className="page-intro">
          <div>
            <p className="eyebrow">
              <span />{" "}
              {view === "colony"
                ? "AN ACCOUNT OF EIGHTEEN SETTLERS"
                : "AN INTERACTIVE SYSTEMS PROJECT"}
            </p>
            <h1>
              {view === "colony" ? (
                <>
                  The Chronicles
                  <br />
                  <em>of Hearthfall</em>
                </>
              ) : view === "operations" ? (
                <>
                  Every signal
                  <br />
                  <em>has a source.</em>
                </>
              ) : (
                <>
                  Built with purpose.
                  <br />
                  <em>Designed to explain.</em>
                </>
              )}
            </h1>
          </div>
          <div className="intro-side">
            <p>
              {view === "colony"
                ? "A small settlement at the edge of the known world. Tend its provisions, guide its people, and write the next day of their story."
                : view === "operations"
                  ? "Probe the service, introduce a controlled failure, and verify recovery. Inspect what was measured and where it came from."
                  : "A narrow application with a concrete AWS deployment path. Each service has a responsibility, a security boundary, and a cost."}
            </p>
            {view === "colony" ? (
              <div className="folio-label">
                <span>VOLUME I</span>
                <span>A thirty-day expedition</span>
              </div>
            ) : (
              <div className="mode-label">
                <i className="live-dot" />{" "}
                {config.apiBaseUrl
                  ? "API endpoint configured"
                  : "Playable browser edition"}
                <span>v0.2</span>
              </div>
            )}
          </div>
          {view === "colony" && <TomeOrnament />}
        </section>
        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}
        {configError && (
          <p className="notice" role="status">
            {configError}
          </p>
        )}
        <section hidden={view !== "colony"} aria-label="Colony simulator">
          <div className="section-bar">
            <div>
              <span className="eyebrow">CHAPTER I · THE EXPEDITION</span>
              <h2>Hearthfall Outpost</h2>
            </div>
            <div className="day-tag">
              <span>DAY</span>
              <strong>{colony.day}</strong>
              <span>/ 30</span>
            </div>
          </div>
          <div className="colony-layout">
            <SettlementMap colony={colony} />
            <aside className="command-panel">
              <div className="panel-heading">
                <span className="eyebrow">SETTLEMENT STATUS</span>
                <span className={`risk risk-${colony.risk.toLowerCase()}`}>
                  {colony.risk} risk
                </span>
              </div>
              <h3>
                18 people.
                <br />
                One shared future.
              </h3>
              <p className="muted">
                Reach day 30 with food, water, and morale remaining. Medicine
                supports recovery days.
              </p>
              <div className="resource-list">
                {[
                  {
                    name: "Food",
                    value: colony.food,
                    max: 200,
                    icon: "⌁",
                    change: outcome?.foodChange,
                  },
                  {
                    name: "Water",
                    value: colony.water,
                    max: 160,
                    icon: "◈",
                    change: outcome?.waterChange,
                  },
                  {
                    name: "Medicine",
                    value: colony.medicine,
                    max: 50,
                    icon: "+",
                    change: outcome?.medicineChange,
                  },
                  {
                    name: "Morale",
                    value: colony.morale,
                    max: 100,
                    icon: "☀",
                    change: outcome?.moraleChange,
                  },
                ].map((resource) => (
                  <div className="resource" key={resource.name}>
                    <div className="resource-title">
                      <span>
                        <b aria-hidden="true">{resource.icon}</b>
                        {resource.name}
                      </span>
                      <strong>
                        {resource.value}
                        <small>
                          {resource.change !== undefined
                            ? signed(resource.change)
                            : "—"}
                        </small>
                      </strong>
                    </div>
                    <meter
                      min="0"
                      max={resource.max}
                      value={resource.value}
                      aria-label={`${resource.name}: ${resource.value} of ${resource.max}`}
                    />
                  </div>
                ))}
              </div>
              <div className="forecast">
                <span>Tomorrow’s forecast</span>
                <strong>{nextWeather}</strong>
                <small>
                  {nextWeather === "Rain"
                    ? "Rain barrels collect +8 water"
                    : nextWeather === "Frost"
                      ? "−3 food and −2 morale after your decision"
                      : "No weather modifier"}
                </small>
              </div>
            </aside>
          </div>
          <div className="decision-panel">
            <div className="decision-heading">
              <span className="eyebrow">THE COUNCIL’S DELIBERATIONS</span>
              <h3>Set the day’s priority.</h3>
              <p className="muted">
                Every choice has a cost. Weather modifies these base effects.
              </p>
            </div>
            <div className="priority-grid">
              {priorities.map((item) => (
                <button
                  className={`priority ${priority === item.id ? "selected" : ""}`}
                  key={item.id}
                  aria-pressed={priority === item.id}
                  disabled={status !== "active"}
                  onClick={() => setPriority(item.id)}
                >
                  <span className="selection-dot" />
                  <strong>{item.name}</strong>
                  <span>{item.description}</span>
                  <small>{item.effect}</small>
                </button>
              ))}
            </div>
            <div className="turn-actions">
              <p role="status">
                {status === "completed"
                  ? "Expedition complete. Hearthfall made it to day 30."
                  : status === "depleted"
                    ? "The expedition has run out of an essential resource. Start again and try a different balance."
                    : "Deterministic rules. Real consequences. No model decides the outcome."}
              </p>
              <button
                className="primary-button"
                disabled={status !== "active"}
                onClick={takeTurn}
              >
                Advance to day {colony.day + 1}{" "}
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
          <div className="journal-layout">
            <section className="journal-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">THE KEEPER’S RECORD</span>
                  <h3>From the colony journal.</h3>
                </div>
                <button className="text-button" onClick={exportJournal}>
                  Export JSON ↗
                </button>
              </div>
              <div className="journal-entries" aria-live="polite">
                {history.length ? (
                  history.slice(0, 5).map((turn) => (
                    <article key={turn.day} className="journal-entry">
                      <div className="journal-day">
                        DAY<strong>{turn.day}</strong>
                      </div>
                      <div>
                        <span className="entry-meta">
                          {turn.weather} /{" "}
                          {priorities.find((p) => p.id === turn.priority)?.name}
                        </span>
                        <p>{turn.summary}</p>
                      </div>
                    </article>
                  ))
                ) : (
                  <article className="journal-entry">
                    <div className="journal-day">
                      DAY<strong>12</strong>
                    </div>
                    <div>
                      <span className="entry-meta">The beginning</span>
                      <p>{colony.journalEntry}</p>
                    </div>
                  </article>
                )}
              </div>
              <p className="fine-print">
                Rule-generated journal · saved in this browser · latest five
                entries shown; all entries included in export
              </p>
            </section>
            <aside className="crew-panel">
              <span className="eyebrow">PEOPLE OF HEARTHFALL</span>
              <h3>A few of the founders.</h3>
              {colony.foundingColonists.map((person, i) => (
                <div className="crew-person" key={person.name}>
                  <span className={`avatar avatar-${i}`}>
                    {person.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                  <div>
                    <strong>{person.name}</strong>
                    <small>{person.role}</small>
                  </div>
                </div>
              ))}
              <div className="restart-area">
                {resetConfirm ? (
                  <>
                    <p>Replace this browser’s expedition with a fresh camp?</p>
                    <button
                      className="text-button"
                      onClick={() => {
                        store(newExpedition());
                        setResetConfirm(false);
                        setTurnDuration(null);
                      }}
                    >
                      Start fresh
                    </button>
                    <button
                      className="text-button"
                      onClick={() => setResetConfirm(false)}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    className="text-button"
                    onClick={() => setResetConfirm(true)}
                  >
                    Start a new expedition ↺
                  </button>
                )}
              </div>
            </aside>
          </div>
        </section>
        <section hidden={view !== "operations"} aria-label="Operations console">
          <Operations
            config={config}
            ready={configLoaded}
            turnDuration={turnDuration}
          />
        </section>
        <section hidden={view !== "architecture"} aria-label="AWS architecture">
          <Architecture />
        </section>
        <section className="project-note">
          <span className="note-star" aria-hidden="true">
            ✦
          </span>
          <div>
            <span className="eyebrow">WHY THIS EXISTS</span>
            <h2>
              A playable application.
              <br />
              An inspectable engineering story.
            </h2>
          </div>
          <div>
            <p>
              Hearthfall connects a small simulation to the work of operating
              software: state, failures, evidence, recovery, and clear
              boundaries.
            </p>
            <a href={`${repository}#readme`} target="_blank" rel="noreferrer">
              Read the engineering record ↗
            </a>
          </div>
        </section>
      </main>
      <footer>
        <span>
          HEARTHFALL <small>by Lakota Camp</small>
        </span>
        <span>React · TypeScript · AWS deployment blueprint</span>
        <a href={repository}>Built in the open ↗</a>
      </footer>
    </div>
  );
}
export default App;
