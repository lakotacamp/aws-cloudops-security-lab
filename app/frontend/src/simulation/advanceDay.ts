import type { SeedColony } from "../data/seedColony";

export const priorities = [
  {
    id: "balanced",
    name: "Keep the balance",
    description: "Steady rations. Keep the settlement running.",
    effect: "Food −9 · Water −7 · Morale −2",
  },
  {
    id: "forage",
    name: "Send out foragers",
    description: "Trade water and energy for fresh supplies.",
    effect: "Food +12 · Water −11 · Morale −1",
  },
  {
    id: "conserve",
    name: "Conserve supplies",
    description: "Tighten rations. Your people will feel it.",
    effect: "Food −4 · Water −3 · Morale −5",
  },
  {
    id: "restore",
    name: "Rest & recover",
    description: "Share a good meal and tend to the camp.",
    effect: "Food −12 · Water −9 · Morale +12",
  },
] as const;

export type Priority = (typeof priorities)[number]["id"];
export const expeditionEnd = 30;
export function weatherFor(day: number) {
  return ["Rain", "Clear", "Overcast", "Frost"][day % 4];
}
export function expeditionStatus(
  colony: SeedColony,
): "active" | "completed" | "depleted" {
  if (colony.food === 0 || colony.water === 0 || colony.morale === 0)
    return "depleted";
  return colony.day >= expeditionEnd ? "completed" : "active";
}

export type TurnOutcome = {
  day: number;
  priority: Priority;
  weather: string;
  summary: string;
  foodChange: number;
  waterChange: number;
  medicineChange: number;
  moraleChange: number;
};

type AdvanceDayResult = {
  colony: SeedColony;
  outcome: TurnOutcome;
};

export function advanceDay(
  currentColony: SeedColony,
  priority: Priority = "balanced",
): AdvanceDayResult {
  if (expeditionStatus(currentColony) !== "active")
    throw new Error(
      "This expedition has ended. Start a new expedition to continue.",
    );
  if (!priorities.some((item) => item.id === priority))
    throw new Error("Unknown daily priority.");
  const changes = {
    balanced: [-9, -7, -1, -2],
    forage: [12, -11, -1, -1],
    conserve: [-4, -3, 0, -5],
    restore: [-12, -9, -2, 12],
  }[priority];
  const nextDay = currentColony.day + 1;
  const weather = weatherFor(nextDay);
  const clamp = (value: number, maximum: number) =>
    Math.min(maximum, Math.max(value, 0));
  const nextFood = clamp(
    currentColony.food + changes[0] - (weather === "Frost" ? 3 : 0),
    200,
  );
  const nextWater = clamp(
    currentColony.water + changes[1] + (weather === "Rain" ? 8 : 0),
    160,
  );
  const nextMedicine = clamp(currentColony.medicine + changes[2], 50);
  const nextMorale = clamp(
    currentColony.morale + changes[3] - (weather === "Frost" ? 2 : 0),
    100,
  );
  const nextRisk =
    nextFood < 25 || nextWater < 18 || nextMorale < 20
      ? "Critical"
      : nextFood < 80 || nextWater < 50 || nextMorale < 40
        ? "Elevated"
        : "Moderate";
  const action = {
    balanced: "The settlement kept its usual watch and ration schedule.",
    forage:
      "Sella brought the foragers home with fresh provisions. The long walk took extra water.",
    conserve:
      "Mara tightened the ration ledger. Supplies lasted longer, but the quiet around the cookfires grew.",
    restore:
      "Elian opened the medicine chest while the camp shared a generous meal. Spirits lifted.",
  }[priority];
  const conditions =
    weather === "Rain"
      ? "Rain filled the collection barrels (+8 water)."
      : weather === "Frost"
        ? "Frost spoiled a few stores and chilled the camp (−3 food, −2 morale)."
        : "The weather left supplies undisturbed.";
  const summary = `${action} ${conditions} The watch reports ${nextRisk.toLowerCase()} risk.`;

  return {
    colony: {
      ...currentColony,
      day: nextDay,
      food: nextFood,
      water: nextWater,
      medicine: nextMedicine,
      morale: nextMorale,
      risk: nextRisk,
      journalEntry: summary,
    },
    outcome: {
      day: nextDay,
      priority,
      weather,
      summary,
      foodChange: nextFood - currentColony.food,
      waterChange: nextWater - currentColony.water,
      medicineChange: nextMedicine - currentColony.medicine,
      moraleChange: nextMorale - currentColony.morale,
    },
  };
}
