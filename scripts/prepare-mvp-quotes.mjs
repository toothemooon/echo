import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const quotesPath = path.join(projectRoot, "assets", "quotes.json");
const auditDirectory = path.join(projectRoot, "data", "quote-audit");
const archivedQuotesPath = path.join(auditDirectory, "quotes-unverified.json");
const reportPath = path.join(auditDirectory, "mvp-audit-report.json");

const genericRoles = new Set([
  "writer",
  "author",
  "poet",
  "philosopher",
  "unknown",
]);

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[“”‘’'".,!?;:\s—–-]+/g, " ");
}

function assessQuote(quote, seenTexts) {
  const reasons = [];
  const author = String(quote.author ?? "").trim();
  const role = String(quote.role ?? "").trim();
  const text = String(quote.text ?? "").trim();
  const normalizedText = normalizeText(text);

  if (!author || /^unknown$/i.test(author)) reasons.push("unknown-author");
  if (!role) reasons.push("missing-role");
  if (genericRoles.has(role.toLowerCase())) reasons.push("generic-role");
  if (!text) reasons.push("missing-text");
  if (text.length > 320) reasons.push("long-text-needs-review");
  if (/[#@]|https?:\/\//i.test(text)) reasons.push("social-or-link-content");
  if (seenTexts.has(normalizedText)) reasons.push("duplicate-text");

  return { reasons, normalizedText };
}

const activeQuotes = JSON.parse(await readFile(quotesPath, "utf8"));
let previouslyArchivedQuotes = [];

try {
  previouslyArchivedQuotes = JSON.parse(
    await readFile(archivedQuotesPath, "utf8"),
  );
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

const originalQuotesById = new Map();

for (const quote of [...activeQuotes, ...previouslyArchivedQuotes]) {
  const { audit_reasons: _auditReasons, ...originalQuote } = quote;
  originalQuotesById.set(originalQuote.id, originalQuote);
}

const originalQuotes = [...originalQuotesById.values()].sort((a, b) =>
  String(a.id).localeCompare(String(b.id), undefined, { numeric: true }),
);
const publishedQuotes = [];
const archivedQuotes = [];
const seenTexts = new Set();

for (const quote of originalQuotes) {
  const { reasons, normalizedText } = assessQuote(quote, seenTexts);

  if (reasons.length === 0) {
    publishedQuotes.push(quote);
    seenTexts.add(normalizedText);
  } else {
    archivedQuotes.push({ ...quote, audit_reasons: reasons });
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  policyVersion: 1,
  originalCount: originalQuotes.length,
  publishedCount: publishedQuotes.length,
  archivedCount: archivedQuotes.length,
  publishedAuthorCount: new Set(publishedQuotes.map((quote) => quote.author)).size,
  publishedWithWorkSource: publishedQuotes.filter((quote) => quote.source).length,
  provenance: {
    sourceFile: "quotes_remaining_all.txt",
    dataset: "asuender/motivational-quotes",
    datasetUrl: "https://huggingface.co/datasets/asuender/motivational-quotes",
    sourceRows: 2259,
    uniqueMatchedQuoteRecords: 2258,
    note: "Dataset provenance is retained for internal audit only and is not displayed as a work-level quotation source.",
  },
  criteria: {
    archivedRoles: [...genericRoles],
    maximumTextLength: 320,
    archiveUnknownAuthors: true,
    archiveSocialTagsAndLinks: true,
    deduplicateNormalizedText: true,
  },
};

await mkdir(auditDirectory, { recursive: true });
await writeFile(quotesPath, `${JSON.stringify(publishedQuotes, null, 2)}\n`);
await writeFile(
  archivedQuotesPath,
  `${JSON.stringify(archivedQuotes, null, 2)}\n`,
);
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(JSON.stringify(report, null, 2));
