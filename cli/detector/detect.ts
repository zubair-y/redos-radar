import fs from 'fs';
import path from 'path';

const RESULTS_DIR = path.resolve(__dirname, '../results');
const OUTPUT_FILE = path.resolve(__dirname, 'detected', 'nested.json');

// Detect nested quantifiers like (a+)* or (.*)+
const nestedQuantifierRegex = /\(([^()]*?[+*])\)[+*?]/;

const detected: any[] = [];

fs.readdirSync(RESULTS_DIR).forEach((file) => {
  if (!file.endsWith('.json')) return;

  const fullPath = path.join(RESULTS_DIR, file);
  const regexList = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));

  for (const entry of regexList) {
    try {
      const pattern = entry.pattern;
      if (nestedQuantifierRegex.test(pattern)) {
        detected.push({
          ...entry,
          source: file,
          issue: 'Nested quantifier'
        });
      }
    } catch (e) {
      console.warn(`Error parsing pattern in ${file}:`, e);
    }
  }
});

if (!fs.existsSync(path.dirname(OUTPUT_FILE))) {
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(detected, null, 2));
console.log(`Found ${detected.length} regex(es) with nested quantifiers.`);
console.log(`Results saved to: ${OUTPUT_FILE}`);
