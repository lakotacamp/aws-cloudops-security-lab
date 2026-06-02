# Colony Simulator Ops Showcase — Frontend

This is the first React / TypeScript frontend shell for the Colony Simulator Ops Showcase.

The current frontend provides:

- A public landing page
- A seeded colony state view
- Founding colonist cards
- A starter journal entry
- An Ops Dashboard placeholder
- An Architecture Path summary
- A deployable Vite build target

This is the first visible application shell. Future iterations will add seeded colony state, local simulation logic, a basic Ops Dashboard page, deployment, and AWS-backed service status.

---

Next planned frontend work:

1. Add local Advance Day interaction.
2. Update colony state after advancing the day.
3. Add a placeholder or generated journal entry update.
4. Add a basic Ops Dashboard page with mock operational data.
5. Prepare the frontend for deployment.

---

## Tech Stack

- React
- TypeScript
- Vite
- CSS

---

## Local Development

From the repo root:

```powershell
cd app/frontend
npm install
npm run dev