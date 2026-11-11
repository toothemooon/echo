# ECHO TestFlight and App Review preparation

> Reviewed against the repository on 2026-11-11. This is a preparation sheet, not evidence that a build has been uploaded, is available in TestFlight, or has been submitted for review. Confirm external values in App Store Connect and EAS before using this copy.

## Repository-backed build facts

| Field | Current value | Source / note |
| --- | --- | --- |
| App name | ECHO | `app.json` |
| Marketing version | `1.0.2` | `app.json` and `package.json` |
| iOS bundle ID | `yachts.sarada.echo` | `app.json` |
| Checked-in iOS build number | `7` | `app.json`; EAS uses remote app versioning and auto-increment, so confirm the actual build |
| EAS project ID | `31027af5-fe6e-41bf-9cee-23204247f355` | `app.json` |
| Production build profile | `production` | `eas.json`; channel `production`, auto-increment enabled |
| Submit profile | Incomplete in this repo | `eas.json` has an empty `submit.production` object; confirm or configure App Store Connect submission details |

The App Store Connect app record, SKU, category, screenshots, copyright, review contact, selected build, and current review status are external state. Verify them in App Store Connect instead of copying values from the archived 1.0.0 notes.

## Draft beta description

ECHO is an offline-first quote-reading app in English, Simplified Chinese, and Japanese. Choose a reading mood to guide quote recommendations, then save, revisit, or share quotes. Light, Dark, and Archive themes, typography settings, and reading history let you shape a quiet daily reading experience.

Quote text and author materials are bundled with the app. Author profiles include sourced biographical notes and a historical echo about the speaker's wider time and work. This context does not claim to verify the specific occasion on which a quotation was said. Reading and saved content remain available offline.

## Local catalog snapshot

These counts match the data files in the current local workspace. The files are not present in a clean Git clone unless supplied separately.

| Language | Quotes | Language-scoped authors |
| --- | ---: | ---: |
| English | 1,282 | 206 |
| Simplified Chinese | 823 | 445 |
| Japanese | 1,820 | 301 |
| **Total** | **3,925** | **952** |

The app's content-source screen identifies Wikiquote, Wikipedia, Wikidata, and CC BY-SA material. Review the packaged attribution and the current license/source documents before submission.

## Draft beta review notes

ECHO does not require an account or demo credentials. Quote reading, recommendations, preferences, saved quotes, and reading history use data bundled with or stored locally by the app and are available offline. The app also configures Expo Updates and provides links to external policy, terms, and content-source pages; do not describe the entire binary as making no network requests. There is no account, cloud-sync, advertising, subscription, or in-app purchase flow in the current app.

The repository does not establish the current App Store Connect privacy answers or the behavior of the build selected for review. Confirm the binary's SDKs, update configuration, data practices, privacy labels, and reviewer notes for that exact build before submission.

## TestFlight test checklist

- [ ] Fresh install, first-launch mood selection, and relaunch
- [ ] Next/previous navigation and category preference changes
- [ ] English, Simplified Chinese, and Japanese content selection
- [ ] Light, Dark, and Archive themes; app icon synchronization where supported
- [ ] Font, size, animation, and high-contrast settings
- [ ] Save/remove a quote; confirm favorites survive relaunch
- [ ] Reading history, history clearing, and Clear All Data confirmation
- [ ] Share quote text and image; cancel the system share sheet
- [ ] Open a quote's author profile and review biography, historical echo, and source display
- [ ] Airplane-mode reading, recommendations, saved quotes, and history
- [ ] Long quotes on the smallest supported iPhone size
- [ ] VoiceOver labels, focus order, and larger system text
- [ ] Privacy, terms, and content-source links; feedback behavior when no mail app is configured

Record the device model, iOS version, app version, and actual build number with each issue. Do not treat this checklist as completed until a tester has run it on the selected TestFlight build.

## Build and submit commands

After confirming the local runtime data files are present and authenticating with the official Expo/Apple flows:

```sh
npx eas-cli whoami
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios --profile production --latest
```

Before submitting, confirm the EAS build completed, its marketing version/build number match the intended App Store Connect version, and the correct build is selected for TestFlight review. The current `submit.production` profile does not specify an `ascAppId`; EAS may require interactive app selection or a repository configuration update.

Never paste Expo or Apple passwords, two-factor codes, App Store Connect API keys, or recovery codes into project documentation or chat.
