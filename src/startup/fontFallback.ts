import type { QuoteFont } from "../storage/preferences";

type FontError = Error | null | undefined;

export function isFontReady(
  fontsLoaded: boolean,
  fontError: FontError,
): boolean {
  return fontsLoaded || fontError != null;
}

export function resolveRuntimeQuoteFont(
  preference: QuoteFont,
  fontError: FontError,
): QuoteFont {
  return fontError == null ? preference : "system";
}
