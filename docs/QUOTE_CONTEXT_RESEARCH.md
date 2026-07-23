# Quote Context Research Ledger

This ledger records browser-based verification work for `QUOTE_CONTEXTS.json`.
It is not a substitute for the source objects stored on each author or quote
record.

## Decision rules

1. Generate an exact-phrase query from the quote’s most distinctive wording,
   combined with the attributed author and any known work.
2. Prefer primary texts, official archives, collected papers, speech
   transcripts, Google Books bibliographic records, and scholarly editions.
3. Use Wikiquote and quotation databases only to discover candidate sources.
4. Do not treat search-result or AI-generated summaries as evidence.
5. Assign:
   - `verified` only when a primary location is identified;
   - `needs_context` when the primary location is known but the immediate
     occasion is not;
   - `unverified` when only secondary circulation can be found;
   - `disputed` when reliable research rejects or conflicts with the catalog
     attribution.

## Progress

Initial catalog state:

- 1,253 author records with no verified biographies.
- 5,999 pending quote contexts and one verified composite context.

Browser research completed in the first evidence-graded batch:

| Record | Result | Principal evidence |
| --- | --- | --- |
| A.A. Milne biography | verified | Encyclopaedia Britannica |
| Abigail Adams biography | verified | Encyclopaedia Britannica |
| Aesop biography | verified with historical uncertainty | Encyclopaedia Britannica |
| Albert Einstein biography | verified | Encyclopaedia Britannica |
| Quote 156, Piglet / gratitude | unverified | Scholastic secondary attribution; no primary location found |
| Quote 18, difficulty / opportunity | disputed | Quote Investigator; wording traced to John Archibald Wheeler |
| Quote 76, look deep into nature | unverified | Today in Science History explicitly reports no primary source |

The next research pass should resume with quote 140 (Abigail Adams) and quote
151 (Aesop), followed by the remaining English `attribution_only` records.

