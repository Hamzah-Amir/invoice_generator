import fs from 'fs';
import path from 'path';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/extractCoords.mjs <pdf-path>');
  process.exit(1);
}

const fullPath = path.isAbsolute(file) ? file : path.join(process.cwd(), file);

async function run() {
  const data = new Uint8Array(fs.readFileSync(fullPath));
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const page = await pdf.getPage(1);
  const content = await page.getTextContent();

  for (const item of content.items) {
    const [a, b, c, d, e, f] = item.transform;
    // transform gives text matrix; e,f are bottom-left positions
    console.log(`${item.str}\t->\tx:${e.toFixed(2)}\ty:${f.toFixed(2)}\tfontSize:${Math.sqrt(a * a + b * b).toFixed(2)}`);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

