# Colony Simulator Ops Showcase - Frontend

This is the first React / TypeScript frontend shell for the Colony Simulator Ops Showcase.

The current frontend provides:

- A public landing page
- A seeded colony state view
- Founding colonist cards
- A starter journal entry
- A frontend-only Advance Day interaction
- Local React state initialized from seeded colony data
- Extracted simulation helper logic for advancing colony state
- A Latest Turn Outcome panel with structured resource-change data
- A placeholder journal update after advancing the day
- A mock Ops Dashboard with operational metric cards
- A recent operational events list
- An Architecture Path summary
- A deployable Vite build target

---

Next planned frontend work:

1. Refine the Advance Day resource-change rules.
2. Prepare the frontend for deployment.
3. Deploy the frontend as a public static site.
4. Begin planning the first AWS-backed API endpoint.
5. Replace mock Ops Dashboard data with real CloudWatch-backed signals.

---

## Tech Stack

- React
- TypeScript
- Vite
- CSS

---

## Current Frontend Structure

- `src/App.tsx` handles the visible React page, local colony state, button click behavior, and rendering.
- `src/data/seedColony.ts` defines the starting colony data and reusable TypeScript types for the colony state.
- `src/data/mockOpsDashboard.ts` defines temporary mock operational metrics and events for the Ops Dashboard preview.
- `src/simulation/advanceDay.ts` contains the frontend-only simulation helper that advances the colony by one day and returns updated colony state plus structured turn outcome data.

This separation keeps UI code and simulation logic easier to understand, test, and eventually move into a backend Lambda function.

---

## Local Development

From the repo root:

```powershell
cd app/frontend
npm install
npm run dev
```