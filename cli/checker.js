import fs from 'fs';
import path from 'path';
import safe from 'safe-regex';

const filePath = path.resolve('detected', 'all.json');
const rawData = fs.readFileSync(filePath, 'utf-8');
const regexList = JSON.parse(rawData);

const results = [];

regexList.forEach((entry, index) => {
  const { pattern, flags = '', severity } = entry;
  let status = '';
  let error = '';

  try {
    const regex = new RegExp(pattern, flags);
    status = safe(regex) ? 'SAFE' : 'UNSAFE';
  } catch (err) {
    status = 'INVALID';
    error = err.message;
  }

  const result = {
    index: index + 1,
    pattern,
    flags,
    status,
    severity,
    ...(error && { error })
  };

  console.log(`[${result.index}] ${pattern}`);
  console.log(`    ➤ ${status} | Severity: ${severity}`);
  if (error) console.log(`Error: ${error}`);

  results.push(result);
});

const outputDir = path.resolve('results');
fs.mkdirSync(outputDir, { recursive: true });

const outputPath = path.join(outputDir, 'classified.json');
fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');

console.log(`\nResults saved to: ${outputPath}`);
