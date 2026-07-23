# Third-Party Content

## inBox Card

The Simplified Chinese quote catalog in `assets/quotes.zh-Hans.json` was
generated from the public inBox Card collection files associated with its open
random-note API.

- Website: https://card.gudong.site/
- API: https://card.gudong.site/api/random-note
- Per-record collection and source-file URLs:
  `data/quote-audit/chinese-provenance.json`

The provider describes the API as free, open, and requiring no authentication.
The source is maintained by an individual and does not provide the same level
of editorial or licensing assurance as a primary-source quotation archive.
Records should therefore remain subject to editorial review and removal
requests.

## Hitokoto

Hitokoto is not copied into the bundled ECHO catalog.

Its official documentation discourages repeatedly refreshing the random API to
crawl the database and directs bulk users to the public sentence package. That
package is distributed under AGPL, with a stated exception for use through the
provider's supplied remote links. ECHO currently remains offline-first and does
not copy that package into its MIT-licensed application bundle.

- API documentation: https://developer.hitokoto.cn/sentence/
- Sentence package and terms: https://sentences-bundle.hitokoto.cn/

## Japanese Wikiquote

The Japanese catalog in `assets/quotes.ja.json` is adapted from Japanese
Wikiquote's Japanese-person category.

- Source category: https://ja.wikiquote.org/wiki/カテゴリ:日本人
- Japanese Wikiquote copyright information:
  https://ja.wikiquote.org/wiki/Wikiquote:著作権
- Per-record page revision and attribution:
  `data/quote-audit/japanese-provenance.json`
- Catalog audit: `data/quote-audit/japanese-v1.1-report.json`

The adapted catalog and its metadata are distributed under Japanese
Wikiquote's CC BY-SA terms. Every bundled record keeps the page ID, revision
ID, and permanent revision URL needed for attribution and change tracking.
The application also exposes a **Settings → Content Sources** entry.

Wikiquote is collaboratively edited. Its license covers the collaborative
page content and selection; an underlying quotation can have separate
copyright considerations. Records remain subject to editorial review and
valid removal requests.

## Evaluated but not bundled for Japanese

Anime-chan's current public API returned English quote text, even when the
character and work were Japanese. Its free tier is also limited to five
requests per hour, so it was not used to manufacture a Japanese-language
offline catalog.

The tested Hitokoto/UApi saying endpoint returned Chinese text without the
author and work metadata required by ECHO's schema. Those responses were not
mislabelled as Japanese or added to `quotes.ja.json`.

- Anime-chan API documentation: https://animechan.io/docs
- Anime-chan terms: https://animechan.io/terms

## English Wikiquote

The expanded English catalog retains the controlled ECHO records and adds
revision-traceable records from English Wikiquote.

- Website: https://en.wikiquote.org/
- Per-record revisions: `data/quote-audit/english-provenance.json`
- License: CC BY-SA

## Chinese Wikiquote

inBox Card contains fewer than 2,000 unique records after normalization. The
remaining Simplified Chinese records are therefore supplied by Chinese
Wikiquote.

- Website: https://zh.wikiquote.org/
- inBox Card and Wikiquote provenance:
  `data/quote-audit/chinese-provenance.json`
- Wikiquote-derived records: CC BY-SA

For all Wikiquote catalogs, ECHO excludes disputed, misattributed, unsourced,
navigation-only, interview-question, and residual-markup records where those
markers can be detected automatically. Wikiquote remains collaboratively
edited, so the catalogs still require ongoing editorial review.
