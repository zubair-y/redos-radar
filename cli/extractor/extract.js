import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

import { parse }            from '@babel/parser';
import traverseDefault       from '@babel/traverse';
import { globby }            from 'globby';

const traverse = traverseDefault.default ?? traverseDefault;   // CJS ↔ ESM safety

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const PACKAGES = ['express', 'koa', 'hapi', 'fastify', 'next'];

const EXTENSIONS = ['js', 'cjs', 'mjs', 'jsx', 'ts', 'tsx'];
const PATTERNS   = EXTENSIONS.map(ext => `**/*.${ext}`);

async function extractOne(pkg) {
  const baseDir = path.resolve(__dirname, `../data/${pkg}`);

  const files = await globby(PATTERNS, {
    cwd                 : baseDir,
    absolute            : true,
    followSymbolicLinks : false
  });

  console.log(`INFO  ${pkg}: found ${files.length} source files`);

  const regexes = [];

  for (const file of files) {
    if (/[\\/](?:test|tests|spec|bundle|\.next)[\\/]/i.test(file))
      continue;

    try {
      const code = fs.readFileSync(file, 'utf8');
      const ast  = parse(code, {
        sourceType: 'unambiguous',
        plugins   : ['typescript', 'jsx']
      });

      traverse(ast, {
        RegExpLiteral(p) {
          regexes.push({
            type   : 'literal',
            pattern: p.node.pattern,
            flags  : p.node.flags,
            file
          });
        },

        NewExpression(p) {
          if ((p.node.callee)?.name === 'RegExp') {
            const [src, flg] = p.node.arguments;
            if (src?.type === 'StringLiteral') {
              regexes.push({
                type   : 'new RegExp',
                pattern: src.value,
                flags  : flg?.type === 'StringLiteral' ? flg.value : '',
                file
              });
            }
          }
        }
      });
    } catch {
    }
  }

  fs.writeFileSync(
    path.resolve(__dirname, `../results/${pkg}.json`),
    JSON.stringify(regexes, null, 2)
  );
  console.log(`DONE  Extracted ${regexes.length} regexes from ${pkg}`);
}

export async function runAll() {
  for (const pkg of PACKAGES) await extractOne(pkg);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAll().catch(err => { console.error(err); process.exit(1); });
}
