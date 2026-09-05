# BEP Studio

A browser-based Post-Contract BIM Execution Plan builder for a main contractor. The interface and generated BEP are English.

## Current release

- Multi-project dashboard with search, duplicate, archive and delete.
- Automatic local persistence with authenticated Supabase cloud synchronization.
- 29 modular BEP sections with Required, Optional, Pending and Not Applicable states.
- Structured project, appointment, CDE, software, model, milestone, delivery, clash and meeting inputs.
- Dependency checking, including COBie / Asset Information and conditional 4D requirements.
- Readiness review that separates blocking gaps from advisory items.
- Immutable release snapshots with restore-to-draft.
- Full-workspace JSON backup and restore.
- Generic English Post-Contract BEP output with live numbering and project-specific provisions.
- A4 print / Save as PDF layout.
- Input escaping, backup validation and automated content/state tests.
- Email/password authentication, newest-version project merging and per-user Row Level Security.
- Dedicated responsive authentication screen with sign in, confirmed-password sign up, show/hide password controls, password recovery and optional remembered sessions.
- Private Supabase Storage bucket prepared for project attachments.
- In-app private attachment upload, download and deletion with automatic appendix registration.
- Per-project company logo upload and print-cover integration.
- Advanced responsibility, information exchange, naming, LOIN, QA/QC, asset requirement and decision schedules.
- Multi-sheet Excel workbook export/import and per-schedule CSV exchange.
- Import impact preview with merge and replace modes.
- Private Company Template and Client Requirement Pack library.
- Applied-template provenance and retained-conflict review.

## Cloudflare Pages

The production branch is `main`, the framework preset is **None**, and the output directory is `dist`. No build command is required.

## Supabase

The public browser client contains only the Supabase project URL and publishable key. Never add a Supabase secret or service-role key to this repository.

The database and storage policies are documented in `supabase/schema.sql`. Cloud records are restricted to their authenticated owner through RLS. Local storage remains an offline cache and JSON backup remains available for portability and recovery.

## Checks

```bash
node --test tests/app.test.mjs
node --check dist/app.mjs
node --check dist/document.mjs
node --check dist/modules.mjs
node --check dist/store.mjs
node --check dist/spreadsheet.mjs
node --check dist/templates.mjs
```
