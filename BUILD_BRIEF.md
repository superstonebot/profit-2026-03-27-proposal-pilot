# ProposalPilot MVP Brief

## Product
ProposalPilot — freelancer proposal follow-up and deal desk.

## Goal
Build a deployable local-first web MVP that helps freelancers manage proposal pipeline, follow-up cadence, and close clarity without a backend.

## Must-have features
- Lead / proposal list with status tracking
- Proposal detail workspace with amount, sent date, expiry date, decision stage, and notes
- Follow-up cadence planner with next action suggestions
- Reminder template generator for gentle / firm / expiry / final check-in messages
- Objection / blocker notes and close probability summary
- Saved state via localStorage
- Sample data button
- Export current proposal as Markdown or JSON
- Clean desktop/mobile UI

## Required product touches
- Korean / English support (ko/en)
- Default language chosen from browser locale on first load
- Small KO / EN toggle in the top area for manual switching
- Include at least one settings or history-style utility so it feels like a small product, not a demo

## Constraints
- No backend required
- Prefer static HTML/CSS/JS deployable on Vercel
- Include README with run/deploy notes
- Keep all changes inside this folder only

## Verification target
- The app should support: first visit → sample data or new proposal → generate next step + reminder copy → review summary → export.