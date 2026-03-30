# ProposalPilot MVP Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished local-first static web app for managing freelancer proposals, follow-up cadence, reminder copy, and close clarity without any backend.

**Architecture:** Use a small vanilla HTML/CSS/JS app with a stateful shell in `app.js`, pure business logic in `src/core.js`, browser persistence via `localStorage`, and browser-friendly ESM modules. Keep a small tested logic surface so follow-up suggestions, language selection, probability summaries, and export formatting can be verified with `node --test`.

**Tech Stack:** Static HTML, modern CSS, vanilla JavaScript (ES modules), Node built-in test runner.

---

## File map

- `index.html` — app shell, layout regions, template hooks
- `styles.css` — responsive editorial UI styling
- `app.js` — browser boot, state, rendering, events, persistence
- `src/core.js` — pure helpers for locale, cadence, reminders, probability, export
- `src/sample-data.js` — sample proposals and default settings
- `tests/core.test.js` — repeatable verification for core logic
- `package.json` — `node --test` entry
- `README.md` — run/deploy notes and feature overview
- `RESULT.md` — exact verification commands and outcomes

## Chunk 1: Verified core logic

### Task 1: Create failing tests for pure business rules

**Files:**
- Create: `tests/core.test.js`
- Create: `package.json`

- [ ] Step 1: Write tests for locale pick, next action suggestion, reminder copy, probability summary, and markdown export.
- [ ] Step 2: Run `node --test` and confirm failure because `src/core.js` does not exist yet.
- [ ] Step 3: Implement minimal `src/core.js` to satisfy the tests.
- [ ] Step 4: Run `node --test` again and confirm all tests pass.

## Chunk 2: Product shell and interaction flow

### Task 2: Build the static app shell

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Create: `app.js`
- Create: `src/sample-data.js`

- [ ] Step 1: Create the responsive layout with top language toggle, proposal list, detail workspace, follow-up planner, reminder generator, history, settings, and export actions.
- [ ] Step 2: Wire app state, rendering, and persistence using localStorage.
- [ ] Step 3: Add sample data loading, proposal creation, selection, editing, and history logging.
- [ ] Step 4: Connect next-step suggestion, reminder generation, copy, export, and settings behavior using the tested core helpers.

## Chunk 3: Docs and verification artifacts

### Task 3: Finish README and record verification

**Files:**
- Create: `README.md`
- Create: `RESULT.md`

- [ ] Step 1: Document features, local usage, and Vercel deploy notes in README.
- [ ] Step 2: Run verification commands for tests and a small static file sanity check.
- [ ] Step 3: Record exact commands and outcomes in RESULT.md.
