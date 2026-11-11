# ECHO documentation

Last reviewed against the local workspace: **2026-11-11**.

## Current documents

- [Project status](project-status.md) — current product, runtime, data, version, recommendation snapshot/migration behavior, and dated verification results.
- [TestFlight preparation](TESTFLIGHT_SUBMISSION.md) — repository-backed release facts and the checks that still require App Store Connect or a device.
- [Quote context research ledger](QUOTE_CONTEXT_RESEARCH.md) — current local data snapshot, research rules, and dated research history.

## Historical records

- [1.0.0 change log](QUOTE_APP_1.0.0_CHANGES.md) — a record of work and validation performed on 2026-08-03; its counts and release state are historical.
- [2026-08-16 project audit](problem.md) — a point-in-time engineering audit with dated follow-ups for the 2026-11-11 recommendation and Clear All repair. Other findings and command output have not all been rechecked against today's code.
- [`superpowers/`](superpowers/) — dated design and implementation records for the iOS 1.0.0 release work. These explain past decisions; they are not current work instructions.

## Source-of-truth notes

- The repository's app version is in [`app.json`](../app.json) and [`package.json`](../package.json). Both currently say `1.0.2`; the root [README](../README.md) still says `1.0.0` and needs a separate update.
- The current catalog counts below describe the JSON files present in this local workspace. Those files, including `QUOTE_CONTEXTS.json`, are ignored by Git, so a Git clone alone does not contain the complete app data.
- App Store Connect state, the uploaded build number, review status, and privacy answers cannot be inferred from this repository. Confirm them in App Store Connect before submission.
- When a dated report conflicts with current source or local data, treat the report as a historical record and check [Project status](project-status.md).
