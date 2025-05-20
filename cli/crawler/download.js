import fs from 'fs-extra';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import pacote from 'pacote';

/* resolve __dirname in ESM ----------------------------------------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

/* which packages to fetch ------------------------------------------ */
const PACKAGES = ['express', 'koa', 'hapi', 'fastify', 'next'];

/* download & unpack one package ------------------------------------ */
async function grab(pkg) {
  const dest = path.resolve(__dirname, `../data/${pkg}`);

  if (await fs.pathExists(dest)) {
    console.log(`${pkg} already present – skipping`);
    return;
  }

  console.log(`Downloading ${pkg} ...`);
  await pacote.extract(pkg, dest);       // approx. “npm pack && tar -x”
  console.log(`Done downloading ${pkg}.`);
}

/* orchestrator ----------------------------------------------------- */
export async function runAll() {
  for (const pkg of PACKAGES) {
    await grab(pkg);
  }
}

/* run if invoked directly ----------------------------------------- */
if (import.meta.url === `file://${process.argv[1]}`) {
  runAll().catch(err => { console.error(err); process.exit(1); });
}
