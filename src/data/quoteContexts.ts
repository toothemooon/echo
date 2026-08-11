import contextJson from "../../QUOTE_CONTEXTS.json";
import type { QuoteId, QuoteLanguage } from "./quotes";

export type BiographyContentStatus =
  | "catalog_identity_only"
  | "verified"
  | "editorial_profile";
export type ContextContentStatus =
  | "attribution_only"
  | "secondary_only"
  | "source_only"
  | "verified";
export type ContextVerificationStatus =
  | "pending"
  | "verified"
  | "needs_context"
  | "unverified"
  | "disputed"
  | "verified_composite";

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
  editorial_note: string;
  editorial_note_kind?: "interpretive_commentary";
  biography_content_status: BiographyContentStatus;
};

export type QuoteContext = {
  quote_id: QuoteId;
  language: QuoteLanguage;
  author_ref: string;
  text_fingerprint: string;
  source_work: string | null;
  context_summary: string;
  context_type: string;
  context_sources: ContextSource[];
  verification_status: ContextVerificationStatus;
  editorial_note: string;
  editorial_note_kind?: "interpretive_commentary";
  context_content_status: ContextContentStatus;
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
