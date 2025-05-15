import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import globby from 'globby';

const packages = ['express', 'koa', 'hapi', 'fastify', 'next'];

async function extractRegexes(pkgName: string) {
  const baseDir = path.resolve(__dirname, `../data/${pkgName}`);
  const files = await globby(`${baseDir}/**/*.{js,ts}`, { absolute: true });
  const regexes: any[] = [];

  for (const file of files) {
    try {
      const code = fs.readFileSync(file, 'utf-8');
      const ast = parse(code, {
        sourceType: 'unambiguous',
        plugins: ['typescript', 'jsx'],
      });

      traverse(ast, {
        RegExpLiteral(path) {
          regexes.push({
            type: 'literal',
            pattern: path.node.pattern,
            flags: path.node.flags,
            file,
          });
        },
        Literal(path) {
          const value = (path.node as any).regex;
          if (value) {
            regexes.push({
              type: 'literal-old',
              pattern: value.pattern,
              flags: value.flags,
              file,
            });
          }
        },
        NewExpression(path) {
          if ((path.node.callee as any).name === 'RegExp') {
            const args = path.node.arguments;
            if (args[0]?.type === 'StringLiteral') {
              regexes.push({
                type: 'new RegExp',
                pattern: (args[0] as any).value,
                flags: args[1]?.type === 'StringLiteral' ? (args[1] as any).value : '',
                file,
              });
            }
          }
        },
      });
    } catch {
      // skip unreadable files
    }
  }

  const output = path.resolve(__dirname, `../results/${pkgName}.json`);
  fs.writeFileSync(output, JSON.stringify(regexes, null, 2));
  console.log(`Extracted ${regexes.length} regexes from ${pkgName}`);
}

packages.forEach(extractRegexes);
