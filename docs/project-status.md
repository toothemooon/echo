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

## Network and historical context

The quote-reading path uses bundled content and remains available offline. That does not mean every app operation is network-free: `app.json` configures Expo Updates, and Settings exposes external policy, terms, and source links.

`src/services/wikipedia.ts` and `src/services/definingMoment.ts` contain Wikipedia/OpenAI request code, but the current app entry and screens do not call those services. The current quote-context screen reads bundled `QUOTE_CONTEXTS.json`. Do not describe Defining Moment generation as an active app feature. If the dormant service is ever connected, its client-side API-key storage and network behavior need a new security and privacy review.

Historical Echo describes a speaker's broader historical setting and source work. The current context schema does not establish the exact time, place, audience, or occasion of each quotation. Do not present that occasion as verified. Use [the research ledger](QUOTE_CONTEXT_RESEARCH.md) for evidence rules and current catalog coverage.

## Verification boundary

This status page was prepared by reading the current configuration, source, and local data files. It does not claim a fresh app build, device smoke test, Expo Doctor run, dependency audit, or App Store submission check. The results listed in the [August 2026 audit](problem.md) are historical unless they are explicitly reconfirmed in current source.
