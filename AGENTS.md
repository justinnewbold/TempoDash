# Base44 dev notes

- Pure client-side Vite + TypeScript game (no backend, no secrets). Run: `docker compose -f docker-compose.base44.yml up -d`.
- Both package-lock.json and pnpm-lock.yaml exist; the compose uses npm (`npm ci`).
- `vite.config.ts` sets `allowedHosts: true` + polling so the preview proxy host works and bind-mount HMR fires.
- `mobile/` is a separate Expo app, not run here. Tests: `docker compose -f docker-compose.base44.yml exec web npm test`.
