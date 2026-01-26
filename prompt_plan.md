# Prompt Plan — Running Split Calculator (Frontend-only PWA, No Build Step)

This document is a **step-by-step blueprint** and a **sequence of code-generation prompts** to implement the project incrementally, with best practices, small safe steps, and no orphaned code.

Each prompt:
- Builds on the previous steps.
- Ends with wiring and integration.
- Requires **running lint + tests** after completing the work.

---

## Blueprint

### 1) Project foundations
- Create repo structure for a **static PWA** (no bundler) and a **Node-based test/lint toolchain**.
- Add `package.json` with:
  - ESLint (`eslint:recommended`)
  - Vitest + jsdom
  - Scripts: `lint`, `test`, `test:watch` (optional)
- Add `public/` app shell:
  - `index.html` (semantic layout, accessibility-friendly)
  - `styles.css` (simple, responsive, card-like)
  - `app.js` (ES module entry)
  - `manifest.webmanifest`, icons placeholders
  - `sw.js` (cache app shell only)

### 2) Core domain model
- Define race distance presets + custom distance with unit selection (mi/km).
- Generate split list:
  - One row per full unit
  - Final partial row if needed
  - Stable labels (e.g., “Mile 3 (1.0 mi)” / “Last segment (0.11 mi)”)

### 3) Pure calculation engine (test-driven)
- Time utilities:
  - Parse/format goal time (H/M/S fields -> seconds)
  - Parse/format pace `MM:SS` per unit
  - Convert pace to seconds per unit; segment time = pace * segment distance
- Validation:
  - Sum of fixed segment times cannot exceed goal time
  - Remaining time must be non-negative
  - Identify offending rows (fixed paces that contribute to overflow)
- Strategy distributions (apply only to blank rows):
  - Even pace
  - Linear negative split
  - Linear positive split
  - Weighted exponential (small early changes, larger late changes)
- Rounding for display: nearest second, internal precision retained

### 4) App state management
- Central state object:
  - Distance selection + custom distance + unit
  - Goal time fields
  - Strategy
  - Input pace strings per split row (blank or `MM:SS`)
  - Derived split list
  - Results (computed paces/times/cumulative)
  - UI flags: `dirtySinceCalc`, `error`, `offendingRowIds`
- Immutable-ish updates via small reducer helpers (no framework)

### 5) UI layer (accessible, deterministic)
- Render two side-by-side tables (always):
  - **Input table** (editable): one column with pace input, subtext label, clear-row button
  - **Results table** (read-only): pace, segment time, cumulative time
- Controls:
  - Distance preset dropdown + custom distance controls (unit toggle)
  - Goal time fields (H/M/S)
  - Strategy dropdown (default Even pace)
  - Buttons: Calculate (primary), Copy results to input, Clear input table
- UX behaviors:
  - Calculate triggers computation only via button (Enter does not auto-calc)
  - Results remain visible after edits; show “Inputs changed — recalculate”
  - Global error message; highlight offending rows

### 6) Persistence
- Read from `localStorage` on load to restore last persisted state
- Persist **only when Calculate is pressed**
- Stored: distance selection, goal time, unit, strategy, pace inputs (including blanks)

### 7) PWA
- Installable manifest + icons
- Service worker:
  - Cache app shell assets only
  - Offline works after first load
  - No update UI

### 8) Testing
- Logic tests (pure functions)
- UI tests (jsdom):
  - Rendering split list
  - Calculate button behavior
  - Error display + row highlight
  - Dirty warning
  - Copy-to-input fills only blanks
  - Clear input clears UI but not persisted snapshot until next Calculate

---

## Iterative breakdown (coarse → fine)

### Chunk A — Scaffolding & app shell
A1. Add `package.json` + ESLint + Vitest + jsdom + scripts  
A2. Add `public/` static shell (index/styles/app entry) with accessible layout  
A3. Add minimal `app.js` that mounts and renders a placeholder UI  
A4. Add base smoke tests + lint config

### Chunk B — Domain + pure engine (TDD)
B1. Implement split generation for presets + custom distance (mi/km) + partial  
B2. Implement time/pace parsing and formatting helpers  
B3. Implement segment/cumulative time computation helpers  
B4. Implement validation for impossible totals (fixed > goal)  
B5. Implement strategy distribution for blanks + anchor handling  
B6. Integrate engine function `calculateSplits()` returning results + errors

### Chunk C — State + UI wiring
C1. State store + derived split list recomputation  
C2. Render input table with per-row pace and clear button  
C3. Render results table (initially empty)  
C4. Wire Calculate → run engine → show results/error  
C5. Dirty warning when inputs change after calculation  
C6. Copy results → fill only blanks; Clear input table (UI only)

### Chunk D — Persistence + PWA
D1. localStorage schema + load on boot + persist on Calculate  
D2. PWA manifest, icons placeholders, SW caching app shell only  
D3. iOS Safari PWA quirks fixes (viewport/meta, input behaviors)

### Chunk E — Polish & test completeness
E1. Responsive side-by-side tables with horizontal scroll  
E2. Accessibility pass (labels, focus order, ARIA only if needed)  
E3. Expand tests (UI + edge cases) to match acceptance criteria

---

## Second-round breakdown into right-sized steps

Below is the **final, right-sized step list** that is safe and incremental.

1. Tooling scaffold (eslint/vitest/jsdom) + minimal smoke test
2. Static app shell with side-by-side layout skeleton + accessible form controls (no logic)
3. Domain: distance presets + custom distance unit model + split list generator (tests)
4. Time/pace utilities (tests)
5. Core calculation: segment/cumulative from paces and distances (tests)
6. Validation: fixed splits overflow detection + offending row ids (tests)
7. Strategies: even/linear+/linear-/weighted distribution for blanks (tests)
8. Calculation engine: glue it together into a single `calculateSplits()` (tests)
9. App state module (store + actions) + derived split list updates (tests for reducer/helpers)
10. UI render: input table (editable) + per-row clear (ui tests)
11. UI render: results table + global error + offending highlight (ui tests)
12. Wire Calculate button to run engine + persist snapshot + show results (ui tests)
13. Dirty warning when inputs change post-calc (ui tests)
14. Copy results to input (fill only blanks) + Clear input table (ui tests)
15. Persistence: load persisted snapshot on boot (ui tests)
16. PWA: manifest + service worker caching app shell + offline smoke test plan
17. Responsive + accessibility polish + iOS Safari quirks fixes (ui tests where feasible)

---

## Code-generation prompts (sequential)

> **Important**: Each prompt is intended for a code-generation LLM.  
> After completing each prompt, run:
> - `npm run lint`
> - `npm test`

### Prompt 01 — Initialize tooling (ESLint + Vitest + jsdom)

```text
You are implementing the “Running Split Calculator” as a frontend-only PWA with no bundler/build step.
Set up the repository tooling so we can test and lint.

Do the following:
1) Create package.json with:
   - devDependencies: eslint, vitest, jsdom
   - scripts:
     - "lint": "eslint ."
     - "test": "vitest run"
     - "test:watch": "vitest"
2) Add ESLint config using ONLY eslint:recommended (no prettier, no extra plugins).
   - Ensure ES modules are supported.
3) Add Vitest config (if needed) to use jsdom for UI tests.
4) Create minimal folder structure:
   - public/
   - src/
   - test/
5) Add a minimal smoke test in test/smoke.test.js that just asserts true.
6) Add .gitignore for node_modules and common artifacts.

Constraints:
- Keep it minimal.
- Don’t add a bundler or build step.
- Ensure `npm run lint` and `npm test` pass.

Finally:
- Provide the exact files you created/changed and their full contents.
```

### Prompt 02 — Create static app shell (HTML/CSS) + JS entry

```text
Create the static app shell in public/ with accessible, semantic HTML, and a simple responsive layout.

1) public/index.html:
   - Use semantic landmarks (header/main).
   - Include a top-level form area (“Inputs”) and a results area (“Results”).
   - Layout must keep input and results tables side-by-side always; allow horizontal scrolling on small screens.
   - Add labeled controls (but no logic yet):
     - Distance select (5K/10K/Half/Full/Custom)
     - Custom distance number input (disabled unless Custom)
     - Unit select (mi/km)
     - Goal time fields: Hours, Minutes, Seconds (separate inputs, labeled)
     - Strategy select: Even pace (default), Linear negative, Linear positive, Weighted exponential
     - Buttons: Calculate (type=button), Copy results to input (type=button), Clear input table (type=button)
   - Include a global message area for errors and a “dirty” warning area.
   - Link styles.css and app.js as ES module.

2) public/styles.css:
   - System font stack
   - Card-like grouping
   - Clear hierarchy and subtle emphasis on primary CTA
   - Side-by-side tables with horizontal scroll container on small screens
   - Basic focus styles

3) public/app.js:
   - As an ES module, mount a placeholder app that writes “App loaded” into a root element.
   - Do not implement logic yet.

4) Add a basic UI test in test/ui-shell.test.js using jsdom that:
   - Loads the HTML (read file content) and asserts key controls exist by label or id.
   - Ensures Calculate button is type=button (Enter should not auto-calc).

Constraints:
- No frameworks.
- No build step.
- Keep HTML accessible (label + input associations).

After finishing:
- Ensure `npm run lint` and `npm test` pass.
- Provide full file contents.
```

### Prompt 03 — Domain model: distances + split list generator (pure, tested)

```text
Implement the core domain logic for distances and split generation as pure functions with tests.

1) In src/domain/distance.js:
   - Export preset distances:
     - 5K, 10K, Half Marathon, Full Marathon
   - Represent each preset internally in BOTH km and miles (use exact race standards where applicable).
   - Support custom distance with unit selection (mi/km).

2) In src/domain/splits.js:
   - Implement generateSplits(totalDistance, unit):
     - One split per full unit (1.0 mi or 1.0 km)
     - If remainder > 0, add final partial segment
     - Each split object must include:
       - id (stable string)
       - index (1-based for full segments; final partial can be last)
       - distance (number, in selected unit)
       - isPartial (boolean)
       - label (e.g., “Mile 3 (1.0 mi)” / “KM 7 (1.0 km)” / “Last segment (0.11 mi)”)
   - Ensure floating precision doesn’t create a tiny remainder segment (treat remainders < 1e-9 as zero).

3) Tests in test/splits.test.js:
   - Preset 5K in km -> 5 full km splits (no partial)
   - Preset 5K in miles -> expected full miles + partial remainder
   - Custom distance exact integer -> no partial
   - Custom distance with fractional -> partial exists and labeled “Last segment …”
   - IDs are stable and unique

Constraints:
- Pure functions only.
- No DOM usage in these modules.
- Ensure lint/tests pass.
```

### Prompt 04 — Time & pace utilities (pure, tested)

```text
Implement time and pace parsing/formatting utilities as pure functions with thorough tests.

Create src/engine/time.js with:
- toSeconds({h, m, s}) -> integer seconds (validate non-negative; coerce empty to 0)
- formatHMS(totalSeconds) -> "H:MM:SS" (H can be 0.., MM/SS always 2 digits)
- parsePace("MM:SS") -> secondsPerUnit (number). Reject invalid formats.
- formatPace(secondsPerUnit) -> "MM:SS" rounded to nearest second for display
- roundToNearestSecond(x) helper (returns integer)

Create tests in test/time.test.js covering:
- toSeconds edge cases (blank/undefined fields, negative rejected)
- parsePace valid/invalid (e.g. "4:05" valid, "4:5" invalid, "aa" invalid)
- formatPace rounding behavior (e.g., 300.4 -> "05:00", 300.5 -> "05:01")
- formatHMS correctness

Constraints:
- Keep functions pure.
- Use clear error objects/messages for invalid parse cases (don’t throw unless necessary; return {ok:false,...} or throw consistently).
- Ensure lint/tests pass.
```

### Prompt 05 — Segment and cumulative time helpers (pure, tested)

```text
Implement helpers to compute segment times and cumulative totals.

Create src/engine/compute.js:
- segmentTimeSeconds(secondsPerUnit, segmentDistance) -> number (full precision float ok)
- cumulativeTimes(segmentTimes) -> array of cumulative seconds (float ok)

Add tests in test/compute.test.js:
- Partial segment time = pace * distance
- Cumulative sums correct
- Works with floats without losing precision (use close-to assertions)

Ensure lint/tests pass.
```

### Prompt 06 — Validation: fixed splits overflow + offending row detection (pure, tested)

```text
Implement validation for impossible inputs.

Create src/engine/validate.js:
Input:
- goalSeconds (integer)
- splits: [{id, distance}]
- fixedPacesById: map of splitId -> secondsPerUnit (number) for rows where user entered pace

Output:
- { ok: true, fixedTotalSeconds, remainingSeconds }
or
- { ok: false, errorMessage, offendingIds, fixedTotalSeconds, remainingSeconds }

Rules:
- fixed segment time = secondsPerUnit * split.distance
- Hard error if fixedTotalSeconds > goalSeconds (remaining negative)
- offendingIds should include the IDs of splits that have fixed paces (the ones contributing)
- remainingSeconds computed as goalSeconds - fixedTotalSeconds

Tests in test/validate.test.js:
- ok when fixed < goal
- error when fixed > goal, offendingIds include fixed ids
- edge case: fixed == goal (ok, remaining 0)

Ensure lint/tests pass.
```

### Prompt 07 — Strategies for distributing remaining time over blank splits (pure, tested)

```text
Implement strategies that assign paces ONLY to blank rows, treating user-entered paces as fixed anchors.

Create src/engine/strategies.js exporting:
- distributeEven({blankIds, blankDistances, remainingSeconds}) -> secondsPerUnitById
- distributeLinear({mode, blankIds, blankDistances, remainingSeconds}) where mode is "negative" or "positive"
- distributeWeighted({blankIds, blankDistances, remainingSeconds, exponent}) for exponential weighting

Design requirements:
- Strategies operate only on blanks; caller provides list of blank split ids and their distances in unit.
- Output must allocate times so that sum(time_i) == remainingSeconds (within tiny epsilon), where time_i = pace_i * distance_i.
- For even: same pace for all blanks.
- For linear:
  - Produce a linearly increasing/decreasing pace across blank rows in their sequential order.
  - Negative split => faster toward end (pace seconds/unit decreases linearly)
  - Positive split => slower toward end (pace increases linearly)
  - Keep paces positive; if remainingSeconds too small/large causing non-positive paces, clamp or return an error object describing infeasible distribution.
- For weighted:
  - Use weights that grow toward end (e.g., (i/N)^exponent) to bias changes late.
  - Keep paces positive; handle infeasible cases similarly.

Add tests in test/strategies.test.js:
- Even: identical pace; totals match remainingSeconds
- Linear negative: last pace < first pace; totals match
- Linear positive: last pace > first pace; totals match
- Weighted: monotonic trend as expected; totals match
- Infeasible case returns ok:false (or throws consistently) and is test-covered

Ensure lint/tests pass.
```

### Prompt 08 — Calculation engine: compute full plan (pure, tested)

```text
Create a single calculation entry point that:
- Parses/uses fixed paces
- Validates against goal time
- Computes paces for blanks using selected strategy
- Produces display-ready results (pace string, segment time string, cumulative time string) rounded to nearest second for display
- Retains full precision internally

Create src/engine/calculate.js:
Input:
- splits: [{id, distance, label}]
- goalSeconds
- strategyKey: "even" | "linear-negative" | "linear-positive" | "weighted"
- fixedPaceStringsById: map splitId -> "MM:SS" (strings; blanks absent or "")

Output:
- { ok:true, rows:[{id, label, paceSecondsPerUnit, paceDisplay, segmentSeconds, segmentDisplay, cumulativeSeconds, cumulativeDisplay}] }
- or { ok:false, errorMessage, offendingIds }

Implementation notes:
- Use time.js parse/format helpers.
- Use validate.js for hard errors.
- For blanks, compute remainingSeconds and distribute by strategy.
- segmentSeconds = paceSecondsPerUnit * distance
- Display rounding: paceDisplay from rounded paceSecondsPerUnit; segment/cumulative displays from rounded seconds using formatHMS or "MM:SS" for segment (choose consistent, document choice).
  - Recommendation: segmentDisplay as "MM:SS" if < 1 hour else "H:MM:SS"; cumulative always "H:MM:SS".

Add tests in test/calculate.test.js:
- No fixed paces + even => all equal pace
- Fixed pace anchors reduce remainingSeconds; blanks computed
- Sum of rounded displays may differ by a second; but internal sum must match goal within epsilon
- Hard error when fixed > goal
- Partial segment handled correctly

Ensure lint/tests pass.
```

### Prompt 09 — App state module (no DOM), derived splits, and dirty flag

```text
Implement state management as a small, testable module (no framework).

Create src/state/store.js:
- Define initialState with:
  - distancePresetKey (default 5K)
  - customDistanceValue
  - unit ("km" default)
  - goalTime {h,m,s}
  - strategyKey ("even" default)
  - paceInputsById {} (strings)
  - results (null)
  - error (null)
  - offendingIds []
  - dirtySinceCalc false
- Provide functions:
  - deriveSplits(state) -> splits list using domain modules
  - applyAction(state, action) -> newState (pure)
Actions:
  - SET_DISTANCE_PRESET
  - SET_CUSTOM_DISTANCE
  - SET_UNIT
  - SET_GOAL_TIME_FIELD
  - SET_STRATEGY
  - SET_PACE_INPUT (by split id)
  - CLEAR_PACE_INPUT (by split id)
  - CLEAR_ALL_PACES
  - SET_RESULTS (results + error/offendingIds)
  - MARK_DIRTY (true/false)
Notes:
- When distance/unit changes, regenerate splits and remap paceInputsById conservatively:
  - If ids changed, drop unmatched inputs.
- When inputs change and results exist, set dirtySinceCalc=true (but don’t clear results).

Add tests in test/store.test.js:
- distance change regenerates splits
- pace input set/clear works
- dirty flag sets when changing inputs after results exist

Ensure lint/tests pass.
```

### Prompt 10 — UI renderer: mount, read controls, render split input table (jsdom tests)

```text
Implement the UI layer to render the input table from state and handle per-row pace editing.

Create src/ui/dom.js:
- Query and cache key DOM elements from index.html (root containers, controls, message areas).
- Provide small helper to create elements safely.

Create src/ui/render.js:
- render(state, splits) updates:
  - Distance/Unit/Goal/Strategy controls values
  - Input table rows:
    - Each row: pace input (text input with placeholder "MM:SS"), subtext label, clear-row button
    - Rows blank by default
  - Do NOT render results yet (leave placeholder)
  - Apply offending highlight class if split id in state.offendingIds

Create src/ui/events.js:
- Wire events to dispatch actions:
  - Distance preset change, custom distance input, unit change, goal fields, strategy
  - Pace input changes (on input/blur—choose one; must be accessible)
  - Clear-row button clears only that row
- Maintain “Enter does not auto-calc”: ensure form submission is prevented or use no <form> submit behavior.

Create src/app.js (in src/) as entry:
- Create state store in memory
- Derive splits
- Render
- On actions: update state -> derive splits -> render

Update public/app.js to import src/app.js as module OR move entry to public/app.js that imports from ../src (choose a no-build approach that works in modern browsers; keep paths correct).

Add UI tests in test/ui-input-table.test.js (jsdom):
- Renders correct number of rows for a chosen distance
- Editing a pace input updates the input value (and underlying state via event)
- Clear-row button clears only that row
- Offending highlight class applied when state.offendingIds includes a row

Ensure lint/tests pass.
```

### Prompt 11 — Render results table + global error messaging (jsdom tests)

```text
Extend UI rendering to include:
- Results table (read-only) with columns: Pace, Segment time, Cumulative time
- Global error message area
- Offending row highlighting already supported; ensure it works with errors.

Update src/ui/render.js:
- If state.results exists, render results rows aligned to split order.
- If state.error exists, show it in the global error area; otherwise clear it.
- If state.dirtySinceCalc is true, show “Inputs changed — recalculate” warning; otherwise hide it.

Add UI tests in test/ui-results.test.js:
- When results provided, results table shows same number of rows with expected text
- When error provided, global error is visible and contains message
- Dirty warning toggles correctly

Ensure lint/tests pass.
```

### Prompt 12 — Wire Calculate + persistence-on-calc snapshot (jsdom tests)

```text
Implement Calculate button behavior end-to-end.

1) Create src/persistence/storage.js:
- KEY constant
- loadPersistedState() -> partial state or null (validate schema minimally)
- savePersistedState(stateSnapshot) -> writes only when called

2) Update app wiring (src/app.js):
- On boot, load persisted snapshot and merge into initialState (safe defaults).
- Ensure splits are derived from loaded selection.
- Wire Calculate button click:
  - Collect splits and fixed pace inputs from state
  - goalSeconds from goal fields
  - Call engine calculate.js
  - Update state with results or error/offendingIds
  - Set dirtySinceCalc=false
  - Persist snapshot ONLY here (distance selection, unit, goal time, strategy, pace inputs)
- Do not persist on every keystroke.

3) Add UI tests in test/ui-calculate.test.js:
- Clicking Calculate with simple inputs produces results
- If fixed paces overflow goal, shows error and highlights offending rows
- Persistence: mock localStorage and assert save called only on Calculate

Ensure lint/tests pass.
```

### Prompt 13 — Dirty warning behavior (inputs changed post-calc) (jsdom tests)

```text
Implement the rule: results remain visible after any input change, but show “Inputs changed — recalculate”.

- In store/app wiring, whenever an input-changing action occurs AND state.results exists, set dirtySinceCalc=true.
- Calculate sets dirtySinceCalc=false.
- Copy-to-input and Clear input table should also mark dirty if results exist (since inputs change).

Add/extend UI test in test/ui-dirty.test.js:
- Calculate once -> dirty false
- Change a pace input -> dirty true, results still present
- Recalculate -> dirty false

Ensure lint/tests pass.
```

### Prompt 14 — Copy results to input, Clear input table (jsdom tests) and Enter button

```text
Implement the two secondary buttons and keyboard Enter button.

1) Copy results to input:
- When clicked, for each split row:
  - If the input pace was blank BEFORE copy, fill it with the computed paceDisplay from results.
  - If user had an entered pace, leave it unchanged.
- After copy, mark dirtySinceCalc=true (since inputs changed) but keep results visible.

2) Clear input table:
- Clears all paceInputsById in UI/state.
- DOES NOT clear persisted data by itself (only next Calculate overwrites persisted snapshot).
- Mark dirtySinceCalc=true if results exist.

1) Keyboard Enter button:
- when an input field is focused
  - if the enter key is detected it should trigger a calculation as if the "Calculate" button was pressed

Add UI tests in test/ui-copy-clear.test.js:
- Copy fills only blanks
- Clear removes all inputs
- Persistence not updated until Calculate (mock localStorage; ensure not called)

Ensure lint/tests pass.
```

### Prompt 15 — Persistence load on boot (jsdom tests)

```text
Ensure the app restores last persisted inputs on load.

- storage.loadPersistedState should be called on startup.
- If snapshot exists:
  - Restore distance preset/custom distance, unit, goal time, strategy, paceInputsById
  - Derive splits and render input rows accordingly
- If snapshot doesn’t match current split ids (e.g., unit changed), drop unmatched pace entries safely.

Add UI test in test/ui-persistence-load.test.js:
- Preload localStorage with a snapshot
- Initialize app
- Assert controls and specific pace inputs are populated as expected

Ensure lint/tests pass.
```

### Prompt 16 — PWA: manifest + service worker caching app shell only

```text
Add PWA installability + offline support after first load.

1) public/manifest.webmanifest:
- name/short_name
- start_url scope
- display: standalone
- icons (include placeholder filenames in public/icons/)

2) public/sw.js:
- Cache app shell assets only:
  - index.html, styles.css, app.js, manifest, icons
- On fetch:
  - Serve from cache first, fall back to network
- On install/activate:
  - Clean old caches (simple versioned cache name)
- No update notification UI.

3) Update index.html to register SW (if supported) after load.
4) Add minimal documentation comment in sw.js about caching policy.

Add a basic test plan note in README.md (not automated) describing how to verify offline works.

Ensure lint/tests pass.
```

### Prompt 17 — Responsive + accessibility + iOS Safari quirks

```text
Polish for responsive layout and basic accessibility, including iOS Safari quirks.

1) CSS:
- Ensure side-by-side layout always, with a horizontal scroll container on narrow screens.
- Improve table readability.
- Ensure primary button is visually distinct but accessible.

2) HTML:
- Add meta tags helpful for iOS Safari/PWA (viewport, apple-mobile-web-app-capable, etc.).
- Ensure all inputs have labels and sensible inputmode attributes:
  - goal time: inputmode=numeric
  - pace: inputmode=numeric
- Ensure tab order is logical.

3) JS:
- Avoid relying on unsupported features in older iOS Safari (but evergreen only).
- Ensure service worker registration doesn’t break on iOS.

4) Tests:
- Add/adjust UI tests for label presence and focusable controls count sanity checks (where reasonable).

Ensure lint/tests pass.
```

---

## Notes on strategy math (implementation guidance)

- Even pace:
  - remainingSeconds / totalBlankDistance => paceSecondsPerUnit
- Linear strategies:
  - Choose a baseline pace and a delta per step across N blanks.
  - Allocate segment times by pace_i * distance_i, solve for baseline given chosen delta scale.
  - Keep pace_i positive.
- Weighted:
  - Use normalized weights across indices to shape relative pace changes, then solve scale to match remainingSeconds.

(Exact formulas can be implemented in a few lines; tests should enforce totals and monotonic trends rather than exact numbers.)

---

## Verification checklist (for every prompt)

- `npm run lint` passes with eslint:recommended
- `npm test` passes
- No orphaned code: every new module is imported and used or fully tested
- UI remains usable with keyboard only (basic level)
- Calculate only via button click
- Persistence only on Calculate
- Results remain visible after edits, with dirty warning
