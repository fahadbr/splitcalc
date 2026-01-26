# Running Split Calculator – Developer Specification

## Overview
A frontend-only **Progressive Web Application (PWA)** that calculates running splits based on:
- Race distance
- Goal time
- User-defined pace constraints for specific splits

The app computes required paces for remaining splits and presents results in a read-only table. The goal is a clean, accessible, testable tool that runs entirely in the browser with **no build step**.

---

## Core Requirements

### Supported Distances
- Preset race distances:
  - 5K
  - 10K
  - Half Marathon
  - Full Marathon
- Custom distance input:
  - Unit selectable: **miles or kilometers**

### Split Structure
- Splits are auto-generated based on total distance
- One row per full unit (mi or km)
- Final row may be a **partial segment**
- Fixed, sequential order (no reordering)

### Goal Time Input
- Separate fields:
  - Hours
  - Minutes
  - Seconds

---

## Input Table (Editable)

### Structure
- One column table
- One row per split
- Each row contains:
  - **Primary**: Pace input (`MM:SS /unit`)
  - **Secondary (subtext)**: Split label
    - Example: `Mile 3 (1.0 mi)`
    - Final partial: `Last segment (0.11 mi)`
  - Clear-row button (clears only that row’s input)

### Behavior
- Rows are blank by default
- User may optionally enter a pace for any row
- Blank rows indicate paces to be computed

---

## Strategy Selection

### UI
- Dropdown selector
- Default: **Even pace**

### Supported Strategies
- **Even pace**: all blank rows get identical pace
- **Linear negative split**: gradually faster toward end
- **Linear positive split**: gradually slower toward end
- **Weighted (exponential)**: small early changes, larger late changes

### Rules
- Strategies apply **only to blank rows**
- User-entered paces are treated as fixed anchors

---

## Calculation Rules

### General
- Triggered only via **Calculate** button
- Uses full internal precision
- Display values rounded to nearest second

### Output
- Separate, read-only results table
- Columns:
  - Pace
  - Segment time
  - Cumulative time

### Partial Segments
- Segment time = pace × segment distance

---

## Validation & Error Handling

### Hard Errors
Calculation is blocked if:
- Sum of fixed split times exceeds goal time
- Remaining time is negative

### UX
- Global error message explaining the issue
- Highlight offending rows in input table

---

## Post-Calculation Behavior

- Results remain visible after input changes
- Show warning: “Inputs changed — recalculate”

### Buttons
- **Calculate** (primary CTA)
- Copy results to input table:
  - Fills only previously blank rows
- Clear input table:
  - Clears UI only
  - Does NOT clear persisted data

---

## Persistence

- Uses `localStorage`
- Persisted **only when Calculate is pressed**
- Stored data:
  - Distance selection
  - Goal time
  - Split unit
  - Strategy
  - Input paces (including blanks)

---

## Responsive Design

- Tables are always side-by-side
- Horizontal scrolling allowed on small screens
- No layout toggles

---

## Accessibility

Target level: **Basic accessibility**
- Proper labels for all inputs
- Logical tab order
- Semantic HTML tables
- ARIA only where necessary

---

## PWA Requirements

### Scope
- Installable PWA
- Offline support for:
  - App shell (HTML, CSS, JS, icons, manifest)
  - Last persisted inputs

### Service Worker
- Cache app shell only
- No update notification UI

---

## Architecture

### JavaScript Modules (ES Modules)

Clear separation between logic and UI:

1. **State Management**
   - Current inputs
   - Derived split list
   - Dirty / error flags

2. **Calculation Engine (Pure Functions)**
   - Pace ↔ time conversions
   - Strategy distributions
   - Validation logic

3. **UI Layer**
   - DOM rendering
   - Event handling
   - Visual state updates

4. **Persistence**
   - localStorage read/write

5. **PWA / Service Worker**

---

## Tooling

### JavaScript
- Vanilla JS
- ES Modules
- No bundler, no build step

### Linting
- ESLint
- `eslint:recommended` only

### Testing (Vitest)

#### Setup
- Node + jsdom

#### Coverage
1. **Pure logic tests**
   - Pace/time math
   - Strategy outputs
   - Rounding
   - Partial segments
   - Impossible totals

2. **UI tests**
   - DOM rendering
   - Button behavior
   - Error display
   - Copy-to-input behavior

---

## Browser Support

- Evergreen browsers
- Explicit support for **iOS Safari quirks**

---

## Visual Design

- Light visual hierarchy
- Card-like grouping
- System fonts
- Subtle emphasis for primary actions
- Clear visual distinction between input and results tables

---

## Primary Action Hierarchy

- **Calculate**: primary button
- Copy / Clear: secondary actions
- Hitting enter on the keyboard triggers a calculation

---

## Non-Goals (v1)

- No backend
- No accounts
- No data export
- No sharing
- No unit mixing per split

---

## Acceptance Criteria Summary

- All calculations deterministic and test-covered
- No build step required
- Fully usable offline after first load
- Clear error messaging for impossible inputs
- Clean separation of logic and UI

---

**End of specification**

