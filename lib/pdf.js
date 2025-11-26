import fs from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const fontDirectory = path.join(process.cwd(), 'public', 'fonts');

const findCustomFont = () => {
  if (!fs.existsSync(fontDirectory)) return null;
  const fontFile = fs
    .readdirSync(fontDirectory)
    .find((file) => file.toLowerCase().endsWith('.ttf'));
  return fontFile ? path.join(fontDirectory, fontFile) : null;
};

const currencyKeys = new Set(['priceGBP', 'total', 'lineTotal', 'postageGBP']);

const formatFieldValue = (key, value) => {
  if (value === null || value === undefined) return '';
  if (currencyKeys.has(key)) {
    const numeric = Number(value);
    return `£${numeric.toFixed(2)}`;
  }
  if (key === 'date') {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('en-GB');
  }
  return String(value);
};

export const generateInvoicePdfToFile = async ({ template, invoice, outputPath }) => {
  const templateBytes = fs.readFileSync(template.pdfPath);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const [page] = pdfDoc.getPages();
  const pageWidth = page.getWidth();

  const customFontPath = findCustomFont();
  let font;
  if (customFontPath) {
    const fontBytes = fs.readFileSync(customFontPath);
    font = await pdfDoc.embedFont(fontBytes);
  } else {
    font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  }

  // STEP 1: Draw a large white rectangle covering the table area
  // const tableFields = ['quantity', 'productName', 'priceGBP', 'lineTotal', 'postageGBP'];
  // let minTableX = pageWidth, maxTableX = 0, minTableY = page.getHeight(), maxTableY = 0;

  // Object.entries(template.fields).forEach(([key, position]) => {
  //   if (tableFields.includes(key)) {
  //     const targets = Array.isArray(position) ? position : [position];
  //     targets.forEach(target => {
  //       minTableX = Math.min(minTableX, target.x);
  //       maxTableX = Math.max(maxTableX, target.x);
  //       minTableY = Math.min(minTableY, target.y);
  //       maxTableY = Math.max(maxTableY, target.y);
  //     });
  //   }
  // });

  // if (minTableX < pageWidth) {
  //   const tableRectX = Math.max(0, minTableX - 150);
  //   const tableRectY = minTableY - 120;
  //   const tableRectWidth = Math.min(pageWidth - tableRectX, maxTableX - minTableX + 350);
  //   const tableRectHeight = maxTableY - minTableY + 180;

  //   for (let i = 0; i < 2; i++) {
  //     page.drawRectangle({
  //       x: tableRectX,
  //       y: tableRectY,
  //       width: tableRectWidth,
  //       height: tableRectHeight,
  //       color: rgb(1, 1, 1),
  //       opacity: 1.0,
  //     });
  //   }
  // }

  // STEP 2: Prepare field data
  const fieldData = [];
  Object.entries(template.fields).forEach(([key, position]) => {
    let rawValue = invoice[key];
    let value;

    if (key === 'quantity') {
      const numValue = Number(rawValue);
      if (Number.isNaN(numValue) || numValue <= 0) return;
      value = String(numValue);
    } else {
      value = formatFieldValue(key, rawValue);
    }

    if (!value) return;

    const targets = Array.isArray(position) ? position : [position];
    targets.forEach(target => {
      fieldData.push({ key, value, target, fontSize: target.size || 12 });
    });
  });

  // STEP 3: Draw white rectangles per field
  fieldData.forEach(({ key, value, target, fontSize }) => {
    let rectWidth = 300, rectX = target.x - 50;
    const rectHeight = fontSize * 3.0;
    const rectY = target.y - fontSize * 1.0;

    if (key === 'productName') { rectWidth = 600; rectX = target.x - 100; }
    else if (key === 'quantity') { rectWidth = 100; rectX = target.x - 40; }
    else if (key === 'invoiceNumber') { rectWidth = 100; rectX = target.x; }
    else if (key === 'date') { rectWidth = 0; rectX = target.x + 5; }
    else if (key === 'lineAmount') { rectWidth = 0; rectX = target.x + 40; }
    else if (key === 'total') { rectWidth = 100; rectX = target.x; }
    else if (currencyKeys.has(key)) { rectWidth = 220; rectX = target.x; }

    page.drawRectangle({
      x: rectX, y: rectY, width: rectWidth, height: rectHeight,
      color: rgb(1, 1, 1), opacity: 1.0
    });
  });

  // STEP 4: Draw the text
  fieldData.forEach(({ key, value, target, fontSize }) => {
    page.drawText(value, {
      x: target.x,
      y: target.y,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
      opacity: 1.0,
    });
  });

  // STEP 5: Save PDF to file
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`[PDF] Invoice saved to: ${outputPath}`);
};
