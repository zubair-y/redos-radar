import { downloadAll } from './crawler/download';
import { extractAll }  from './extractor/extract';
import { detectAll }   from './detector/detect';

async function main() {
  await downloadAll();
  await extractAll();
  await detectAll();
  console.log('Full scan complete.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
