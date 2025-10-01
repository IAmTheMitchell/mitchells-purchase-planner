# Repository Guidelines

## Project Structure & Module Organization
- `src/App.tsx` orchestrates the planner UI; `mpp.jsx` simply re-exports it for consumers expecting the legacy entry point.
- Pure logic lives in `src/calculations/` (property & vehicle math) and `src/utils/` (amortization + currency helpers). Update or add functions there rather than inside components.
- UI primitives are under `src/components/`, grouped by responsibility (inputs, layout cards, scenario widgets). Keep new components co-located and export them through the folder when they are reused.
- Factories and persistence helpers sit in `src/defaults.ts` and `src/persistence.ts`. Bump the `future-purchase-planner.scenarios.v1` key suffix and add migrations when the stored shape changes.

## Build, Test, and Development Commands
- `npm install` pulls both runtime and dev dependencies (Vite, Vitest, React, etc.).
- `npm run dev` launches the Vite dev server with fast refresh at the printed localhost URL.
- `npm run build` type-checks and outputs a production bundle under `dist/`.
- `npm run preview` serves the production bundle locally for smoke testing.
- `npm run test` runs the Vitest suite in jsdom with Testing Library helpers.
  - Add new specs alongside the modules they cover (`*.test.ts(x)`), and ensure tests stub `localStorage` when persisting scenarios.

## Coding Style & Naming Conventions
- Use 2-space indentation, semicolons, and double quotes across `src/**/*`. Run `npx prettier --write "src/**/*.{ts,tsx}" mpp.jsx` before submitting.
- Maintain TypeScript-style `type`/`interface` aliases for domain models, and keep descriptive prop/state names (`analysisYears`, `maintenanceMonthly`).
- Components stay PascalCase, utilities camelCase, and hooks remain at the top level of React functions. Keep calculations pure and side-effect free.

## Testing Guidelines
- Use Vitest + Testing Library (`npm install -D vitest @testing-library/react @testing-library/user-event`) and place specs alongside modules (e.g., `src/calculations/property.test.ts` or `src/components/ItemSummary.test.tsx`).
- Stub `localStorage` when exercising persistence, and cover both property/vehicle scenarios plus the comparison grid.
- Target ≥80% coverage on calculation helpers before merging sizable finance changes.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat: extract amortization helpers`, `fix: reset scenario after deletion`), keeping subjects ≤72 characters and bodies explaining impacts on costs or storage.
- Every PR should include: behavior summary, screenshots/GIFs for UI adjustments, test evidence, and migration notes whenever the saved scenario shape changes.
- Link issues when possible and clearly flag breaking changes so integrators can schedule updates.
