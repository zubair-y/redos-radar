import { downloadAll } from "./crawler/download.js";
import { extractAll } from "./extractor/extract.js";
import { detectAll } from "./detector/detect.js";

async function main() {
  await downloadAll();
  await extractAll();
  await detectAll();
  console.log("Full scan complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
