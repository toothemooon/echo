# Quote Context Research Ledger

This ledger tracks evidence research for the bundled `QUOTE_CONTEXTS.json`. It is not a substitute for the source records stored with each author and quote. Counts below describe the local data present in this workspace; they are not the result of a fresh browser-based fact check.

## Current local data snapshot — 2026-11-11

| Data | Current count |
| --- | ---: |
| English quotes | 1,282 |
| Simplified Chinese quotes | 823 |
| Japanese quotes | 1,820 |
| Published quote contexts | 3,925 |
| Language-scoped author profiles | 952 (206 English, 445 Chinese, 301 Japanese) |
| Author profiles with non-empty biography text | 915 |
| Author profiles without biography text | 37 |

The current author records carry `verification_status: pending` for 948 records and `identity_conflict` for 4. This metadata does not mean every biography or quotation has been independently fact-checked. The current quote-context schema has provenance fields but no quote-level verification status. The app and research process must not imply that the occasion of a quotation has been established.

These four runtime data files are ignored by Git: `QUOTE_CONTEXTS.json` and the three files under `assets/`. The figures above therefore describe this machine's data snapshot. A clean clone does not provide these records, and the context history cannot be reconstructed from the Git commit alone.

## Evidence rules

1. Search the distinctive wording of the quotation together with the attributed author and any known work.
2. Prefer primary texts, official archives, collected papers, speech transcripts, bibliographic records, and scholarly editions.
3. Use Wikiquote and quotation databases to discover candidate sources, not as independent proof of the original wording or occasion.
4. Do not treat search-result snippets or AI-generated summaries as evidence.
5. Use these conclusions only when the cited evidence supports them:
   - `verified`: a primary location or equivalent authoritative record is identified;
   - `needs_context`: the primary source is known, but the immediate occasion is not;
   - `unverified`: only secondary circulation has been found;
   - `disputed`: reliable research conflicts with the wording or attribution.
6. Keep author-biography evidence separate from evidence for the quotation itself. Store source URLs and explain what each source supports.

## Research notes from the initial batch

The following work was recorded before the 2026-08-11 context regeneration. Treat the listed candidates and statuses as historical leads; reconcile them with the current records and source URLs before resuming research.

| Record | Result recorded at the time | Principal evidence noted |
| --- | --- | --- |
| A.A. Milne biography | verified | Encyclopaedia Britannica |
| Abigail Adams biography | verified | Encyclopaedia Britannica |
| Aesop biography | verified with historical uncertainty | Encyclopaedia Britannica |
| Albert Einstein biography | verified | Encyclopaedia Britannica |
| Quote 156, Piglet / gratitude | unverified | Scholastic secondary attribution; no primary location found |
| Quote 18, difficulty / opportunity | disputed | Quote Investigator; wording traced to John Archibald Wheeler |
| Quote 76, look deep into nature | unverified | Today in Science History; no primary source identified |

The earlier suggested continuation began with quote IDs 140 and 151, followed by English records marked `attribution_only`. Those IDs and labels must be checked against the current local catalog before use.

## 2026-08-11 — context regeneration and data loss

`QUOTE_CONTEXTS.json` was untracked. A regeneration temporarily removed all Chinese and Japanese quote-context entries, reducing the file from 4,283 to 1,465 entries. The missing entries were rebuilt from the published catalog by `scripts/generate-editorial-notes.mjs`; the current local file now has 3,925 quote-context records.

The regeneration could not restore hand-researched evidence from the previous file. The original note recorded that the Koizumi composite context lost its prior verified status and that four biography source lists were lost. The current JSON is the source of truth for what is present now; do not assume those source lists or verification conclusions survived simply because the biography text remains.

The same incident found 29 English quote fingerprints that no longer matched after ASCII `...` had been normalized to `…`. The generation script now recomputes fingerprints, and `tests/quoteContexts.test.ts` checks their relationship to the catalog text.

## Historical echo is not quote-occurrence verification

The profile screen's “historical echo” describes the wider world a speaker lived in—such as period, place, occupation, intellectual tradition, and the source work—using bundled editorial material derived from external sources. It does not establish when, where, to whom, or in response to what a specific quotation was said.

The current context schema has no verified quote-occasion records. Do not turn biography or work-level facts into a narrative about the moment of utterance. `tests/quoteContexts.test.ts` includes a guard against wording that claims such an occasion.

The quote-level `verification_status` field was removed because it had the same `pending` value for every record and conveyed no per-quote evidence. Fields that merely restated that status were removed with it. `context_sources` remains as per-record provenance, while author-level identity status remains on author records. If future research verifies an occasion, add a real evidence-backed status and source record before displaying that conclusion.
