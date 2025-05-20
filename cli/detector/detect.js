import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { dangerous, worstCaseTime } from '../analyser/runSafe.js';

/* -------------------------------------------------- helpers for ESM */
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

/* ----------------------------- regex heuristics */
const nestedQuantifier = /\(([^()]*?[+*])\)[+*?]/;
const dotStar          = /(?<!\\)\.\*/;
const overlapAlternation = /^\^?(?:\(\?:)?([^\n|]{3,})\|[^\n|]*\1/;

/* -------------------------------------------------- main routine */
export async function detectAll() {
  const RESULTS_DIR = path.resolve(__dirname, '../results');
  const OUTPUT_DIR  = path.resolve(__dirname, '../detected');

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  /** keyed by `${file}::${pattern}::${flags}` */
  const byKey = {};

  const register = (entry, issue) => {
    const key = `${entry.file}::${entry.pattern}::${entry.flags}`;
    if (!byKey[key]) {
      byKey[key] = { ...entry, issues: [issue], severity: 'low' };
    } else if (!byKey[key].issues.includes(issue)) {
      byKey[key].issues.push(issue);
    }
  };

  /* -------------- walk every extracted-regex JSON */
  for (const file of fs.readdirSync(RESULTS_DIR)) {
    if (!file.endsWith('.json')) continue;
    const records = JSON.parse(
      fs.readFileSync(path.join(RESULTS_DIR, file), 'utf8')
    );

    for (const rec of records) {
      const base = { ...rec, source: file };

      if (nestedQuantifier.test(rec.pattern))  register(base, 'Nested quantifier');
      if (dotStar.test(rec.pattern))           register(base, 'Greedy dot-star');
      if (overlapAlternation.test(rec.pattern)) register(base, 'Overlapping alternation');
    }
  }

  /* -------------- severity + safe-regex runtime estimate */
  for (const f of Object.values(byKey)) {
    const count = f.issues.length;
    let sev =
      count > 1                     ? 'high'   :
      f.issues[0] === 'Greedy dot-star' ? 'low'    :
      'medium';

    if (dangerous(f.pattern, f.flags)) sev = 'high';

    f.severity  = sev;
    f.runtimeMs = worstCaseTime(f.pattern, f.flags);
  }

  /* -------------- write outputs */
  const all = Object.values(byKey);

  fs.writeFileSync(path.join(OUTPUT_DIR, 'all.json'),      JSON.stringify(all, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'nested.json'),   JSON.stringify(all.filter(f => f.issues.includes('Nested quantifier')), null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'dotstar.json'),  JSON.stringify(all.filter(f => f.issues.includes('Greedy dot-star')),   null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'overlap.json'),  JSON.stringify(all.filter(f => f.issues.includes('Overlapping alternation')), null, 2));

  const nestedCt  = all.filter(f => f.issues.includes('Nested quantifier')).length;
  const dotCt     = all.filter(f => f.issues.includes('Greedy dot-star')).length;
  const overlapCt = all.filter(f => f.issues.includes('Overlapping alternation')).length;

  console.log(`Found ${nestedCt} nested, ${dotCt} dot-star and ${overlapCt} overlap issues (deduped).`);
}

/* run when invoked directly */
if (import.meta.url === `file://${process.argv[1]}`) {
  detectAll().catch(err => { console.error(err); process.exit(1); });
}
