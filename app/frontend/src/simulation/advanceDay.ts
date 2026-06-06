import type { SeedColony } from '../data/seedColony'

export type TurnOutcome = {
    summary: string
    foodChange: number
    waterChange: number
    medicineChange: number
    moraleChange: number
}

type AdvanceDayResult = {
    colony: SeedColony
    outcome: TurnOutcome
}

export function advanceDay(currentColony: SeedColony): AdvanceDayResult {
    const foodChange = -9
    const waterChange = -7
    const medicineChange = -1
    const moraleChange = -2

    const nextDay = currentColony.day + 1
    const nextFood = Math.max(currentColony.food + foodChange, 0)
    const nextWater = Math.max(currentColony.water + waterChange, 0)
    const nextMedicine = Math.max(currentColony.medicine + medicineChange, 0)
    const nextMorale = Math.max(currentColony.morale + moraleChange, 0)

    const nextRisk =
        nextFood < 80 || nextWater < 50 ? 'Elevated' : currentColony.risk

    const summary = `Day ${nextDay}: The colony completed another hard day below the northern ridge. Food and water stores were rationed, medicine was checked, and the watch reported that risk remains ${nextRisk.toLowerCase()}.`

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
            summary,
            foodChange,
            waterChange,
            medicineChange,
            moraleChange,
        },
    }
}