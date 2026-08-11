import contextJson from "../../QUOTE_CONTEXTS.json";
import type { QuoteId, QuoteLanguage } from "./quotes";

export type BiographyContentStatus =
  | "catalog_identity_only"
  | "verified"
  | "wikipedia_lead"
  | "editorial_profile";

export type ContextSource = {
  title?: string;
  url?: string;
  note?: string;
  [key: string]: unknown;
};

export type AuthorContext = {
  author_ref: string;
  language: QuoteLanguage;
  author_id: string;
  display_name: string;
  known_role: string;
  canonical_person_id: string | null;
  lifespan: string | null;
  biography: string;
  biography_sources: ContextSource[];
  verification_status: string;
  biography_content_status: BiographyContentStatus;
};

// How much of the historical background could be assembled from verifiable
// sources. It never describes the occasion of the quotation itself, which no
// catalog record has verified.
export type HistoricalEchoStatus = "era_and_work" | "era_only" | "none";

export type QuoteContext = {
  quote_id: QuoteId;
  language: QuoteLanguage;
  author_ref: string;
  text_fingerprint: string;
  source_work: string | null;
  // Per-record provenance for the quotation itself. The per-context
  // verification flag that used to sit here read "pending" for every one of
  // the 4,283 records — every quotation comes from Wikiquote — so it and the
  // three fields that only restated it were dropped.
  context_sources: ContextSource[];
  historical_echo: string;
  historical_echo_sources: ContextSource[];
  historical_echo_status: HistoricalEchoStatus;
};

type QuoteContextDocument = {
  authors: AuthorContext[];
  quote_contexts: QuoteContext[];
};

const document = contextJson as QuoteContextDocument;

const authorsByRef = new Map(
  document.authors.map((author) => [author.author_ref, author]),
);

const contextsByQuoteId = new Map(
  document.quote_contexts.map((context) => [
    String(context.quote_id),
    context,
  ]),
);

// Author profiles are keyed independently of quote contexts so that a gap in
// the per-quote data cannot take the whole profile screen down with it.
export function getAuthorContext(
  language: QuoteLanguage,
  authorId: string,
): AuthorContext | undefined {
  return authorsByRef.get(`${language}:${authorId}`);
}

export function getQuoteContext(id: QuoteId):
  | {
      context: QuoteContext;
      author: AuthorContext | undefined;
    }
  | undefined {
  const context = contextsByQuoteId.get(String(id));

  if (!context) {
    return undefined;
  }

  return {
    context,
    author: authorsByRef.get(context.author_ref),
  };
}
