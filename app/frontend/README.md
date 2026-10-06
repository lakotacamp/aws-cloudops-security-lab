# Hearthfall frontend

React 19, TypeScript 6, and Vite 8. Use Node.js 24.

```sh
npm ci
npm run dev
npm test
npm run lint
npm run build
```

`src/App.tsx` owns the current expedition and navigation. `simulation/advanceDay.ts` applies deterministic actions and weather without mutating its input. `lib/storage.ts` validates versioned local saves. `components/Operations.tsx` displays measurements from `lib/operations.ts`, keeping them distinct from colony turn timings.

`public/runtime-config.json` is public configuration, never a place for secrets:

- `{"apiBaseUrl":""}`: browser demonstration, no API traffic.
- `{"apiBaseUrl":"/api"}`: AWS CloudFront same-origin API routing.

Set `SITE_BASE=/aws-cloudops-security-lab/` when building for the GitHub Pages subpath. AWS hosting builds at `/`. The build creates `dist`; the repository does not track generated release assets.

See the root README and deployment guide for infrastructure, operations, cost, and cleanup.
