import { useEffect, useState } from "react";
import "./App.css";
import "./Colony.css";
import ColonyBook from "./components/ColonyBook";
import Operations from "./components/Operations";
import Architecture from "./components/Architecture";
import { loadExpedition, saveKey, type Expedition } from "./lib/storage";
import { loadRuntimeConfig, type RuntimeConfig } from "./lib/operations";

const repository = "https://github.com/lakotacamp/aws-cloudops-security-lab";
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
  function store(next: Expedition) {
    try {
      localStorage.setItem(saveKey, JSON.stringify(next));
      setExpedition(next);
      setNotice("");
    } catch {
      setExpedition({ ...next, editionId: undefined });
      setNotice(
        "Browser storage is unavailable. You can keep playing, but refresh will lose this session. Export your journal to keep a copy.",
      );
    }
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
                  The Chronicles <br />
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
                ? "Eighteen lives, recorded one day at a time. Open the ledger, guide the settlement, and turn the next leaf of its history."
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
          <ColonyBook
            expedition={expedition}
            store={store}
            config={{
              ...config,
              illustrationsEnabled:
                config.illustrationsEnabled && !!expedition.editionId,
            }}
            onTurn={setTurnDuration}
          />
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
