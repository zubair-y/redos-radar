import fs from "fs";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DETECTED = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../detected/all.json"), "utf8")
);

const byIssue = {
  "Nested quantifier": 0,
  "Greedy dot-star": 0,
  "Overlapping alternation": 0,
};
const bySev = { high: 0, medium: 0, low: 0 };
const pkgSet = new Set();
const pkgByIssue = {
  nested: new Set(),
  dotstar: new Set(),
  overlap: new Set(),
};

for (const rec of DETECTED) {
  rec.issues.forEach((i) => byIssue[i]++);
  bySev[rec.severity]++;

  const pkg = rec.source.replace(/\.json$/, "");
  pkgSet.add(pkg);
  if (rec.issues.includes("Nested quantifier")) pkgByIssue.nested.add(pkg);
  if (rec.issues.includes("Greedy dot-star")) pkgByIssue.dotstar.add(pkg);
  if (rec.issues.includes("Overlapping alternation"))
    pkgByIssue.overlap.add(pkg);
}

const metrics = {
  scannedPkgs: pkgSet.size,
  uniquePatternsFlagged: DETECTED.length,
  patternsPerIssue: byIssue,
  severityHistogram: bySev,
  packagePrevalence: {
    nested: pkgByIssue.nested.size,
    dotstar: pkgByIssue.dotstar.size,
    overlap: pkgByIssue.overlap.size,
  },
};

const METRICS_DIR = path.resolve(__dirname, "../metrics");
fs.mkdirSync(METRICS_DIR, { recursive: true });
fs.writeFileSync(
  path.join(METRICS_DIR, "metrics.json"),
  JSON.stringify(metrics, null, 2)
);

console.log("Metrics written to metrics/metrics.json");
