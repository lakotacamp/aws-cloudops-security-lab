import type { SeedColony } from "../data/seedColony.ts";
import { expeditionStatus, type TurnOutcome } from "./advanceDay.ts";
import type { Expedition } from "../lib/storage.ts";

export type Narrator = "mara" | "tovin" | "elian" | "sella";
export const voices = {
  mara: {
    name: "Mara Venn",
    role: "Survey captain",
    initials: "MV",
    maxim: "A settlement is a promise renewed each morning.",
  },
  tovin: {
    name: "Tovin Reed",
    role: "Field engineer",
    initials: "TR",
    maxim: "Trust the measure. Then check the barrel.",
  },
  elian: {
    name: "Elian Cor",
    role: "Medic",
    initials: "EC",
    maxim: "We must count the living before we count the stores.",
  },
  sella: {
    name: "Sella Myr",
    role: "Forager",
    initials: "SM",
    maxim: "The forest gives nothing to a hurried eye.",
  },
} as const;

export type ChroniclePage = {
  colony: SeedColony;
  outcome?: TurnOutcome;
  choices: TurnOutcome["priority"][];
};
export function riskFor(c: Pick<SeedColony, "food" | "water" | "morale">) {
  return c.food < 25 || c.water < 18 || c.morale < 20
    ? "Critical"
    : c.food < 80 || c.water < 50 || c.morale < 40
      ? "Elevated"
      : "Moderate";
}

// Reverse actual, clamped deltas: old folios show their own state, never today's values.
export function chroniclePages(expedition: Expedition): ChroniclePage[] {
  const pages: ChroniclePage[] = [];
  let colony = { ...expedition.colony };
  const chronological = [...expedition.history].reverse();
  for (let i = expedition.history.length - 1; i >= 0; i--) {
    const turn = chronological[i];
    pages.unshift({
      colony,
      outcome: turn,
      choices: chronological.slice(0, i + 1).map((t) => t.priority),
    });
    colony = {
      ...colony,
      day: turn.day - 1,
      food: colony.food - turn.foodChange,
      water: colony.water - turn.waterChange,
      medicine: colony.medicine - turn.medicineChange,
      morale: colony.morale - turn.moraleChange,
    };
    colony.risk = riskFor(colony);
  }
  pages.unshift({ colony, choices: [] });
  return pages;
}

export function chooseNarrator(
  c: SeedColony,
  t?: TurnOutcome,
): { id: Narrator; reason: string } {
  if (!t)
    return { id: "mara", reason: "The captain opens the expedition's record." };
  // Essential shortages take precedence over the chosen task. Ties favor water, then food.
  if (c.water < 18)
    return {
      id: "tovin",
      reason:
        "Water is critically low; the engineer's watch shapes this account.",
    };
  if (c.food < 25)
    return {
      id: "sella",
      reason:
        "Food is critically low; the forager bears the day's heaviest concern.",
    };
  if (c.morale < 20)
    return {
      id: "mara",
      reason:
        "The settlement's resolve is critically low; the captain must answer for it.",
    };
  if (t.priority === "restore")
    return {
      id: "elian",
      reason:
        "The recovery day placed care of the settlers in the medic's hands.",
    };
  if (t.priority === "forage")
    return {
      id: "sella",
      reason: "The foraging party's work determined today's provisions.",
    };
  if (t.weather === "Rain")
    return {
      id: "tovin",
      reason:
        "Rain changed the water ledger; the engineer records the collection.",
    };
  return {
    id: "mara",
    reason:
      t.priority === "conserve"
        ? "The captain's ration order shaped the day and its cost in spirits."
        : "The captain kept the watch and provision schedule.",
  };
}

const openings: Record<Narrator, string[]> = {
  mara: [
    "I laid the ledger beside the council lamp, and counted our obligations before our comforts.",
    "This morning I took the watch list in hand. Eighteen names: none of them a number to be crossed out.",
    "I have kept today's account in a steady hand, though a steady hand is not always a steady heart.",
  ],
  tovin: [
    "I sounded the barrels before breakfast. Timber may lie with a hollow note; the measure seldom does.",
    "There is no eloquence in an empty pail. I began my rounds at the waterworks.",
    "My tools were where I left them. I wish I could say as much for the water in our barrels.",
  ],
  elian: [
    "I set the medicine chest upon the table and asked the others to sit awhile. Even rest must be made a duty here.",
    "I have learned to listen at the cookfire. Weariness often speaks before anyone asks for care.",
    "This morning I counted what remained in the chest, then looked up to count the faces around it.",
  ],
  sella: [
    "I watched the northern trees until the paths between them began to show themselves. A hungry camp makes an impatient scout.",
    "The ridge looked close from the gate. It never looks so close when one must carry the day's provisions home.",
    "I know the forest by its small signs. Today I weighed every one against the stores we had left.",
  ],
};

export function writeDiary(page: ChroniclePage) {
  const c = page.colony,
    t = page.outcome;
  const narrator = chooseNarrator(c, t);
  if (!t)
    return {
      narrator,
      title: "A place to begin again",
      caption: "The captain opens the ledger beneath the northern ridge.",
      paragraphs: [
        "I open this book on our twelfth day in the valley. Frost lay along the palisade this morning; the cookfire smoke scarcely rose above the roofs. Eighteen of us have put our names to this small, stubborn place.",
        `I have entered ${c.food} measures of food and ${c.water} of water in the ledger, with ${c.medicine} in the medicine chest. Sella watches the northern tree line. Tovin keeps the waterworks; Elian keeps a gentler account of us all.`,
        "We must reach the thirtieth day with our stores and our courage intact. Let whoever carries the greatest burden each day set down what they saw. This shall be our common history.",
      ],
    };
  const action = {
    balanced:
      narrator.id === "mara"
        ? "I kept the ordinary watch and ration schedule. There is dignity in an uneventful round, though the stores diminish all the same."
        : "The captain kept the ordinary watch and ration schedule. We went about our accustomed work, spending provisions to keep the settlement moving.",
    forage:
      narrator.id === "sella"
        ? "I led the foragers beyond the palisade and brought our gathering back to the storehouse. The journey demanded water as surely as it promised food."
        : "Sella led the foragers beyond the palisade. Their gathering reached the storehouse, but the journey made its own claim upon our water.",
    conserve:
      narrator.id === "mara"
        ? "I ordered the smaller ration. It spares our stores, but I cannot pretend that a narrow bowl makes a cheerful table."
        : "Mara ordered the smaller ration. We spent fewer provisions, and paid for the saving in quiet voices around the cookfire.",
    restore:
      narrator.id === "elian"
        ? "I called a halt to the usual pace and helped share a generous meal. Care takes provisions; I will not disguise its price."
        : "Elian called the camp to rest and a generous meal. Care takes provisions, even when it is precisely what we need.",
  }[t.priority];
  const weather =
    t.weather === "Rain"
      ? "Rain drummed on the roofs. We set the collection barrels to work; eight measures from the sky offset part of the day's water use."
      : t.weather === "Frost"
        ? "Frost reached the stores and the cookfires alike: three more measures of food were lost, and spirits took the cold poorly."
        : t.weather === "Overcast"
          ? "An unbroken lid of cloud hung above the ridge. The weather made no further demand upon our stores."
          : "The sky stayed clear. For once, the weather added nothing to the day's reckoning.";
  const amount = (change: number, noun: string) =>
    change === 0
      ? `${noun} held steady`
      : `${noun} ${change > 0 ? "rose" : "fell"} by ${Math.abs(change)}`;
  const ledger = `At dusk, ${amount(t.foodChange, "food")} and ${amount(t.waterChange, "water")}. ${t.medicineChange === 0 ? "The medicine tally did not change." : `We used ${Math.abs(t.medicineChange)} ${Math.abs(t.medicineChange) === 1 ? "measure" : "measures"} from the medicine chest.`} Our spirits ${t.moraleChange === 0 ? "held their ground" : `${t.moraleChange > 0 ? "rose" : "fell"} by ${Math.abs(t.moraleChange)} ${Math.abs(t.moraleChange) === 1 ? "mark" : "marks"}`}.`;
  const ending =
    expeditionStatus(c) === "depleted"
      ? "One of our essential reserves has failed us. I close this account knowing that this expedition can go no further."
      : c.day === 30
        ? "The thirtieth day is ours. We have provisions and resolve enough to stand together. I leave this page to those who will remember."
        : c.risk === "Critical"
          ? "The margin is perilously thin. Tomorrow's choice must answer what is missing, not merely what we wish to do."
          : c.risk === "Elevated"
            ? "The watch names our position uneasy. I shall sleep with tomorrow's reckoning close at hand."
            : voices[narrator.id].maxim;
  const title = {
    balanced: "The ordinary courage of a day",
    forage: "What the forest would spare",
    conserve: "The measure of a smaller bowl",
    restore: "A little room for kindness",
  }[t.priority];
  const caption = {
    balanced: "The watch and the daily ration at Hearthfall.",
    forage: "Foragers return from the northern woodland with provisions.",
    conserve: "The captain measures a smaller ration at the storehouse.",
    restore: "The medic tends the camp beside a shared meal.",
  }[t.priority];
  return {
    narrator,
    title,
    caption,
    paragraphs: [
      openings[narrator.id][c.day % 3] + " " + action,
      weather + " " + ledger,
      ending,
    ],
  };
}
