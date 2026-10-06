import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  advanceDay,
  expeditionStatus,
  type Priority,
} from "../src/simulation/advanceDay.ts";
import { newExpedition, parseExpedition } from "../src/lib/storage.ts";
import {
  chroniclePages,
  chooseNarrator,
  voices,
  writeDiary,
} from "../src/simulation/chronicle.ts";
import { seedColony } from "../src/data/seedColony.ts";

test("every historical leaf preserves its own state through a complete expedition and save reload", () => {
  let book = newExpedition();
  const states = [structuredClone(book.colony)];
  while (expeditionStatus(book.colony) === "active") {
    const priority: Priority =
      book.colony.morale < 40
        ? "restore"
        : book.colony.food < 55
          ? "forage"
          : "conserve";
    const turn = advanceDay(book.colony, priority);
    book = {
      ...book,
      colony: turn.colony,
      history: [turn.outcome, ...book.history],
    };
    states.push(structuredClone(turn.colony));
  }
  const pages = chroniclePages(parseExpedition(JSON.stringify(book)));
  assert.equal(pages.length, 19);
  pages.forEach((page, i) => {
    for (const key of [
      "day",
      "food",
      "water",
      "medicine",
      "morale",
      "risk",
    ] as const)
      assert.equal(page.colony[key], states[i][key], `${key} on page ${i}`);
    assert.equal(page.choices.length, i);
  });
  assert.equal(book.colony.day, 30);
});

test("urgent shortages outrank routine tasks when selecting the consequential diarist", () => {
  const care = advanceDay(seedColony, "restore");
  assert.equal(chooseNarrator(care.colony, care.outcome).id, "elian");
  assert.equal(
    chooseNarrator({ ...care.colony, water: 0 }, care.outcome).id,
    "tovin",
  );
  assert.equal(
    chooseNarrator({ ...care.colony, food: 0 }, care.outcome).id,
    "sella",
  );
  assert.equal(
    chooseNarrator({ ...care.colony, morale: 0 }, care.outcome).id,
    "mara",
  );
  const rain = advanceDay({ ...seedColony, day: 15 }, "balanced");
  assert.equal(chooseNarrator(rain.colony, rain.outcome).id, "tovin");
});

test("diaries report actual clamped changes, exhausted medicine, and the expedition ending", () => {
  const capped = advanceDay({ ...seedColony, food: 199 }, "forage");
  const diary = writeDiary({ ...capped, choices: ["forage"] });
  assert.match(diary.paragraphs.join(" "), /food rose by 1 /);
  assert.equal(diary.narrator.id, "sella");
  assert.deepEqual(writeDiary({ ...capped, choices: ["forage"] }), diary);
  const end = advanceDay({ ...seedColony, water: 1, medicine: 0 }, "balanced");
  const final = writeDiary({ ...end, choices: ["balanced"] }).paragraphs.join(
    " ",
  );
  assert.match(final, /medicine tally did not change/);
  assert.match(final, /can go no further/);
});

test("ambiguous or discontinuous journals cannot create misleading historic ledgers", () => {
  const first = advanceDay(seedColony);
  const second = advanceDay(first.colony);
  assert.throws(
    () =>
      parseExpedition(
        JSON.stringify({
          version: 1,
          colony: second.colony,
          history: [second.outcome],
        }),
      ),
    /Incomplete/,
  );
  assert.throws(
    () =>
      parseExpedition(
        JSON.stringify({
          version: 1,
          colony: second.colony,
          history: [first.outcome, second.outcome],
        }),
      ),
    /Invalid journal/,
  );
});

test("shared illustration contract agrees with the authoritative game", () => {
  const cases = JSON.parse(
    readFileSync(
      new URL("../../shared/chronicle-cases.json", import.meta.url),
      "utf8",
    ),
  );
  for (const fixture of cases) {
    let colony = structuredClone(seedColony);
    let outcome;
    for (const priority of fixture.choices)
      ({ colony, outcome } = advanceDay(colony, priority));
    assert.deepEqual(
      [colony.food, colony.water, colony.medicine, colony.morale],
      fixture.state,
    );
    assert.equal(outcome!.weather, fixture.weather);
    assert.equal(
      voices[chooseNarrator(colony, outcome).id].name,
      fixture.narrator,
    );
  }
});
