# Future Purchase Cost Planner

Interactive finance sandbox for comparing long-term housing and vehicle purchases. Model monthly costs, upfront fees, and multi-year outlays across saved scenarios directly in a React UI.

## Features

- Model property and vehicle loans with rich finance inputs (PMI, taxes, insurance, maintenance, dealer fees).
- Save multiple scenarios to browser storage, duplicate, and compare them side by side.
- Visualize amortization-driven totals with responsive tables optimized for desktop and mobile.
- Modular React structure with reusable calculation helpers, persistence utilities, and UI components for easy embedding.

## Quick Start (Vite sandbox)

1. `npm create vite@latest purchase-planner -- --template react-ts`
2. `cd purchase-planner`
3. `npm install`
4. Copy the `src/` folder from this repository into your project (replace the generated `src/`)
5. Install runtime deps: `npm install framer-motion lucide-react uuid`
6. Launch the dev server: `npm run dev`

The component relies on `localStorage` under the key `future-purchase-planner.scenarios.v1`. Clearing that key resets stored scenarios.

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
├── mpp.jsx            # Legacy entry point that re-exports the modular App
├── src/
│   ├── App.tsx        # Main React component wiring scenarios, UI, and persistence
│   ├── calculations/  # Property & vehicle math plus shared amortization types
│   ├── components/    # Item editor, summaries, scenario header, layout primitives
│   ├── defaults.ts    # Factories for new property/vehicle/scenario records
│   ├── persistence.ts # LocalStorage load/save helpers
│   └── utils/         # Amortization + formatting helpers
├── AGENTS.md          # Contributor guidelines
└── README.md          # Project overview (this file)
```

## Implementation Notes

- PMI only applies when the initial loan-to-value exceeds the configured cancellation threshold; calculations automatically zero the PMI rows otherwise.
- Removing the final scenario seeds a fresh default scenario, updates the active selection, and clears comparisons to prevent empty-state crashes.
- Refactoring targets the modules in `src/calculations/`; keep React components in `src/components/` and add pure helpers to `src/utils/`.

## Contributing

Follow the standards described in `AGENTS.md` (formatting, tests, commit messages, and PR expectations).
