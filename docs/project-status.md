# ECHO project status

> Reviewed against the local source tree and local data files on 2026-11-11. This is a repository snapshot, not confirmation of App Store Connect or TestFlight state.

## Product

ECHO is an offline-first, trilingual quote-reading mobile app built with Expo and React Native. A first-launch mood choice maps to quote categories; readers can move through recommendations, save quotes, revisit reading history, share quote cards, and adjust language, theme, typography, and animation. The mood choice is a reading preference, not a health assessment.

The product has no account, backend, or cloud-sync flow in the current app. Quote text, author profiles, and quote-context material are bundled as local JSON. Preferences, saved quotes, reading history, and recommendation exposure are stored on-device with AsyncStorage.

## Repository configuration

| Item | Current repository value |
| --- | --- |
| Expo / npm app version | `1.0.2` (`app.json`, `package.json`) |
| iOS bundle identifier | `yachts.sarada.echo` |
| `app.json` iOS build number | `7` |
| EAS app version source | `remote`; production builds use `autoIncrement` |
| Android package / version code | `yachts.sarada.echo` / `2` |
| Expo / React Native | Expo `~57.0.20` / React Native `0.86.3` |
| EAS project | `31027af5-fe6e-41bf-9cee-23204247f355` |

Because EAS uses remote versioning and auto-increment, `7` is the build number in the checked-in config, not a guarantee about the next uploaded build. Check the EAS build and App Store Connect record before writing release metadata. The repository does not establish whether a build is currently in TestFlight or under review.

The root `README.md` is not synchronized: it still labels the current version `1.0.0`. `app.json` and `package.json` are the configuration values used here; update the root README separately when that file is in scope.

## Bundled content in this workspace

| Language | Local file | Records |
| --- | --- | ---: |
| English | `assets/quotes.json` | 1,282 |
| Simplified Chinese | `assets/quotes.zh-Hans.json` | 823 |
| Japanese | `assets/quotes.ja.json` | 1,820 |
| **Total** |  | **3,925** |

The current local `QUOTE_CONTEXTS.json` contains 3,925 quote-context records and 952 language-scoped author records (206 English, 445 Simplified Chinese, 301 Japanese). It has biography text for 915 author records; 37 are identity-only. These are counts of the files in this workspace, not a fresh fact-check of the quotations or biographies.

The quote catalogs and `QUOTE_CONTEXTS.json` are excluded by `.gitignore`. `.easignore` re-includes the four runtime JSON files for EAS uploads, so a build environment must have the matching local data files. A clean Git clone by itself is not a complete, reproducible release source. Keep data changes, provenance, and any release backup together; do not assume an importer can reconstruct hand-edited research.

## Runtime shape

- Expo Router supplies the app shell, but the app currently uses one route. `src/app/index.tsx` owns page state and coordinates onboarding, recommendations, settings, history, sharing, and the quote-context screen.
- Quote records are validated and frozen in `src/data/quotes.ts`; the pure selection rules live in `src/recommendation/selector.ts`.
- Recommendation state and user preferences are persisted through storage modules. Active storage mutations are serialized by `src/storage/storageMutationQueue.ts`.
- The current app has iOS and Android configuration. iOS is the documented primary release target. A `web` npm script exists, but this repository does not include `react-native-web`; do not treat Web as a supported build target without a separate compatibility check.
- The navigation pages are represented in React state rather than separate Expo Router routes. The Android system-back behavior called out in the 2026-08 audit remains a platform issue to verify before claiming Android parity.

### Recommendation state and Clear All

Recommendation persistence uses the single `@echo/recommendation_state_v2` AsyncStorage value. Its schema is `{ schemaVersion: 2, epoch, rotation, exposures }`; `exposures` contains separate counts for English, Simplified Chinese, and Japanese. The selector itself remains a pure function in `src/recommendation/selector.ts`.

The read path is a two-step lifecycle:

1. `prepareNextRecommendedQuote()` selects a candidate and returns its quote, generation, epoch, and `selectionId`. It does not increment exposure or rotation counts.
2. The screen accepts the candidate only if its request generation is still current. It then calls `commitQuoteSelection()`, which re-reads the snapshot in the shared storage mutation queue, validates the prepared epoch, and writes the updated rotation and exposure together as one snapshot.

The store keeps at most 32 recently committed selection IDs in memory to make repeated commits idempotent; this history is not persisted. A failed snapshot write leaves the previous counts intact while the already displayed quote remains available for reading.

Migration from `@echo/quote_rotation_v1` and `@echo/quote_exposure_v1:*` is single-flight. A valid v2 snapshot is authoritative; residual v1 keys are cleanup-only. When no v2 snapshot exists, migration writes v2 before removing the old keys. If that write fails, preparation can read the legacy values and leaves them intact. An existing malformed v2 value raises a retryable error instead of being replaced from legacy data.

Clear All is serialized with recommendation commits. It writes empty rotation and exposure state with `epoch + 1`, then removes the other `@echo/` keys while retaining the v2 marker. A candidate prepared under an older epoch is discarded at commit, so clearing cannot be undone by an in-flight recommendation.

## Network and historical context

The quote-reading path uses bundled content and remains available offline. That does not mean every app operation is network-free: `app.json` configures Expo Updates, and Settings exposes external policy, terms, and source links.

`src/services/wikipedia.ts` and `src/services/definingMoment.ts` contain Wikipedia/OpenAI request code, but the current app entry and screens do not call those services. The current quote-context screen reads bundled `QUOTE_CONTEXTS.json`. Do not describe Defining Moment generation as an active app feature. If the dormant service is ever connected, its client-side API-key storage and network behavior need a new security and privacy review.

Historical Echo describes a speaker's broader historical setting and source work. The current context schema does not establish the exact time, place, audience, or occasion of each quotation. Do not present that occasion as verified. Use [the research ledger](QUOTE_CONTEXT_RESEARCH.md) for evidence rules and current catalog coverage.

## Verification boundary

Updated on 2026-11-11 after the recommendation-state repair. Current local verification:

- `npm run test`: 50 tests passed, including duplicate commit, concurrent commit, Clear All epoch, migration fallback/recovery, v2 precedence, malformed snapshot, and stale request-lock coverage.
- `npx tsc --noEmit`: passed.
- iOS development build: native build succeeded and the iPhone 17 simulator loaded the current Metro bundle. Interactive tapping through Next, language/mood changes, Try Again, migration failure, and Clear All was not completed because macOS denied simulated keyboard input and no UI automation tool was installed.
- `npm run check`: tests and TypeScript passed; the final `expo-doctor` step exited because the temporary npx `expo-doctor` package could not resolve `@expo/env`. The project dependency tree does contain `@expo/env` through Expo packages.

This does not claim a TestFlight-device smoke test, dependency audit, or App Store submission check. Findings in the [August 2026 audit](problem.md) remain historical unless a dated follow-up below explicitly rechecks them.
