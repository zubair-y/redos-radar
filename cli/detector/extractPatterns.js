import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DETECTED_DIR = path.resolve(__dirname, "../detected");
const INPUT_FILE = path.join(DETECTED_DIR, "all.json");
const OUTPUT_FILE = path.join(DETECTED_DIR, "allPatterns");

if (!fs.existsSync(INPUT_FILE)) {
  console.error(`Expected ${INPUT_FILE} — run detectAll first`);
  process.exit(1);
}

const records = JSON.parse(fs.readFileSync(INPUT_FILE, "utf8"));

const patternLines = Array.from(
  new Set(
    records
      .map((r) =>
        r.pattern
          .replace(/\n/g, "\\n")
          .trim()
          .replace(/^["']|["']$/g, "")
      )
      .filter((p) => p.length > 2)
  )
).sort();

fs.writeFileSync(OUTPUT_FILE, patternLines.join("\n"), "utf8");

console.log(`Wrote ${patternLines.length} unique patterns ➜ ${OUTPUT_FILE}`);
