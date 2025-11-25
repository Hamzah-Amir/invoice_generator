import CalibrateTool from '@/components/CalibrateTool';
import { listTemplates } from '@/lib/templates';

export default function CalibratePage() {
  const templates = listTemplates();

  return (
    <section>
      <div className="seller-hero">
        <p className="btn secondary" style={{ width: 'fit-content' }}>
          Calibration utility
        </p>
        <h1>Map invoice fields visually</h1>
        <p>
          Load any template, click anywhere on the PDF preview, and copy the JSON payload for
          <code>templates/&lt;seller&gt;.json</code>. Use these coordinates to align fields inside the
          PDF background.
        </p>
      </div>
      {templates.length ? (
        <CalibrateTool templates={templates} />
      ) : (
        <p className="status error">No templates found. Add PDFs to /templates first.</p>
      )}
    </section>
  );
}

