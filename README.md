# BEP Studio

A dependency-free, printable Post-Contract BEP prototype for a main contractor. Arabic editing controls and an English document. Source: `dist/` (authored static assets, not disposable build output).

## Cloudflare Pages deployment

1. Workers & Pages → Create application → Pages → Connect to Git.
2. Select this repository and production branch `main`.
3. Framework preset: **None**.
4. Build command: **leave empty**.
5. Build output directory: **dist**.
6. Root directory: **leave empty**.
7. Save and Deploy. Future commits to `main` trigger deployment.

No database, environment variables, API keys, paid service or build dependencies are required for this prototype. Cloudflare-specific `_headers` sets response policies.

## Features

- Project and party names update throughout the document.
- Eight selectable sections, including optional 4D.
- Enabling/disabling sections updates the table of contents and section numbering.
- 4D rows in responsibilities, BIM uses and delivery planning follow its inclusion state.
- Per-section project notes, accent color, font, optional cover and contents.
- A4 print stylesheet, repeating table headers, and printable draft content.
- Download/open a versioned JSON snapshot of inputs, settings and notes.
- Inputs are escaped before appearing as HTML; imported files are validated.

## Data and limitations

The website is public unless separately protected at the hosting layer. A private GitHub repository alone does not make the deployed site private. No project data is uploaded by this app: inputs remain in the current tab and downloaded snapshots. No localStorage or server storage is used. Save a JSON snapshot before closing the tab. Imported snapshots replace the current session after confirmation if there are unsaved edits.

This is a first working slice, not the complete source BEP conversion. Generic wording and proposed responsibility assignments must be adapted to the appointment. Draft status remains visible. No claim of client approval or automatic standards compliance is made. The original project documents, owner standard, contacts, logos and signatures are not included.

PDF is produced with the browser Print → Save as PDF. Choose A4, disable browser headers/footers, and enable background graphics for the cover color. Exact page breaks depend on the browser and fonts. Contents links are included; PDF page numbers and a page-numbered contents table are not implemented. DOCX export, accounts and cloud project storage are not implemented.

## Local checks

Serve `dist/` with a static HTTP server (ES modules require HTTP rather than opening an HTML file directly). Run `node --test tests/content.test.mjs` for document generation, conditional content, input escaping and snapshot validation checks.
