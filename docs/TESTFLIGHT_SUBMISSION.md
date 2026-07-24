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
three visual themes, typography controls, bookmarks, history, and shareable
quote cards and one optional daily local reminder. No account, subscription,
advertising, or payment is required. Notification permission is requested only
after the user accepts ECHO's in-app explanation or enables reminders in Settings.

## What to test

Please test first launch, quote navigation, category preferences,
Light/Dark/Archive themes, font and animation settings, bookmarks, history,
quote sharing, daily reminder permission and time selection, and persistence
after restarting the app. Please report
incorrect quote attribution, layout issues with long quotes, broken links, or
crashes.

## Beta review notes

ECHO does not require an account or demo credentials. All published quote
content is bundled with the app and can be used offline. Preferences and
bookmarks are stored locally on the device. The current build contains no ads,
in-app purchases, subscriptions, remote push notifications, widgets, or paywall.
The optional daily reminder is scheduled locally on the device and can be
disabled at any time in Settings. Internet
access occurs only when the user explicitly opens the privacy policy, terms,
email client, or an external sharing destination.

The Privacy Policy and Terms of Service links are available from Settings >
About. The Share App feature is intentionally hidden until a real App Store URL
exists.

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

- Cold launch and relaunch on a physical iPhone.
- Daily local reminder at each preset time, including permission denial and disable flows.
- Light, Dark, and Archive theme rendering.
- Font, size, animation, and preference persistence.
- Previous/next quote navigation and author rotation.
- Bookmark add/remove and History empty state.
- Share text, share image, and system share cancellation.
- Twitter destination and WhatsApp-not-installed behavior.
- Privacy Policy, Terms of Service, and feedback email links.
- Airplane-mode operation.
- Longest published quote and smallest supported screen.
- VoiceOver labels and Dynamic Type behavior where supported.

## Commands after Expo login

```sh
npx eas-cli login
npx eas-cli whoami
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios --profile production --latest
```

Do not paste an Expo password, Apple password, two-factor code, App Store
Connect API key, or recovery code into a chat. Complete authentication only in
the local terminal or the official Expo/Apple sign-in page.
