# ECHO Documentation Refresh Plan

> This plan records a documentation-only refresh. It is executed directly in the current workspace because the user requested the changes themselves.

**Goal:** Make the active documents under `docs/` describe the current ECHO source tree and local bundled data without presenting old release notes or audit results as current facts.

**Approach:** Add a docs index and a current project status page; refresh the TestFlight preparation sheet and quote-context research snapshot; label dated release and audit documents as historical records. Keep claims tied to checked-in configuration or the current local data files, and identify facts that still require App Store Connect or a clean-clone check.

**Scope:** `docs/` only. No application code, catalog data, root README, or root architecture document changes.

## Tasks

- [x] Add `docs/README.md` and `docs/project-status.md` with the current product, runtime, version, data, and reproducibility facts.
- [x] Replace stale 1.0.0 TestFlight copy with a 1.0.2 repository-based preparation sheet and explicit external verification checklist.
- [x] Refresh the quote-context ledger's current data snapshot while retaining dated research notes as history.
- [x] Label the 1.0.0 change log, 2026-08-16 audit, and dated design/implementation artifacts as historical snapshots.
- [x] Review changed prose and links, compare claims with current source/config/data, and run `git diff --check` (no application test suite is in scope).

## Verification record

- Matched `app.json`, `package.json`, and `eas.json` values to the new current-state and TestFlight documents.
- Read the local quote/context JSON counts: 1,282 / 823 / 1,820 quotes, 3,925 contexts, 952 author profiles.
- Checked local Markdown links across `docs/`: 9 Markdown files, 0 broken local links.
- `git diff --check`: passed.
- App tests, Expo Doctor, device builds, and App Store Connect state were not checked as part of this documentation-only task.

## Review focus

- Local catalog counts and author counts must match the files present in this workspace.
- `1.0.2` is the Expo/npm version; the checked-in iOS build number `7` is not necessarily the remote EAS build number.
- Core reading is offline-capable; that does not mean the entire app has no network behavior.
- Historical Echo must not be described as verification of the exact occasion when a quote was said.
- Dated audit findings and validation output must remain attributed to their original snapshot date.
