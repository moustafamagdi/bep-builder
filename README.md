# BEP Studio

A browser-based Post-Contract BIM Execution Plan builder for a main contractor. The interface and generated BEP are English.

## Current release

- Multi-project dashboard with search, duplicate, archive and delete.
- Automatic local persistence with authenticated Supabase cloud synchronization.
- 29 modular BEP sections with Required, Optional, Pending and Not Applicable states.
- Structured project, appointment, CDE, software, model, milestone, delivery, clash and meeting inputs.
- Dependency checking, including COBie / Asset Information and conditional 4D requirements.
- Readiness review that separates blocking gaps from advisory items and links every result to its exact field, module or schedule row.
- Immutable release snapshots with restore-to-draft.
- Full-workspace JSON backup and restore.
- Generic English Post-Contract BEP output with live numbering and project-specific provisions.
- Word-style A4 preview and PDF layout with controlled pagination, repeating project headers, footers and page numbers.
- Input escaping, backup validation and automated content/state tests.
- Email/password authentication, newest-version project merging and per-user Row Level Security.
- Dedicated responsive authentication screen with sign in, confirmed-password sign up, show/hide password controls, password recovery and optional remembered sessions.
- Private Supabase Storage bucket prepared for project attachments.
- In-app private attachment upload, download and deletion with automatic appendix registration.
- Up to four ordered project logos, with independent cover-only or cover-and-page-header placement.
- Advanced responsibility, information exchange, naming, LOIN, QA/QC, asset requirement and decision schedules.
- Multi-sheet Excel workbook export/import and per-schedule CSV exchange.
- Import impact preview with merge and replace modes.
- Private Company Template and Client Requirement Pack library.
- Applied-template provenance and retained-conflict review.
- Built-in generic Default BEP and anonymized Pilot BEP starting points derived from the supplied Post-Contract reference document.
- Revocable public read-only preview snapshots with expiry dates, printable A4 output and time-limited logo URLs.
- One-use collaboration invitations with separate Viewer and Editor roles, member removal and leave-project controls.
- Owner-preserving collaborative RLS for project data and private attachments.
- Revit-style section borrowing with per-tab reservations, automatic heartbeat, expiry and owner force-release.
- Versioned, section-scoped cloud saves so parallel work in different BEP areas cannot overwrite unrelated changes.
- Section-scoped Undo/Redo controls with Ctrl+Z, Ctrl+Y and Ctrl+Shift+Z shortcuts.

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
node --check dist/presets.mjs
node --check dist/pagination.mjs
node --check dist/issue-navigation.mjs
node --check dist/collaboration.mjs
```

## Governance and delivery registers

EIR compliance is under Information; detailed responsibilities and mobilization under Parties & team; expanded TIDP/MIDP and risks under Coordination; change history and recorded approvals under Review. All registers support CSV and workbook exchange and appear in the BEP. New HATCO presets include starter rows with unconfirmed project inputs clearly unresolved. Existing projects gain empty registers without overwriting existing information.

Readiness separates data completeness from evidence of technical review and issue authorization. Approval records are references to externally obtained decisions, not electronic signatures or an approval-request service. Binding records the exact reviewed content; changing content invalidates the binding. CSV/XLSX imports cannot carry this binding and need review and re-binding. Public previews omit private approval snapshots.

The server section-save allowlists in `supabase/schema.sql` include the new registers. Approval and change records are managed under the existing whole-project Review reservation.

## Phase 1 — BEP plan versus execution tracking

The completeness percentage is passed applicable plan checks divided by the total evaluated plan checks (rounded down); approval records and execution follow-up are separate. It is not a certification score. Mobilization plans require an owner, resources, checker, date and measurable acceptance criteria. Tests default to Before production, and risk actions default to During execution. An explicitly selected BEP issue gate remains a release blocker. Production prerequisite status is an informational check, not authorization in a construction or model-authoring system.

New approvals bind the BEP plan scope (bep-plan-v2). Live delivery forecast/actual dates, current revision, status and evidence, exchange status, and ordinary execution test/risk results are excluded. Baseline dates, scope, responsibilities, criteria, risk assessments and mitigation plans remain included. Explicit BEP issue conditions and authorized mobilization exclusions remain included. Legacy whole-document approval bindings remain exact and require deliberate review/re-binding to adopt the narrower plan scope. No existing approval is silently converted.

The BEP preview/PDF prints plan fields only; execution fields remain editable in the workspace and export through CSV/XLSX. Existing project values and frozen snapshot records are preserved. No database schema change is needed: the existing reserved-section save procedure stores the new nested row fields.
