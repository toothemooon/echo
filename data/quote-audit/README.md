# ECHO quote audit

The TestFlight MVP publishes only records that currently meet the minimum
attribution and presentation policy implemented in
`scripts/prepare-mvp-quotes.mjs`.

- `assets/quotes.json` is the published, bundled collection.
- `quotes-unverified.json` preserves records excluded from the MVP.
- `mvp-audit-report.json` records counts, policy, and dataset provenance.
- `quotes_remaining_all.txt` is an internal dataset-provenance record. Its
  provider name must not be shown as a quotation's literary work source.

An archived quote may return to the published collection after its author
identity, wording, and—when available—work-level source have been verified.
Do not invent a book or work source to satisfy the schema.
