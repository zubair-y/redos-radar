// crawler/download.ts
import pacote from 'pacote';
import path from 'path';
import fs from 'fs-extra';

const packages = ['express', 'koa', 'hapi', 'fastify', 'next'];

async function downloadAll() {
  for (const pkg of packages) {
    const dest = path.resolve(__dirname, `../data/${pkg}`);
    console.log(`⬇️ Downloading ${pkg}...`);
    await pacote.extract(`${pkg}@latest`, dest);
  }
  console.log('✅ Done downloading packages.');
}

downloadAll().catch(console.error);