import fs from "fs-extra";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import pacote from "pacote";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

// fetch & unpack one package into  data/<pkg>
async function grab(pkg) {
  const dest = path.resolve(__dirname, `../data/${pkg}`);

  if (await fs.pathExists(dest)) {
    console.log(`${pkg} already present – skipping`);
    return;
  }

  console.log(`Downloading ${pkg} …`);
  await pacote.extract(pkg, dest);
  console.log(`Done downloading ${pkg}.`);
}

export async function downloadAll() {
  for (const pkg of PACKAGES) await grab(pkg);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  downloadAll().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
