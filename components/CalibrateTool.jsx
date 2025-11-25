'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs';

GlobalWorkerOptions.workerSrc = workerSrc;

export default function CalibrateTool({ templates }) {
  const canvasRef = useRef(null);
  const [selected, setSelected] = useState(templates[0]?.id || '');
  const [scale, setScale] = useState(1);
  const [pdfSize, setPdfSize] = useState({ width: 612, height: 792 });
  const [coords, setCoords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selected) return;
    renderTemplate(selected);
  }, [selected]);

  const jsonSnippet = useMemo(() => {
    if (!coords.length) return '{\n  "field": {"x": 0, "y": 0, "size": 12}\n}';
    return `{\n${coords
      .map(
        ({ x, y }, index) =>
          `  "field${index + 1}": {"x": ${x}, "y": ${y}, "size": 12}`
      )
      .join(',\n')}\n}`;
  }, [coords]);

  const renderTemplate = async (templateId) => {
    try {
      setIsLoading(true);
      setError('');
      setCoords([]);

      const response = await fetch(`/api/templates/${templateId}`);
      if (!response.ok) {
        throw new Error('Unable to load PDF template.');
      }

      const arrayBuffer = await response.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1);

      const viewport = page.getViewport({ scale: 1 });
      const maxWidth = Math.min(900, window.innerWidth - 40);
      const scaleFactor = maxWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale: scaleFactor });

      setScale(scaleFactor);
      setPdfSize({ width: viewport.width, height: viewport.height });

      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext('2d');
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;

      await page.render({ canvasContext: context, viewport: scaledViewport }).promise;
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCanvasClick = (event) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    const pdfX = Math.round(clickX / scale);
    const pdfY = Math.round((rect.height - clickY) / scale);

    const point = { x: pdfX, y: pdfY };
    setCoords((current) => [point, ...current].slice(0, 12));
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonSnippet);
  };

  return (
    <div className="calibrate-panel">
      <div className="calibrate-side">
        <h3>1. Choose template</h3>
        <div className="field">
          <label htmlFor="templateSelect">Template</label>
          <select
            id="templateSelect"
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
          >
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.seller}
              </option>
            ))}
          </select>
        </div>

        <h3 style={{ marginTop: '1.5rem' }}>2. Click to capture (x, y)</h3>
        <p className="status">
          Coordinates are calculated using the PDF coordinate system where the origin is the
          bottom-left corner.
        </p>
        <p className="status">
          Native size: {Math.round(pdfSize.width)} × {Math.round(pdfSize.height)} px. Current
          scale: {scale.toFixed(2)}×
        </p>

        <button className="btn secondary" style={{ width: '100%' }} onClick={handleCopy}>
          Copy JSON snippet
        </button>

        <div className="calibrate-log">
          {coords.length === 0
            ? 'Click on the preview to start logging coordinates.'
            : coords.map(({ x, y }, index) => `#${index + 1}: x=${x}, y=${y}`).join('\n')}
        </div>
      </div>

      <div>
        <canvas
          aria-label="Template preview canvas"
          className="calibrate-canvas"
          ref={canvasRef}
          onClick={handleCanvasClick}
        />
        {isLoading && <p className="status">Loading PDF preview…</p>}
        {error && <p className="status error">{error}</p>}

        <div className="calibrate-side" style={{ marginTop: '1rem' }}>
          <h3>JSON mapping</h3>
          <pre className="calibrate-log">{jsonSnippet}</pre>
        </div>
      </div>
    </div>
  );
}

