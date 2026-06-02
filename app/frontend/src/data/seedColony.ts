type FoundingColonist = {
    name: string
    role: string
    note: string
}

type SeedColony = {
    name: string
    day: number
    population: number
    food: number
    morale: number
    risk: string
    location: string
    foundingColonists: FoundingColonist[]
    journalEntry: string
}

export const seedColony: SeedColony = {
    name: 'Hearthfall Outpost',
    day: 12,
    population: 18,
    food: 146,
    morale: 72,
    risk: 'Moderate',
    location: 'A wind-cut valley below the northern ridge',
    foundingColonists: [
        {
            name: 'Mara Venn',
            role: 'Survey captain',
            note: 'Keeps the route maps, ration ledgers, and morale reports organized.',
        },
        {
            name: 'Tovin Reed',
            role: 'Field engineer',
            note: 'Maintains tools, shelters, water pumps, and emergency repairs.',
        },
        {
            name: 'Elian Cor',
            role: 'Medic',
            note: 'Tracks injuries, illness risk, and winter preparedness.',
        },
        {
            name: 'Sella Myr',
            role: 'Forager',
            note: 'Scouts safe food sources and watches for signs of predators.',
        },
    ],
    journalEntry:
        'The colony woke to frost along the palisade and smoke curling low over the cookfires. Food stores remain stable, but the northern tree line has gone quiet enough to make the watch uneasy.',
}