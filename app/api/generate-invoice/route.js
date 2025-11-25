import prisma from '@/lib/prisma';
import { generateInvoicePdfToFile } from '@/lib/pdf';
import { getTemplateById } from '@/lib/templates';
import path from 'path';
import fs from 'fs';

const requiredFields = ['seller', 'productName', 'quantity', 'priceGBP', 'date'];

export async function POST(request) {
  try {
    const payload = await request.json();
    console.log('[API] Received payload:', payload);

    const missing = requiredFields.filter(
      (field) => payload[field] === undefined || payload[field] === null || payload[field] === ''
    );
    if (missing.length) {
      return Response.json(
        { message: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    const quantity = Number(payload.quantity);
    const priceGBP = Number(payload.priceGBP);
    const postageGBP =
      payload.postageGBP === undefined || payload.postageGBP === null
        ? 0
        : Number(payload.postageGBP);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return Response.json({ message: 'Quantity must be a positive number.' }, { status: 400 });
    }
    if (!Number.isFinite(priceGBP) || priceGBP <= 0) {
      return Response.json({ message: 'Price must be a positive number.' }, { status: 400 });
    }
    if (!Number.isFinite(postageGBP) || postageGBP < 0) {
      return Response.json({ message: 'Postage must be zero or positive.' }, { status: 400 });
    }

    const template = getTemplateById(payload.seller);
    if (!template) {
      return Response.json({ message: 'Template not found.' }, { status: 404 });
    }

    const invoiceDate = new Date(payload.date);
    if (Number.isNaN(invoiceDate.getTime())) {
      return Response.json({ message: 'Invalid date supplied.' }, { status: 400 });
    }

    const lineTotal = quantity * priceGBP;
    const shipping = Number.isFinite(postageGBP) && postageGBP > 0 ? postageGBP : 0;

    const invoiceData = {
      seller: template.seller,
      productName: payload.productName,
      quantity,
      priceGBP,
      postageGBP: shipping,
      total: lineTotal + shipping,
      date: invoiceDate,
      invoiceNumber: payload.invoiceNumber || null,
      notes: payload.notes || null,
    };

    const record = await prisma.invoice.create({
      data: invoiceData,
    });

    // Define the output path for PDF
    const outputDir = path.join(process.cwd(), 'public', 'invoices');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const fileName = `invoice-${record.invoiceNumber || record.id}.pdf`;
    const outputPath = path.join(outputDir, fileName);

    // Generate PDF and save to file
    await generateInvoicePdfToFile({
      template,
      invoice: invoiceData,
      outputPath,
    });

    // Return a link to download the PDF
    return Response.json(
      { message: 'Invoice generated successfully.', pdfUrl: `/invoices/${fileName}` },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to generate invoice', error);
    return Response.json(
      { message: 'Unexpected error generating invoice.' },
      { status: 500 }
    );
  }
}
