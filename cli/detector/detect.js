import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { dangerous, worstCaseTime } from "../analyser/runSafe.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Heuristics to flag risky constructs
const nestedQuantifier = /\(([^()]*?[+*])\)[+*?]/;
const dotStar = /(?<!\\)\.\*/;
const overlapAlternation = /(?:^|\|)([^\n|]{3,})(?:\|[^\n|]*\1|\1[^\n|]*\|)/;

// helper: skip vendored / compiled / tests
function skipVendored(filePath) {
  return (
    /[\\/]dist[\\/]compiled[\\/]/i.test(filePath) ||
    /[\\/]compiled[\\/]/i.test(filePath) ||
    /[\\/]vendor[\\/]/i.test(filePath) ||
    /[\\/]node_modules[\\/]/i.test(filePath) ||
    /[\\/]dist[\\/]((?!(lib)[\\/]).)*$/i.test(filePath)
  );
}

export async function detectAll() {
  const RESULTS_DIR = path.resolve(__dirname, "../results");
  const OUTPUT_DIR = path.resolve(__dirname, "../detected");

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const byKey = {};

  const register = (entry, issue) => {
    const key = `${entry.file}::${entry.pattern}::${entry.flags}`;
    if (!byKey[key]) {
      byKey[key] = { ...entry, issues: [issue], severity: "low" };
    } else if (!byKey[key].issues.includes(issue)) {
      byKey[key].issues.push(issue);
    }
  };

  // scan every results/<pkg>.json
  for (const file of fs.readdirSync(RESULTS_DIR)) {
    if (!file.endsWith(".json")) continue;
    const records = JSON.parse(
      fs.readFileSync(path.join(RESULTS_DIR, file), "utf8")
    );

    for (const rec of records) {
      if (skipVendored(rec.file)) continue;

      const base = { ...rec, source: file };

      if (nestedQuantifier.test(rec.pattern))
        register(base, "Nested quantifier");
      if (dotStar.test(rec.pattern)) register(base, "Greedy dot-star");
      if (overlapAlternation.test(rec.pattern))
        register(base, "Overlapping alternation");
    }
  }

  // compute severity & worst-case runtime
  for (const f of Object.values(byKey)) {
    const many = f.issues.length > 1;
    let sev = many
      ? "high"
      : f.issues[0] === "Greedy dot-star"
        ? "low"
        : "medium";

    if (dangerous(f.pattern, f.flags)) sev = "high";

    f.severity = sev;
    const t = worstCaseTime(f.pattern, f.flags);
    f.runtimeMs = t.ms;
    f.worstInput = t.inputLen;
  }

  // keep only medium / high severity
  const serious = Object.values(byKey).filter((f) => f.severity !== "low");

  // deduplicate duplicates CJS vs ESM
  const uniqMap = {};
  for (const rec of serious) {
    const sig = rec.pattern + "/" + rec.flags;
    uniqMap[sig] ??= rec;
  }
  const final = Object.values(uniqMap);

  // write to json
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "all.json"),
    JSON.stringify(final, null, 2)
  );
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "nested.json"),
    JSON.stringify(
      final.filter((f) => f.issues.includes("Nested quantifier")),
      null,
      2
    )
  );
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "dotstar.json"),
    JSON.stringify(
      final.filter((f) => f.issues.includes("Greedy dot-star")),
      null,
      2
    )
  );
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "overlap.json"),
    JSON.stringify(
      final.filter((f) => f.issues.includes("Overlapping alternation")),
      null,
      2
    )
  );

  // console summary
  const nestedCt = final.filter((f) =>
    f.issues.includes("Nested quantifier")
  ).length;
  const dotCt = final.filter((f) =>
    f.issues.includes("Greedy dot-star")
  ).length;
  const overlapCt = final.filter((f) =>
    f.issues.includes("Overlapping alternation")
  ).length;

  console.log(
    `Found ${nestedCt} nested, ${dotCt} dot-star and ${overlapCt} overlap issues (unique).`
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  detectAll().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
