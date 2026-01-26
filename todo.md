# TODO — Running Split Calculator (Frontend-only PWA, No Build Step)

Use this file as a checklist while implementing the project. Each item is actionable and maps to files, tests, and verification steps. Mark `[ ]` -> incomplete, `[x]` -> done.

---

## Top-level commands (use these frequently)
- [ ] `npm run lint` — run ESLint (`eslint:recommended`) over project
- [ ] `npm test` — run Vitest (jsdom configured) to execute tests
- [ ] Manual: open `public/index.html` in a browser for quick UI smoke checks

---

## A — Tooling & Scaffolding
- [ ] Create `package.json` with devDependencies and scripts:
  - `devDependencies`: `eslint`, `vitest`, `jsdom`
  - `scripts`:
    - `"lint": "eslint ."`
    - `"test": "vitest run"`
    - `"test:watch": "vitest"`
- [ ] Add `.eslintrc.json` configured for `eslint:recommended` and ES Modules
- [ ] Add (optional) `vitest.config.js` / config to ensure jsdom environment for UI tests
- [ ] Create folders:
  - `public/`
  - `src/`
  - `test/`
- [ ] Add `.gitignore` (node_modules, .cache, .vite, coverage, dist, .DS_Store)
- [ ] Add a minimal smoke test `test/smoke.test.js` asserting `true`
- [ ] Run `npm run lint` and `npm test` — they must pass before continuing

---

## B — Static App Shell (public/)
- [ ] `public/index.html`:
  - [ ] Semantics: `<header>`, `<main>`, landmark roles
  - [ ] Top-level controls present:
    - Distance select (5K, 10K, Half, Full, Custom)
    - Custom distance number input (disabled unless Custom)
    - Unit select (mi / km)
    - Goal time inputs: Hours, Minutes, Seconds (separate labeled inputs)
    - Strategy select (Even, Linear negative, Linear positive, Weighted exponential)
    - Buttons: Calculate (type="button"), Copy results to input (button), Clear input table (button)
  - [ ] Global message area (errors) + dirty warning slot
  - [ ] Link to `styles.css` and `app.js` as ES module
- [ ] `public/styles.css`:
  - [ ] System font stack, card-like grouping
  - [ ] Side-by-side layout for input/results, horizontal scroll fallback
  - [ ] Focus styles for interactive elements
- [ ] `public/app.js` (lightweight):
  - [ ] ES module that mounts placeholder text `App loaded` to root
- [ ] UI shell test `test/ui-shell.test.js`:
  - [ ] Load `index.html` via jsdom and assert presence of controls and Calculate button type
- [ ] Run lint + tests

---

## C — Domain: Distances & Split Generation
- [ ] `src/domain/distance.js`:
  - [ ] Export preset distances (5K, 10K, Half, Marathon) with both km and mile values
  - [ ] Expose helper to resolve preset -> numeric distance in selected unit
- [ ] `src/domain/splits.js`:
  - [ ] Implement `generateSplits(totalDistance, unit)`:
    - [ ] One split per full unit (1.0 mi or 1.0 km)
    - [ ] Final partial segment when remainder > epsilon (1e-9)
    - [ ] Each split object: `{ id, index, distance, isPartial, label }`
    - [ ] Stable deterministic `id` generation (e.g., `unit-<index>` or similar)
  - [ ] Ensure labels: "Mile N (1.0 mi)", "KM N (1.0 km)", and "Last segment (0.11 mi)"
- [ ] Tests `test/splits.test.js`:
  - [ ] 5K in km -> 5 full splits
  - [ ] 5K in miles -> full miles + partial remainder
  - [ ] Custom integer -> no partial
  - [ ] Custom fractional -> partial label exists
  - [ ] IDs are unique & stable
- [ ] Run lint + tests

---

## D — Time & Pace Utilities
- [ ] `src/engine/time.js`:
  - [ ] `toSeconds({h,m,s})` — returns integer seconds, validate non-negative
  - [ ] `formatHMS(totalSeconds)` — returns `H:MM:SS` format
  - [ ] `parsePace("MM:SS")` — returns secondsPerUnit (or error object)
  - [ ] `formatPace(secondsPerUnit)` — "MM:SS" (round to nearest second)
  - [ ] `roundToNearestSecond(x)` helper
- [ ] Tests `test/time.test.js`:
  - [ ] toSeconds: blank -> 0, negative -> error
  - [ ] parsePace valid/invalid (strict formatting)
  - [ ] formatPace rounding behaviors
  - [ ] formatHMS correctness
- [ ] Run lint + tests

---

## E — Segment & Cumulative Calculations
- [ ] `src/engine/compute.js`:
  - [ ] `segmentTimeSeconds(paceSecondsPerUnit, segmentDistance)` => float seconds
  - [ ] `cumulativeTimes(segmentTimesArray)` => cumulative seconds array
- [ ] Tests `test/compute.test.js`:
  - [ ] Partial segment time = pace * distance
  - [ ] Cumulative array correctness & near-equality checks for floats
- [ ] Run lint + tests

---

## F — Validation Logic
- [ ] `src/engine/validate.js`:
  - [ ] Input: `goalSeconds`, `splits[]`, `fixedPacesById`
  - [ ] Compute `fixedTotalSeconds`, `remainingSeconds`
  - [ ] If `fixedTotalSeconds > goalSeconds`: return `{ ok:false, errorMessage, offendingIds, fixedTotalSeconds, remainingSeconds }`
  - [ ] Else: return `{ ok:true, fixedTotalSeconds, remainingSeconds }`
- [ ] Tests `test/validate.test.js`:
  - [ ] fixed < goal => ok
  - [ ] fixed > goal => error + offending ids
  - [ ] fixed == goal => ok, remaining 0
- [ ] Run lint + tests

---

## G — Strategy Distribution
- [ ] `src/engine/strategies.js`:
  - [ ] `distributeEven({blankIds, blankDistances, remainingSeconds})`
  - [ ] `distributeLinear({mode, blankIds, blankDistances, remainingSeconds})` — mode: "negative"|"positive"
  - [ ] `distributeWeighted({blankIds, blankDistances, remainingSeconds, exponent})`
  - [ ] Ensure sum of allocated times equals `remainingSeconds` (within epsilon)
  - [ ] Handle infeasible cases (return `{ok:false, message}` or standardized error)
- [ ] Tests `test/strategies.test.js`:
  - [ ] Even: identical pace and totals match
  - [ ] Linear negative/positive: monotonic trend + totals
  - [ ] Weighted: monotonic bias toward end + totals
  - [ ] Infeasible allocation tests
- [ ] Run lint + tests

---

## H — Calculation Engine (single entrypoint)
- [ ] `src/engine/calculate.js`:
  - [ ] Accepts `splits`, `goalSeconds`, `strategyKey`, `fixedPaceStringsById`
  - [ ] Uses `time.js` parse helpers for fixed paces
  - [ ] Calls `validate.js` for pre-checks
  - [ ] Distributes remainingSeconds across blanks via chosen strategy
  - [ ] Produces `rows[]` with:
    - `id`, `label`
    - `paceSecondsPerUnit` (internal precision)
    - `paceDisplay` (rounded via `formatPace`)
    - `segmentSeconds` (float), `segmentDisplay` (MM:SS or H:MM:SS)
    - `cumulativeSeconds`, `cumulativeDisplay` (H:MM:SS)
  - [ ] On hard error, return `{ ok:false, errorMessage, offendingIds }`
- [ ] Tests `test/calculate.test.js`:
  - [ ] Even no-fixed -> equal paces
  - [ ] Fixed anchors -> blanks computed
  - [ ] Partial segments handled
  - [ ] Hard error case tested
- [ ] Run lint + tests

---

## I — State Management (pure module)
- [ ] `src/state/store.js`:
  - [ ] `initialState` with keys:
    - `distancePresetKey`, `customDistanceValue`, `unit`, `goalTime{h,m,s}`, `strategyKey`
    - `paceInputsById` (string map), `results`, `error`, `offendingIds`, `dirtySinceCalc`
  - [ ] `deriveSplits(state)` -> uses domain split generator
  - [ ] `applyAction(state, action)` -> returns new state (immutable-ish)
  - [ ] Actions:
    - SET_DISTANCE_PRESET, SET_CUSTOM_DISTANCE, SET_UNIT
    - SET_GOAL_TIME_FIELD, SET_STRATEGY
    - SET_PACE_INPUT, CLEAR_PACE_INPUT, CLEAR_ALL_PACES
    - SET_RESULTS, MARK_DIRTY
  - [ ] Remap `paceInputsById` conservatively on splits changes
  - [ ] When inputs change while `results` exists => set `dirtySinceCalc=true`
- [ ] Tests `test/store.test.js`:
  - [ ] Splits regenerate on distance/unit changes
  - [ ] pacing inputs set/clear behavior
  - [ ] dirty flag behavior
- [ ] Run lint + tests

---

## J — UI Rendering & Event Wiring
- [ ] `src/ui/dom.js`: DOM selectors & helpers
- [ ] `src/ui/render.js`:
  - [ ] Render controls reflecting `state` (distance, unit, goal fields, strategy)
  - [ ] Render **Input table**:
    - Rows for each split: pace input, subtext label, clear-row button
    - Apply offending highlight class if id in `state.offendingIds`
  - [ ] Leave results placeholder for now
- [ ] `src/ui/events.js`:
  - [ ] Wire control events to `applyAction`:
    - Preset change, custom distance, unit toggle, goal inputs, strategy
    - Pace input `input`/`blur` handlers to set pace value
    - Clear-row button clears that row
  - [ ] Prevent Enter from auto-submission (no default form submit)
- [ ] `src/app.js`:
  - [ ] Compose store + render + events wiring
  - [ ] Boot sequence: derive splits, render
- [ ] UI tests `test/ui-input-table.test.js`:
  - [ ] Correct number of rows
  - [ ] Editing inputs updates state
  - [ ] Clear-row clears only that row
  - [ ] Offending highlight class reactive
- [ ] Run lint + tests

---

## K — Results Rendering & Errors
- [ ] Extend `src/ui/render.js`:
  - [ ] Render **Results table** (Pace | Segment time | Cumulative)
  - [ ] Render global error area when `state.error` present
  - [ ] Render dirty warning when `dirtySinceCalc === true`
- [ ] UI tests `test/ui-results.test.js`:
  - [ ] Results rows present & formatted when `state.results` exists
  - [ ] Error message visible & offending rows highlighted
  - [ ] Dirty warning toggles correctly
- [ ] Run lint + tests

---

# Continued in next message...