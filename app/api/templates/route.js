import { listTemplates } from '@/lib/templates';

export async function GET() {
  const templates = listTemplates().map((template) => ({
    id: template.id,
    seller: template.seller,
    description: template.description,
    fieldCount: Object.keys(template.fields).length,
  }));

  return Response.json({ templates });
}

