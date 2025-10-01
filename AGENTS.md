# Repository Guidelines

## Project Structure & Module Organization
- `src/App.tsx` orchestrates the planner UI; `mpp.jsx` simply re-exports it for consumers expecting the legacy entry point.
- Pure logic lives in `src/calculations/` (property & vehicle math) and `src/utils/` (amortization + currency helpers). Update or add functions there rather than inside components.
- UI primitives are under `src/components/`, grouped by responsibility (inputs, layout cards, scenario widgets). Keep new components co-located and export them through the folder when they are reused.
- Factories and persistence helpers sit in `src/defaults.ts` and `src/persistence.ts`. Bump the `future-purchase-planner.scenarios.v1` key suffix and add migrations when the stored shape changes.

## Build, Test, and Development Commands
- This repo ships only the React module; embed it in your chosen host (Vite, Next.js, etc.). Baseline setup:
  - `npm install react react-dom framer-motion lucide-react uuid`
  - `npm install -D typescript @types/react @types/react-dom vite`
  - `npm run dev` (Vite default) after wiring `App` into the host entrypoint.
- Mirror the host project’s scripts and document any additional commands you introduce in this file.

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
