// -------------------------------------------------------
// Reads detected/all.json and writes one-pattern-per-line
// to detected/allPatterns
// -------------------------------------------------------
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DETECTED_DIR = path.resolve(__dirname, "../detected");
const INPUT_FILE = path.join(DETECTED_DIR, "all.json");
const OUTPUT_FILE = path.join(DETECTED_DIR, "allPatterns");

// guard-rails --------------------------------------------------------
if (!fs.existsSync(INPUT_FILE)) {
  console.error(`Expected ${INPUT_FILE} — run detectAll first`);
  process.exit(1);
}

// crunch -------------------------------------------------------------
const records = JSON.parse(fs.readFileSync(INPUT_FILE, "utf8"));

const patternLines = Array.from(
  new Set(
    records
      .map(
        (r) =>
          r.pattern
            .replace(/\n/g, "\\n") // flatten multi-line regex literals
            .trim() // remove stray spaces
            .replace(/^["']|["']$/g, "") // strip accidental leading/trailing quotes
      )
      .filter((p) => p.length > 2) // skip trivial 1-char patterns
  )
).sort(); // deterministic output

fs.writeFileSync(OUTPUT_FILE, patternLines.join("\n"), "utf8");

console.log(`Wrote ${patternLines.length} unique patterns ➜ ${OUTPUT_FILE}`);
