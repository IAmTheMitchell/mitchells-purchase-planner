# Future Purchase Cost Planner

Interactive finance sandbox for comparing long-term housing and vehicle purchases. Model monthly costs, upfront fees, and multi-year outlays across saved scenarios directly in a modular React UI.

## Getting Started

```bash
npm install
npm run dev
```

Vite will print a local URL—open it in your browser to explore the planner. The app stores scenarios in `localStorage` using the key `future-purchase-planner.scenarios.v1`; clearing that key resets saved data.

## Available Scripts

- `npm run dev` – start the Vite dev server with fast refresh.
- `npm run build` – type-check and produce an optimized production build in `dist/`.
- `npm run preview` – preview the production build locally.
- `npm run test` – run unit/UI tests with Vitest and Testing Library (jsdom environment).

## Project Layout

```
.
├── index.html             # Vite entry document
├── mpp.jsx                # Legacy entry point that re-exports the modular App
├── package.json           # Scripts and dependencies
├── src/
│   ├── App.tsx            # Main React component wiring scenarios, UI, persistence
│   ├── calculations/      # Property & vehicle math plus shared amortization helpers
│   ├── components/        # Item editor, summaries, scenario header, layout primitives
│   ├── defaults.ts        # Factories for new property/vehicle/scenario records
│   ├── persistence.ts     # LocalStorage load/save helpers with SSR guards
│   ├── types.ts           # Shared domain types
│   ├── utils/             # Amortization + formatting helpers
│   └── main.tsx           # Vite bootstrapping entry
└── vitest.config.ts       # Vitest configuration (jsdom + Testing Library setup)
```

## Implementation Notes

- PMI applies only when the initial loan-to-value exceeds the cancellation threshold; calculations automatically zero PMI otherwise.
- Removing the final scenario seeds a fresh default entry, updates the selection, and clears comparisons to avoid empty-state crashes.
- The SSR guard hydrates browser-local data after mount, preventing stale server snapshots from overwriting existing scenarios.

## Contributing

Follow the standards in `AGENTS.md` for formatting, testing, commit style, and pull-request expectations. When modifying the saved scenario shape, bump the localStorage key suffix and include migration logic.
