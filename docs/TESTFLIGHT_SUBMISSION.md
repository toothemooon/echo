# ECHO TestFlight submission

## App Store Connect record

- App name: `ECHO`
- Primary language: English (U.S.)
- Bundle ID: `yachts.sarada.echo`
- SKU: `echo-ios-2026`
- Version: `1.0.0`
- Primary category: Lifestyle
- Privacy policy URL: `https://sarada.yachts/projects/echo/privacy`
- Support URL: `https://sarada.yachts/projects/echo`
- Marketing URL: `https://sarada.yachts/projects/echo`
- Feedback email: `abc510433622@gmail.com`

## Beta app description

ECHO is an offline-first daily quote experience with personalized categories,
three visual themes, typography controls, bookmarks, persistent reading history,
and shareable quote cards. No account, subscription, advertising, or payment is
required. Core browsing, favorites, history, preferences, themes, and sharing
work without an internet connection.

### New Features (v1.1)

- **Historical Echo**: Each quote now includes a "Defining Moment" section
  that provides a dramatic, single historical event related to the author.
  This content is generated using AI and stored locally.

### Content Statistics

| Language | Quotes | Authors |
|----------|--------|---------|
| English | 1,305 | 211 |
| Simplified Chinese | 831 | 485 |
| Japanese | 1,853 | 322 |
| **Total** | **3,989** | **1,018** |

## What to test

Please test first launch, quote navigation, category preferences,
Light/Dark/Archive themes, font and animation settings, bookmarks, history,
quote sharing, clear-data confirmation, and persistence after restarting the
app. Please also test the new "Historical Echo" feature by clicking on author
names.

Please report:
- Incorrect quote attribution
- Layout issues with long quotes
- Broken links or crashes
- Issues with Historical Echo content

## Beta review notes

ECHO does not require an account or demo credentials. All published quote
content is bundled with the app and can be used offline. Preferences and
bookmarks are stored locally on the device. The current build contains no ads,
in-app purchases, subscriptions, remote push notifications, widgets, or paywall.
Internet access occurs only when the user explicitly opens the privacy policy,
terms, content-source page, email client, or an external sharing destination.

The Privacy Policy, Terms of Service, Content Sources, Share App, and Feedback
entries are available from Settings. Rate App is hidden until a real App Store
ID exists.

## App privacy answers

Based on the current code and dependencies:

- Data collection: No, the developer and included SDKs do not collect data
  from the app.
- Tracking: No.
- Account creation: None.
- Analytics or advertising SDK: None.

Recheck these answers before every submission if analytics, crash reporting,
cloud sync, accounts, advertising, or another third-party SDK is added.

## Internal testing checklist

- [ ] Cold launch and relaunch on a physical iPhone
- [ ] Clear All Data confirmation and reset of local preferences, favorites, history,
  and onboarding state
- [ ] Light, Dark, and Archive theme rendering
- [ ] Font, size, animation, and preference persistence
- [ ] Previous/next quote navigation and author rotation
- [ ] Bookmark add/remove and History empty state
- [ ] Share text, share image, and system share cancellation
- [ ] Privacy Policy, Terms of Service, Content Sources, Share App, and feedback links
- [ ] Airplane-mode operation
- [ ] Longest published quote and smallest supported screen
- [ ] VoiceOver labels and Dynamic Type behavior where supported
- [ ] Historical Echo content display (click on author names)
- [ ] Historical Echo content accuracy and language matching

## Commands after Expo login

```sh
npx eas-cli login
npx eas-cli whoami
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios --profile production --latest
```

Before submission, replace the external placeholders with the final App Store
Connect screenshots, metadata, privacy answers, copyright confirmation, and
review contact details. The local checks cannot submit a build or change App
Store Connect state on their own.

Do not paste an Expo password, Apple password, two-factor code, App Store
Connect API key, or recovery code into a chat. Complete authentication only in
the local terminal or the official Expo/Apple sign-in page.
