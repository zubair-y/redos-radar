import fs from 'fs';
import path from 'path';

const RESULTS_DIR = path.resolve(__dirname, '../results');
const OUTPUT_DIR = path.resolve(__dirname, '../detected');
const NESTED_FILE = path.join(OUTPUT_DIR, 'nested.json');
const DOTSTAR_FILE = path.join(OUTPUT_DIR, 'dotstar.json');

const nestedQuantifierRegex = /\(([^()]*?[+*])\)[+*?]/;
const dotStarRegex = /(?<!\\)\.\*/;

const nested: any[] = [];
const dotstars: any[] = [];

function scoreRegex(pattern: string): 'low' | 'medium' | 'high' {
  const hasNested = nestedQuantifierRegex.test(pattern);
  const hasDotStar = dotStarRegex.test(pattern);
  const length = pattern.length;

  if (hasNested && hasDotStar) return 'high';
  if (hasNested || hasDotStar) return length > 30 ? 'medium' : 'low';
  return 'low';
}

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

fs.readdirSync(RESULTS_DIR).forEach((file) => {
  if (!file.endsWith('.json')) return;

  const fullPath = path.join(RESULTS_DIR, file);
  const regexList = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));

  for (const entry of regexList) {
    const pattern = entry.pattern;
    const severity = scoreRegex(pattern);

    const baseEntry = {
      ...entry,
      source: file,
      severity
    };

    if (nestedQuantifierRegex.test(pattern)) {
      nested.push({
        ...baseEntry,
        issue: 'Nested quantifier'
      });
    }

    if (dotStarRegex.test(pattern)) {
      dotstars.push({
        ...baseEntry,
        issue: 'Greedy dot-star'
      });
    }
  }
});

fs.writeFileSync(NESTED_FILE, JSON.stringify(nested, null, 2));
fs.writeFileSync(DOTSTAR_FILE, JSON.stringify(dotstars, null, 2));

console.log(`Found ${nested.length} nested quantifier regex(es).`);
console.log(`Found ${dotstars.length} greedy dot-star regex(es).`);
console.log(`Results saved to: ${NESTED_FILE} and ${DOTSTAR_FILE}`);
