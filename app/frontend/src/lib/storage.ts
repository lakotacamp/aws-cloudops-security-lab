import { seedColony, type SeedColony } from "../data/seedColony.ts";
import { priorities, type TurnOutcome } from "../simulation/advanceDay.ts";

export const saveKey = "hearthfall-expedition-v1";
export type Expedition = {
  version: 1;
  editionId?: string;
  colony: SeedColony;
  history: TurnOutcome[];
};
export function newExpedition(): Expedition {
  return {
    version: 1,
    editionId: crypto.randomUUID(),
    colony: structuredClone(seedColony),
    history: [],
  };
}
export function parseExpedition(raw: string): Expedition {
  const value = JSON.parse(raw);
  const c = value?.colony;
  const limits: Record<string, number> = {
    day: 30,
    food: 200,
    water: 160,
    medicine: 50,
    morale: 100,
  };
  if (
    value?.version !== 1 ||
    !c ||
    c.day < 12 ||
    Object.entries(limits).some(
      ([key, max]) => !Number.isInteger(c[key]) || c[key] < 0 || c[key] > max,
    ) ||
    !["Moderate", "Elevated", "Critical"].includes(c.risk) ||
    typeof c.journalEntry !== "string" ||
    c.journalEntry.length > 1000 ||
    !Array.isArray(value.history) ||
    value.history.length > 18
  )
    throw new Error("Invalid expedition save");
  if (
    value.editionId !== undefined &&
    (typeof value.editionId !== "string" ||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(
        value.editionId,
      ))
  )
    throw new Error("Invalid book identifier");
  if (value.history.length !== c.day - 12)
    throw new Error("Incomplete journal");
  for (const [index, turn] of value.history.entries()) {
    if (
      !turn ||
      !Number.isInteger(turn.day) ||
      turn.day < 13 ||
      turn.day > c.day ||
      turn.day !== c.day - index ||
      typeof turn.summary !== "string" ||
      turn.summary.length > 1000 ||
      !["Rain", "Clear", "Overcast", "Frost"].includes(turn.weather) ||
      !priorities.some((p) => p.id === turn.priority) ||
      ["foodChange", "waterChange", "medicineChange", "moraleChange"].some(
        (k) => !Number.isInteger(turn[k]) || Math.abs(turn[k]) > 200,
      )
    )
      throw new Error("Invalid journal entry");
  }
  return {
    version: 1,
    ...(value.editionId ? { editionId: value.editionId } : {}),
    colony: {
      ...structuredClone(seedColony),
      day: c.day,
      food: c.food,
      water: c.water,
      medicine: c.medicine,
      morale: c.morale,
      risk: c.risk,
      journalEntry: c.journalEntry,
    },
    history: value.history,
  };
}
export function loadExpedition(): { expedition: Expedition; notice: string } {
  try {
    const raw = localStorage.getItem(saveKey);
    const expedition = raw ? parseExpedition(raw) : newExpedition();
    expedition.editionId ??= crypto.randomUUID();
    // Persist the illustration idempotency key before any paid work is requested.
    try {
      localStorage.setItem(saveKey, JSON.stringify(expedition));
    } catch {
      return {
        expedition: { ...expedition, editionId: undefined },
        notice:
          "This browser cannot save the book. You can play and export it, but fresh illustration requests are disabled to prevent duplicate charges after refresh.",
      };
    }
    return {
      expedition,
      notice: "",
    };
  } catch {
    return {
      expedition: { ...newExpedition(), editionId: undefined },
      notice:
        "A saved expedition could not be loaded. A fresh camp is ready; your old save has not been changed.",
    };
  }
}
