import { readFileSync } from "fs";
import { join } from "path";

const PATH = join(__dirname, "..", "DEFINING_MOMENTS.json");

type Entry = {
  author_ref: string;
  display_name: string;
  language: string;
  defining_moment: string | null;
  wiki_url: string | null;
};

const entries = JSON.parse(readFileSync(PATH, "utf-8")) as Entry[];

const withWiki = entries.filter((e) => e.wiki_url);
const withMoment = entries.filter((e) => e.defining_moment);
const pending = withWiki.filter((e) => !e.defining_moment);

console.log("=== Defining Moments Status ===\n");
console.log(`Total entries: ${entries.length}`);
console.log(`With Wikipedia page: ${withWiki.length}`);
console.log(`With defining_moment: ${withMoment.length}`);
console.log(`Pending generation: ${pending.length}\n`);

console.log("=== Authors Pending Generation (first 30) ===\n");
pending.slice(0, 30).forEach((e, i) => {
  console.log(`${i + 1}. ${e.display_name} (${e.language})`);
});
