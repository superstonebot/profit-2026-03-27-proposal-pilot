# ProposalPilot MVP

ProposalPilot is a polished local-first static web app for freelancers who want a lightweight deal desk for sent proposals, follow-up timing, reminder copy, and close clarity.

## What it does

- Tracks proposals in a simple pipeline with status + decision stage
- Opens a focused workspace for amount, dates, blockers, notes, and cadence
- Suggests the next follow-up action from the stored timeline
- Generates reminder copy for gentle / firm / expiry / final check-ins
- Estimates close probability from stage, blockers, and expiry pressure
- Saves everything to `localStorage`
- Ships with a sample data loader for first-run exploration
- Exports the selected proposal as Markdown or JSON
- Includes recent activity history + settings for default cadence and reminder tone
- Supports Korean and English with automatic first-load locale selection and a top KO / EN toggle

## Project structure

- `index.html` — app shell
- `styles.css` — responsive product UI
- `app.js` — browser state, rendering, events, persistence
- `src/core.js` — pure business logic helpers
- `src/sample-data.js` — blank/sample desk generators
- `src/i18n.js` — ko/en copy tables
- `tests/core.test.js` — lightweight repeatable verification
- `RESULT.md` — exact verification commands and outputs

## Run locally

Because this is a static app, you can either open `index.html` directly or serve the folder.

### Option 1: simple static server

```bash
python3 -m http.server 4173
```

Then open <http://127.0.0.1:4173>.

### Option 2: just inspect the file

Open `index.html` in a browser.

## Verify

```bash
npm test
node --check app.js
node --check src/core.js
node --check src/sample-data.js
node --check src/i18n.js
```

A small repeatable test surface lives in `src/core.js`, covering locale selection, follow-up suggestions, close probability, reminder text, and Markdown export.

## Deploy to Vercel

This folder is already static-site friendly.

- Framework preset: `Other`
- Build command: leave empty
- Output directory: leave default/root

Vercel can serve the files directly as a static deployment.

## Notes / limits

- Data is stored only in the browser on the current device.
- No multi-user sync or backend storage is included in this MVP.
- The close probability is intentionally heuristic, not a forecasting model.
