import { test } from "node:test";
import assert from "node:assert/strict";
import {
  advanceDay,
  expeditionStatus,
  priorities,
  weatherFor,
} from "../src/simulation/advanceDay.ts";
import { seedColony } from "../src/data/seedColony.ts";
import { newExpedition, parseExpedition } from "../src/lib/storage.ts";

test("a turn is deterministic, does not mutate its input, and reports actual changes", () => {
  const colony = structuredClone(seedColony);
  const before = structuredClone(colony);
  Object.freeze(colony);
  const first = advanceDay(colony);
  assert.deepEqual(first, advanceDay(colony));
  assert.deepEqual(colony, before);
  assert.notEqual(first.colony, colony);
  assert.equal(first.colony.day, 13);
  assert.equal(first.colony.food, 137);
  assert.equal(first.colony.journalEntry, first.outcome.summary);
});

test("depletion reports the amount actually lost, including exhausted medicine", () => {
  const current = { ...seedColony, food: 2, water: 3, medicine: 0, morale: 1 };
  const { colony, outcome } = advanceDay(current);
  assert.equal(outcome.foodChange, -2);
  assert.equal(outcome.waterChange, -3);
  assert.equal(outcome.medicineChange, 0);
  assert.equal(outcome.moraleChange, -1);
  assert.equal(expeditionStatus(colony), "depleted");
  assert.throws(() => advanceDay(colony), /ended/);
});

test("the upper limit is reflected in the reported gain", () => {
  const result = advanceDay({ ...seedColony, food: 199 }, "forage");
  assert.equal(result.colony.food, 200);
  assert.equal(result.outcome.foodChange, 1);
});

test("forecast and weather modifiers use the resulting day", () => {
  const rain = advanceDay({ ...seedColony, day: 15 }, "balanced");
  assert.equal(weatherFor(16), "Rain");
  assert.equal(rain.outcome.waterChange, 1);
  const frost = advanceDay({ ...seedColony, day: 14 }, "balanced");
  assert.equal(frost.outcome.weather, "Frost");
  assert.equal(frost.outcome.foodChange, -12);
  assert.equal(frost.outcome.moraleChange, -4);
});

test("risk can recover and is derived from resulting supplies", () => {
  assert.equal(
    advanceDay({ ...seedColony, risk: "Critical" }).colony.risk,
    "Moderate",
  );
  assert.equal(advanceDay({ ...seedColony, food: 33 }).colony.risk, "Critical");
});

test("every choice preserves numeric bounds and actual deltas across boundaries", () => {
  for (const priority of priorities)
    for (const day of [12, 13, 14, 15])
      for (const amount of [1, 2, 20, 99]) {
        const current = {
          ...seedColony,
          day,
          food: amount,
          water: amount,
          morale: amount,
          medicine: Math.min(amount, 50),
        };
        const { colony, outcome } = advanceDay(current, priority.id);
        for (const [key, maximum] of [
          ["food", 200],
          ["water", 160],
          ["medicine", 50],
          ["morale", 100],
        ] as const) {
          assert.ok(colony[key] >= 0 && colony[key] <= maximum);
          assert.equal(outcome[`${key}Change`], colony[key] - current[key]);
        }
      }
});

test("a viable sequence can complete the expedition and cannot advance beyond day 30", () => {
  let colony = structuredClone(seedColony);
  while (expeditionStatus(colony) === "active") {
    const priority =
      colony.morale < 40 ? "restore" : colony.food < 55 ? "forage" : "conserve";
    colony = advanceDay(colony, priority).colony;
  }
  assert.equal(expeditionStatus(colony), "completed");
  assert.equal(colony.day, 30);
  assert.throws(() => advanceDay(colony), /ended/);
});

test("save roundtrip preserves a real turn and rejects corrupt or unbounded data", () => {
  const result = advanceDay(seedColony, "forage");
  const saved = {
    version: 1,
    colony: result.colony,
    history: [result.outcome],
  };
  assert.deepEqual(parseExpedition(JSON.stringify(saved)), saved);
  assert.throws(() => parseExpedition("{"));
  assert.throws(() =>
    parseExpedition(JSON.stringify({ ...saved, version: 2 })),
  );
  assert.throws(() =>
    parseExpedition(
      JSON.stringify({ ...saved, colony: { ...saved.colony, food: 999999 } }),
    ),
  );
  assert.throws(() =>
    parseExpedition(
      JSON.stringify({
        ...saved,
        history: [{ ...result.outcome, summary: {} }],
      }),
    ),
  );
  assert.equal(newExpedition().history.length, 0);
});

test("restoring a save does not trust identity fields from browser storage", () => {
  const saved = newExpedition();
  saved.colony.name = "untrusted name";
  saved.colony.population = 9000;
  assert.equal(
    parseExpedition(JSON.stringify(saved)).colony.name,
    seedColony.name,
  );
  assert.equal(parseExpedition(JSON.stringify(saved)).colony.population, 18);
});
