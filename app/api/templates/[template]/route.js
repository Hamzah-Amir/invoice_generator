import fs from 'fs';
import { getTemplateById } from '@/lib/templates';

export async function GET(request, { params }) {
  const { template } = params;
  const searchParams = new URL(request.url).searchParams;
  const format = searchParams.get('format');

  const templateConfig = getTemplateById(template);
  if (!templateConfig) {
    return Response.json({ message: 'Template not found.' }, { status: 404 });
  }

  if (format === 'json') {
    return Response.json(templateConfig);
  }

  const bytes = fs.readFileSync(templateConfig.pdfPath);
  return new Response(bytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename=${template}.pdf`,
    },
  });
}

