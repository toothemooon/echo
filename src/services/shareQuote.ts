import type { Quote } from "../data/quotes";

const SHARE_SIGNATURE = "Shared from Echo";

export function formatQuoteShareText(quote: Quote): string {
  return `"${quote.text.trim()}"\n— ${quote.author.trim()}\n\n${SHARE_SIGNATURE}`;
}

export function buildTwitterShareUrl(quote: Quote): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    formatQuoteShareText(quote),
  )}`;
}

export function buildWhatsAppShareUrl(quote: Quote): string {
  return `whatsapp://send?text=${encodeURIComponent(
    formatQuoteShareText(quote),
  )}`;
}
