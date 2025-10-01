# Repository Guidelines

## Project Structure & Module Organization
- `mpp.jsx` at the repo root holds the Purchase Planner React app. Comment banners separate domain types, calculators, factories, persistence, and UI, ending in the exported `App` component.
- Add new helpers beside the matching banner. When a section grows beyond ~1,000 lines, extract non-React utilities into siblings such as `calculations/property.ts` while leaving components in `mpp.jsx`.
- Local state persists through the `future-purchase-planner.scenarios.v1` localStorage key; increment the suffix for breaking schema changes and include a migration.

## Build, Test, and Development Commands
- This repo ships the UI module only; mount it inside your bundler (Vite, Next.js, etc.). Typical workflow:
  - `npm install react react-dom framer-motion lucide-react uuid` to pull runtime dependencies.
  - `npm install -D typescript @types/react @types/react-dom vite` for a fast sandbox.
  - `npm run dev` (Vite default) once `App` is wired into `main.tsx`.
- In host projects, reuse existing scripts and call out any new commands you add here.

## Coding Style & Naming Conventions
- Follow the 2-space indentation, semicolons, and double quotes present in `mpp.jsx`; run `npx prettier --write mpp.jsx` before opening a PR.
- Keep TypeScript-style domain aliases (`type`, `interface`) even in `.jsx`, and prefer descriptive names like `analysisYears` or `maintenanceMonthly`.
- Components stay PascalCase, utilities stay camelCase, and hooks remain at the top level of functional components.

## Testing Guidelines
- Add UI tests with Vitest and Testing Library (`npm install -D vitest @testing-library/react @testing-library/user-event`). Place specs in `__tests__/mpp.test.tsx` or alongside as `mpp.test.tsx`.
- Stub `localStorage` in tests, and assert both property and vehicle flows plus the comparison table renders.
- Aim for >80% coverage on calculation helpers before merging major finance updates.

## Commit & Pull Request Guidelines
- Use Conventional Commits (`feat: add vehicle roll tax toggle`, `fix: correct PMI cancellation month`) with subjects under 72 characters and bodies describing impacts on savings logic or storage formats.
- Each PR must include a behavior summary, screenshots/GIFs for UI changes, documented tests, and migration notes when the localStorage schema shifts.
- Link issues where possible and flag breaking changes so consumers can schedule upgrades.
