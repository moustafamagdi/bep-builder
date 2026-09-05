# BEP Studio

A browser-based Post-Contract BIM Execution Plan builder for a main contractor. The editor is Arabic and the generated BEP is English.

## Current release

- Multi-project dashboard with search, duplicate, archive and delete.
- Automatic local persistence in `localStorage`.
- 29 modular BEP sections with Required, Optional, Pending and Not Applicable states.
- Structured project, appointment, CDE, software, model, milestone, delivery, clash and meeting inputs.
- Dependency checking, including COBie / Asset Information and conditional 4D requirements.
- Readiness review that separates blocking gaps from advisory items.
- Immutable release snapshots with restore-to-draft.
- Full-workspace JSON backup and restore.
- Generic English Post-Contract BEP output with live numbering and project-specific provisions.
- A4 print / Save as PDF layout.
- Input escaping, backup validation and automated content/state tests.

## Cloudflare Pages

The production branch is `main`, the framework preset is **None**, and the output directory is `dist`. No build command is required.

## Data and privacy

This release stores projects only in the current browser profile. It does not upload project data. The deployed website remains public unless access protection is enabled in Cloudflare. Do not enter confidential project information on an unprotected shared device.

Cloud persistence, sign-in and private attachment storage require Cloudflare Worker/D1/R2 bindings and are intentionally not simulated in browser code. The JSON backup is the portability and recovery mechanism until those bindings are configured.

## Checks

```bash
node --test tests/app.test.mjs
node --check dist/app.mjs
node --check dist/document.mjs
node --check dist/modules.mjs
node --check dist/store.mjs
```
