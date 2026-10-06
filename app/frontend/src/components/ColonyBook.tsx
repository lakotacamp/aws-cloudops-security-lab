import { useRef, useState } from "react";
import SettlementMap from "./SettlementMap";
import Woodcut from "./Woodcut";
import { chroniclePages, voices, writeDiary } from "../simulation/chronicle";
import {
  advanceDay,
  expeditionStatus,
  priorities,
  weatherFor,
  type Priority,
} from "../simulation/advanceDay";
import type { Expedition } from "../lib/storage";
import { newExpedition } from "../lib/storage";
import type { RuntimeConfig } from "../lib/operations";
import "./ColonyBook.css";

const resources = [
  {
    key: "food",
    label: "Food",
    maximum: 200,
    symbol: "⌁",
    detail:
      "The storehouse supplies every daily ration. Foraging brings provisions home; frost takes three additional measures.",
    advice: "Send out foragers to rebuild the food stores.",
    priority: "forage",
  },
  {
    key: "water",
    label: "Water",
    maximum: 160,
    symbol: "◈",
    detail:
      "The waterworks hold the settlement's drinking supply. Rain returns eight measures; foraging uses the most water.",
    advice: "Conserve supplies to slow water use.",
    priority: "conserve",
  },
  {
    key: "medicine",
    label: "Medicine",
    maximum: 50,
    symbol: "+",
    detail:
      "Ordinary days use one measure; recovery uses two. Conservation leaves the medicine chest untouched. An empty chest alone does not end the expedition.",
    advice: "Conserve supplies to preserve medicine.",
    priority: "conserve",
  },
  {
    key: "morale",
    label: "Morale",
    maximum: 100,
    symbol: "☀",
    detail:
      "The settlement's shared resolve. A recovery day restores twelve marks before weather; frost costs another two.",
    advice: "Rest and recover to lift the camp's spirits.",
    priority: "restore",
  },
] as const;

export default function ColonyBook({
  expedition,
  store,
  config,
  onTurn,
}: {
  expedition: Expedition;
  store: (next: Expedition) => void;
  config: RuntimeConfig;
  onTurn: (duration: number | null) => void;
}) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [priority, setPriority] = useState<Priority>("balanced");
  const [selectedResource, setSelectedResource] =
    useState<(typeof resources)[number]["key"]>("food");
  const [turning, setTurning] = useState(false);
  const [direction, setDirection] = useState("forward");
  const [resetConfirm, setResetConfirm] = useState(false);
  const [enlargedMap, setEnlargedMap] = useState(false);
  const lock = useRef(false);
  const bookTop = useRef<HTMLDivElement>(null);
  const pages = chroniclePages(expedition);
  const index = Math.max(
    0,
    pages.findIndex(
      (p) => p.colony.day === (selectedDay ?? expedition.colony.day),
    ),
  );
  const page = pages[index];
  const diary = writeDiary(page);
  const voice = voices[diary.narrator.id];
  const latest = index === pages.length - 1;
  const status = expeditionStatus(expedition.colony);
  const resource = resources.find((item) => item.key === selectedResource)!;
  const nextWeather = weatherFor(expedition.colony.day + 1);

  function turnTo(day: number, forward: boolean) {
    setDirection(forward ? "forward" : "backward");
    setTurning(true);
    setSelectedDay(day);
    window.setTimeout(() => setTurning(false), 750);
    bookTop.current?.scrollIntoView({ behavior: "auto", block: "start" });
    requestAnimationFrame(() =>
      bookTop.current
        ?.querySelector<HTMLElement>(".diary-title")
        ?.focus({ preventScroll: true }),
    );
  }
  function takeTurn() {
    if (lock.current || !latest || status !== "active") return;
    lock.current = true;
    const started = performance.now();
    const result = advanceDay(expedition.colony, priority);
    store({
      ...expedition,
      colony: result.colony,
      history: [result.outcome, ...expedition.history],
    });
    onTurn(Math.round((performance.now() - started) * 100) / 100);
    turnTo(result.colony.day, true);
    window.setTimeout(() => {
      lock.current = false;
      setTurning(false);
    }, 750);
  }
  function exportBook() {
    const diaryPages = pages.map((p) => ({
      day: p.colony.day,
      ...writeDiary(p),
    }));
    const url = URL.createObjectURL(
      new Blob([JSON.stringify({ ...expedition, diaryPages }, null, 2)], {
        type: "application/json",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `hearthfall-book-day-${expedition.colony.day}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="chronicle" ref={bookTop}>
      <div className="book-toolbar">
        <div>
          <span className="eyebrow">THE HEARTHFALL PAPERS</span>
          <span className="book-subtitle">
            A history in the hands of its people
          </span>
        </div>
        <label className="folio-picker">
          Open at{" "}
          <select
            aria-label="Open a recorded day"
            value={page.colony.day}
            onChange={(e) =>
              turnTo(
                Number(e.target.value),
                Number(e.target.value) > page.colony.day,
              )
            }
          >
            {pages.map((p) => (
              <option key={p.colony.day} value={p.colony.day}>
                Day {p.colony.day}
                {p.colony.day === expedition.colony.day ? " · latest" : ""}
              </option>
            ))}
          </select>
        </label>
        <button className="book-link" onClick={exportBook}>
          Export the record ↗
        </button>
      </div>
      <div className={`book-cover ${turning ? `is-turning ${direction}` : ""}`}>
        <div
          className="book-spread"
          key={`${expedition.editionId}-${page.colony.day}`}
        >
          <article
            className="book-page diary-leaf"
            aria-label={`Diary for day ${page.colony.day}`}
          >
            <div className="running-head">
              <span>HEARTHFALL · VOLUME I</span>
              <span>THE PERSONAL ACCOUNTS</span>
            </div>
            <div className="diary-heading">
              <span className="day-seal">
                Day <b>{page.colony.day}</b>
              </span>
              <span className="eyebrow">
                {page.outcome?.weather ?? "THE OPENING ACCOUNT"}
                <br />
                {page.outcome
                  ? priorities.find((p) => p.id === page.outcome?.priority)
                      ?.name
                  : "Eighteen settlers · one shared future"}
              </span>
            </div>
            <h2 className="diary-title" tabIndex={-1}>
              {diary.title}
            </h2>
            <div className="diary-byline">
              <span className="author-seal" aria-hidden="true">
                {voice.initials}
              </span>
              <div>
                <strong>From the diary of {voice.name}</strong>
                <span>{voice.role}</span>
              </div>
              <details className="narrator-note">
                <summary aria-label="Why this narrator?">✧</summary>
                <p>{diary.narrator.reason}</p>
              </details>
            </div>
            <Woodcut
              key={`${expedition.editionId}-${page.colony.day}`}
              page={page}
              editionId={expedition.editionId ?? ""}
              config={config}
              caption={diary.caption}
              automatic={latest}
            />
            <div className="diary-prose">
              {diary.paragraphs.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
            <div className="diary-signature">
              {voice.name}
              <span>✦</span>
            </div>
            <div className="page-foot">
              <span>SET DOWN AT HEARTHFALL</span>
              <span>{index * 2 + 1}</span>
            </div>
          </article>
          <section
            className="book-page survey-leaf"
            aria-label={`Settlement ledger for day ${page.colony.day}`}
          >
            <div className="running-head">
              <span>THE SURVEY & THE STORES</span>
              <span>DAY {page.colony.day}</span>
            </div>
            <div className="survey-heading">
              <h2>The state of our settlement</h2>
              <span className={`risk risk-${page.colony.risk.toLowerCase()}`}>
                {page.colony.risk} risk
              </span>
            </div>
            <div className={`book-map ${enlargedMap ? "expanded" : ""}`}>
              <SettlementMap
                colony={page.colony}
                onSelectResource={setSelectedResource}
              />
              <button
                className="map-expand book-link"
                aria-pressed={enlargedMap}
                onClick={() => setEnlargedMap(!enlargedMap)}
              >
                {enlargedMap ? "Fold the survey −" : "Unfold the survey +"}
              </button>
            </div>
            <section
              className="book-ledger"
              aria-label="Interactive supply ledger"
            >
              <div className="ledger-heading">
                <h3>In the keeper's ledger</h3>
                <span>
                  {latest ? "At this day's close" : "As recorded that day"}
                </span>
              </div>
              <div className="ledger-grid">
                {resources.map((item) => {
                  const change = page.outcome?.[`${item.key}Change`];
                  return (
                    <button
                      key={item.key}
                      className={`ledger-resource ${selectedResource === item.key ? "selected" : ""}`}
                      aria-pressed={selectedResource === item.key}
                      aria-label={`Inspect ${item.label}: ${page.colony[item.key]} of ${item.maximum}`}
                      onClick={() => setSelectedResource(item.key)}
                    >
                      <span className="ledger-name">
                        <i aria-hidden="true">{item.symbol}</i>
                        {item.label}
                      </span>
                      <strong>
                        {page.colony[item.key]}
                        <small>
                          {change === undefined
                            ? "—"
                            : `${change > 0 ? "+" : ""}${change}`}
                        </small>
                      </strong>
                      <meter
                        min={0}
                        max={item.maximum}
                        value={page.colony[item.key]}
                        aria-label={item.label}
                      />
                    </button>
                  );
                })}
              </div>
              <div className="resource-annotation" aria-live="polite">
                <strong>
                  {resource.label} · {page.colony[resource.key]} /{" "}
                  {resource.maximum}
                </strong>
                <p>{resource.detail}</p>
                {latest && status === "active" && (
                  <button
                    className="book-link"
                    onClick={() => setPriority(resource.priority)}
                  >
                    {resource.advice} →
                  </button>
                )}
              </div>
            </section>
            {latest ? (
              <section
                className="book-decisions"
                aria-label="Tomorrow's council"
              >
                <div className="ledger-heading">
                  <h3>Tomorrow's council</h3>
                  <span>
                    {status === "active"
                      ? `Forecast · ${nextWeather}`
                      : "The expedition closes"}
                  </span>
                </div>
                <div className="book-priorities">
                  {priorities.map((item) => (
                    <button
                      key={item.id}
                      aria-pressed={priority === item.id}
                      disabled={status !== "active" || turning}
                      className={priority === item.id ? "chosen" : ""}
                      onClick={() => setPriority(item.id)}
                    >
                      <span aria-hidden="true">
                        {priority === item.id ? "◆" : "◇"}
                      </span>
                      <strong>{item.name}</strong>
                      <small>{item.effect}</small>
                    </button>
                  ))}
                </div>
                <p className="council-note">
                  {status === "completed"
                    ? "We reached the thirtieth day. The final leaf is written."
                    : status === "depleted"
                      ? "An essential reserve is exhausted. This expedition's account is closed."
                      : nextWeather === "Rain"
                        ? "Rain will return eight measures of water."
                        : nextWeather === "Frost"
                          ? "Frost will cost three food and two morale after the council's choice."
                          : "Weather will leave the council's base effects unchanged."}
                </p>
                <button
                  className="turn-page-button"
                  disabled={status !== "active" || turning}
                  onClick={takeTurn}
                >
                  <span>
                    Seal the day & turn the page
                    <small>Continue to day {expedition.colony.day + 1}</small>
                  </span>
                  <b aria-hidden="true">❧</b>
                </button>
              </section>
            ) : (
              <div className="past-page-note">
                <strong>This leaf belongs to the past.</strong>
                <p>
                  The map and ledger show day {page.colony.day}. Your expedition
                  is safely at day {expedition.colony.day}.
                </p>
                <button
                  className="book-link"
                  onClick={() => turnTo(expedition.colony.day, true)}
                >
                  Return to the latest leaf →
                </button>
              </div>
            )}
            <div className="page-foot">
              <span>XVIII SETTLERS · THE NORTHERN VALLEY</span>
              <span>{index * 2 + 2}</span>
            </div>
          </section>
        </div>
        {turning && (
          <div
            className="turning-leaf"
            aria-hidden="true"
            onAnimationEnd={() => setTurning(false)}
          />
        )}
      </div>
      <nav className="book-pagination" aria-label="Book pages">
        <button
          disabled={index === 0 || turning}
          onClick={() => turnTo(pages[index - 1].colony.day, false)}
        >
          ← Earlier leaf
        </button>
        <span aria-live="polite">
          Day {page.colony.day} of 30 · folios {index * 2 + 1}–{index * 2 + 2}
        </span>
        <button
          disabled={latest || turning}
          onClick={() => turnTo(pages[index + 1].colony.day, true)}
        >
          Later leaf →
        </button>
      </nav>
      <div className="book-colophon">
        <details>
          <summary>About this edition</summary>
          <p>
            A fictional history, assembled from the real consequences of your
            choices. Each narrator is selected by the day's task or most urgent
            shortage. New turn woodcuts are generated by AI in the connected AWS
            edition; the opening frontispiece is a separately generated print.
            Illustrations interpret the story and do not change the game. Your
            diary and simulation stay in this browser; only the anonymous
            edition identifier and choices go to the illustrator.
          </p>
        </details>
        <div>
          {resetConfirm ? (
            <>
              <span>Begin a fresh volume?</span>
              <button
                className="book-link"
                onClick={() => {
                  store(newExpedition());
                  setSelectedDay(null);
                  setResetConfirm(false);
                  setPriority("balanced");
                  onTurn(null);
                }}
              >
                Start fresh
              </button>
              <button
                className="book-link"
                onClick={() => setResetConfirm(false)}
              >
                Cancel
              </button>
            </>
          ) : (
            <button className="book-link" onClick={() => setResetConfirm(true)}>
              Begin a new volume ↺
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
