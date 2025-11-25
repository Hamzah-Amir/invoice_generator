const fs = require('fs');
const path = require('path');

const outDir = path.join(process.cwd(), 'templates');
fs.mkdirSync(outDir, { recursive: true });

const createPdf = (title, filename) => {
  const streamContent = `BT /F1 24 Tf 72 720 Td (${title}) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Count 1 /Kids [3 0 R] >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = ['0000000000 65535 f \n'];

  objects.forEach((object, index) => {
    offsets.push(String(pdf.length).padStart(10, '0') + ' 00000 n \n');
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += 'xref\n';
  pdf += `0 ${objects.length + 1}\n`;
  pdf += offsets.join('');
  pdf += 'trailer\n';
  pdf += `<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += 'startxref\n';
  pdf += `${xrefOffset}\n`;
  pdf += '%%EOF';

  fs.writeFileSync(path.join(outDir, filename), pdf);
};

createPdf('Template 1 Preview', 'template1.pdf');
createPdf('Template 2 Preview', 'template2.pdf');

