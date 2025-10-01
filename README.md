# Future Purchase Cost Planner

Interactive finance sandbox for comparing long-term housing and vehicle purchases. Model monthly costs, upfront fees, and multi-year outlays across saved scenarios directly in a React UI.

## Features

- Model property and vehicle loans with rich finance inputs (PMI, taxes, insurance, maintenance, dealer fees).
- Save multiple scenarios to browser storage, duplicate, and compare them side by side.
- Visualize amortization-driven totals with responsive tables optimized for desktop and mobile.
- Built with React, Framer Motion animations, and Lucide iconography; ships as a single module for easy embedding.

## Quick Start (Vite sandbox)

1. `npm create vite@latest purchase-planner -- --template react-ts`
2. `cd purchase-planner`
3. `npm install`
4. Replace `src/App.tsx` with the contents of `mpp.jsx`, updating the import path to `App`.
5. Install runtime deps: `npm install framer-motion lucide-react uuid`
6. Launch the dev server: `npm run dev`

The component relies on `localStorage` under the key `future-purchase-planner.scenarios.v1`. Deleting the key resets saved scenarios.

## Tests

Install test tooling and run the suite:

```bash
npm install -D vitest @testing-library/react @testing-library/user-event jsdom
npm run test
```

Stub `localStorage` in tests and cover both property and vehicle calculators to maintain ≥80% coverage on finance helpers.

## Project Layout

```
.
├── mpp.jsx      # React module with domain types, calculators, factories, persistence, UI
├── AGENTS.md    # Contributor guidelines for agents and collaborators
└── README.md    # Project overview (this file)
```

## Implementation Notes

- PMI only applies when the initial loan-to-value exceeds the configured cancellation threshold; calculations automatically zero out PMI otherwise.
- Removing the final scenario seeds a fresh default scenario and re-focuses the UI on it to avoid empty-state crashes.

## Contributing

Follow the standards described in `AGENTS.md` (formatting, tests, commit messages, and PR expectations).
