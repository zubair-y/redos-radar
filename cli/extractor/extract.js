import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { parse } from "@babel/parser";
import traverseDefault from "@babel/traverse";
import { globby } from "globby";
import fsExtra from "fs-extra";

const traverse = traverseDefault.default ?? traverseDefault;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

fsExtra.ensureDirSync(path.resolve(__dirname, "../results"));

const PACKAGES = [
  "semver",
  "ansi-styles",
  "debug",
  "chalk",
  "supports-color",
  "minimatch",
  "ms",
  "tslib",
  "strip-ansi",
  "ansi-regex",
  "has-flag",
  "color-convert",
  "color-name",
  "lru-cache",
  "type-fest",
  "string-width",
  "source-map",
  "commander",
  "brace-expansion",
  "glob",
  "wrap-ansi",
  "readable-stream",
  "emoji-regex",
  "escape-string-regexp",
  "find-up",
  "locate-path",
  "p-locate",
  "p-limit",
  "@types/node",
  "uuid",
  "yallist",
  "safe-buffer",
  "minipass",
  "ajv",
  "react-is",
  "is-fullwidth-code-point",
  "glob-parent",
  "globals",
  "string_decoder",
  "json-schema-traverse",
  "validator",
  "moment",
  "moment-timezone",
  "path-to-regexp",
  "is-glob",
  "micromatch",
  "regexpp",
  "regexpu-core",
  "xregexp",
  "ip-regex",
  "ua-parser-js",
  "tough-cookie",
  "browserslist",
  "postcss",
];

// we consider only human written files
const EXTENSIONS = ["js", "cjs", "mjs", "jsx", "ts", "tsx"];
const PATTERNS = EXTENSIONS.map((ext) => `**/*.${ext}`);

// skip vendored / generated / test blobs
const SKIP_PATH_RE = new RegExp(
  [
    String.raw`[\\/]dist[\\/]compiled[\\/]`,
    String.raw`[\\/]compiled[\\/]`,
    String.raw`[\\/]vendor[\\/]`,
    String.raw`[\\/]third[-_]party[\\/]`,
    String.raw`[\\/]node_modules[\\/]`,
    String.raw`[\\/]dist[\\/]((?!(lib)[\\/]).)*$`,
    String.raw`[\\/](?:test|tests|spec|bundle|\.next)[\\/]`,
  ].join("|"),
  "i"
);

async function extractOne(pkg) {
  const baseDir = path.resolve(__dirname, `../data/${pkg}`);

  const files = await globby(PATTERNS, {
    cwd: baseDir,
    absolute: true,
    followSymbolicLinks: false,
  });

  console.log(`INFO  ${pkg}: found ${files.length} candidate source files`);

  const regexes = [];

  for (const file of files) {
    if (SKIP_PATH_RE.test(file)) continue;

    try {
      const code = fs.readFileSync(file, "utf8");
      const ast = parse(code, {
        sourceType: "unambiguous",
        plugins: ["typescript", "jsx"],
      });

      traverse(ast, {
        RegExpLiteral(p) {
          regexes.push({
            type: "literal",
            pattern: p.node.pattern,
            flags: p.node.flags,
            file,
          });
        },
        NewExpression(p) {
          if (p.node.callee?.name === "RegExp") {
            const [src, flg] = p.node.arguments;
            if (src?.type === "StringLiteral") {
              regexes.push({
                type: "new RegExp",
                pattern: src.value,
                flags: flg?.type === "StringLiteral" ? flg.value : "",
                file,
              });
            }
          }
        },
      });
    } catch {}
  }

  const safeName = pkg.replace(/[@/]/g, "_");
  const outFile = path.resolve(__dirname, `../results/${safeName}.json`);

  fs.writeFileSync(outFile, JSON.stringify(regexes, null, 2));
  console.log(`DONE  Extracted ${regexes.length} regexes from ${pkg}`);
}

export async function extractAll() {
  for (const pkg of PACKAGES) await extractOne(pkg);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  extractAll().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
