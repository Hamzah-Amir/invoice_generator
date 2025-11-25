import fs from 'fs';
import path from 'path';

const templatesDir = path.join(process.cwd(), 'templates');

const ensureFields = (templateJson = {}) => {
  if (templateJson.fields) {
    return templateJson.fields;
  }
  const fields = { ...templateJson };
  delete fields.seller;
  delete fields.description;
  delete fields.notesPlaceholder;
  return fields;
};

export const listTemplates = () => {
  if (!fs.existsSync(templatesDir)) {
    return [];
  }

  return fs
    .readdirSync(templatesDir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => {
      const id = path.basename(file, '.json');
      const json = JSON.parse(
        fs.readFileSync(path.join(templatesDir, file), 'utf-8')
      );
      return {
        id,
        seller: json.seller || id,
        description: json.description || 'Standard invoice layout',
        fields: ensureFields(json),
      };
    })
    .sort((a, b) => a.seller.localeCompare(b.seller));
};

export const getTemplateById = (id) => {
  try {
    const jsonPath = path.join(templatesDir, `${id}.json`);
    const pdfPath = path.join(templatesDir, `${id}.pdf`);
    if (!fs.existsSync(jsonPath) || !fs.existsSync(pdfPath)) {
      return null;
    }

    const json = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    return {
      id,
      seller: json.seller || id,
      description: json.description || 'Standard invoice layout',
      fields: ensureFields(json),
      pdfPath,
      jsonPath,
    };
  } catch (error) {
    console.error('Failed to load template', id, error);
    return null;
  }
};

export const templatePdfPath = (id) =>
  path.join(templatesDir, `${id}.pdf`);

