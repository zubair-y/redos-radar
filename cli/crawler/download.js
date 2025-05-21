import fs from "fs-extra";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import pacote from "pacote";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PACKAGES = ["express", "koa", "hapi", "fastify", "next"];

async function grab(pkg) {
  const dest = path.resolve(__dirname, `../data/${pkg}`);

  if (await fs.pathExists(dest)) {
    console.log(`${pkg} already present – skipping`);
    return;
  }

  console.log(`Downloading ${pkg} ...`);
  await pacote.extract(pkg, dest);
  console.log(`Done downloading ${pkg}.`);
}

export async function downloadAll() {
  for (const pkg of PACKAGES) {
    await grab(pkg);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAll().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
