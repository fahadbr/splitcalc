# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Running Split Calculator — a React + Vite PWA for computing running pace splits.

## Commands

- **Dev server**: `npm run dev` (Vite dev server)
- **Build**: `npm run build` (production build to `dist/`)
- **Preview**: `npm run preview` (serve production build)
- **Test**: `npm test` (vitest, single run) or `npm run test:watch`
- **Lint**: `npm run lint` (ESLint 9 flat config)

## Architecture

**Domain → Engine → State (useReducer) → React Components → Persistence**

- `src/domain/` — Distance presets (5K, 10K, Half, Full) and split generation
- `src/engine/` — Calculation pipeline (all pure functions):
  - `strategies.js` — Four pacing strategies: even, linear negative, linear positive, weighted exponential
  - `time.js` — Pace/time conversions and formatting (MM:SS)
  - `compute.js` — Segment and cumulative time calculations
  - `validate.js` — Validates fixed paces don't exceed goal time
  - `calculate.js` — Orchestrates the full pipeline with validation
- `src/state/store.js` — `applyAction` reducer + `deriveSplits` (used by `useReducer`)
- `src/hooks/useAppState.js` — Custom hook: `useReducer(applyAction)` + `useMemo(deriveSplits)` + localStorage init
- `src/App.jsx` — Root component with calculate/copy handlers
- `src/components/` — `ControlsPanel`, `InputTable`, `ResultsTable`
- `src/persistence/storage.js` — localStorage save/load (saves only on successful calculate)
- PWA support via `vite-plugin-pwa` (auto-generates service worker)

## Testing

Tests use Vitest + jsdom. No globals — import `describe`, `it`, `expect` etc. from `vitest`. UI tests use `@testing-library/react` (`.jsx` files in `/test/`). Engine/domain tests are pure-function assertions (`.js` files in `/test/`). Test setup in `test/setup.js` provides localStorage mock and RTL cleanup.

## Key Behaviors

- State is immutable; all updates go through `dispatch(action)` via `useReducer`
- Splits are remapped when distance changes (preserving user-entered paces where possible)
- "Dirty state" warning appears when inputs change after a calculation
- Pace inputs accept MM:SS format with exactly 2-digit seconds

## Specification

`running_split_calculator_developer_specification.md` contains detailed requirements and behavior rules. Consult it for expected behavior on edge cases.
