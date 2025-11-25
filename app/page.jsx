import Link from 'next/link';
import { listTemplates } from '@/lib/templates';

export default function HomePage() {
  const templates = listTemplates();

  return (
    <section>
      <div className="seller-hero">
        <p className="btn secondary" style={{ width: 'fit-content' }}>
          {templates.length} seller template{templates.length === 1 ? '' : 's'}
        </p>
        <h1>Choose a seller template and generate a compliant PDF invoice.</h1>
        <p>
          Templates are stored in the <code>/templates</code> directory. Each template has a PDF
          background plus a JSON coordinate map that controls where invoice data is rendered.
        </p>
      </div>

      {templates.length ? (
        <div className="card-grid">
          {templates.map((template) => (
            <article key={template.id} className="card">
              <div>
                <h3>{template.seller}</h3>
                <p>{template.description}</p>
              </div>
              <div className="card__footer">
                <span>{Object.keys(template.fields).length} mapped fields</span>
                <Link className="btn" href={`/invoice/${template.id}`}>
                  Use template
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="status error">
          No templates found. Add PDF and JSON pairs under <code>/templates</code> to get started.
        </p>
      )}
    </section>
  );
}

