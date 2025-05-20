import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

import { parse }            from '@babel/parser';
import traverseDefault       from '@babel/traverse';
import { globby }            from 'globby';

const traverse = traverseDefault.default ?? traverseDefault;   // CJS ↔ ESM safety

/* ------------------------------------------------------------------ */
/*  resolve __dirname in pure-ESM                                      */
/* ------------------------------------------------------------------ */
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

/* packages to analyse ---------------------------------------------- */
const PACKAGES = ['express', 'koa', 'hapi', 'fastify', 'next'];

/* list of glob patterns we want to search for ---------------------- */
const EXTENSIONS = ['js', 'cjs', 'mjs', 'jsx', 'ts', 'tsx'];
const PATTERNS   = EXTENSIONS.map(ext => `**/*.${ext}`);

/* helper: extract regexes from one package ------------------------- */
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
    // discard tests, bundles, minified or build artefacts
    if (/[\\/](?:test|tests|spec|dist|bundle|build|\.next)[\\/]/i.test(file))
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
      /* ignore parse failures (exotic syntax, decorators, etc.) */
    }
  }

  fs.writeFileSync(
    path.resolve(__dirname, `../results/${pkg}.json`),
    JSON.stringify(regexes, null, 2)
  );
  console.log(`DONE  Extracted ${regexes.length} regexes from ${pkg}`);
}

/* orchestrator ----------------------------------------------------- */
export async function runAll() {
  for (const pkg of PACKAGES) await extractOne(pkg);
}

/* run if invoked directly ----------------------------------------- */
if (import.meta.url === `file://${process.argv[1]}`) {
  runAll().catch(err => { console.error(err); process.exit(1); });
}
