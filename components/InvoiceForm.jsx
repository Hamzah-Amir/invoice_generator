'use client';

import { useMemo, useState } from 'react';

const createDefaultState = () => ({
  productName: '',
  quantity: '1',
  priceGBP: '0',
  postageGBP: '0',
  date: new Date().toISOString().split('T')[0],
  invoiceNumber: '',
  notes: '',
});

export default function InvoiceForm({ sellerId, sellerName }) {
  const [form, setForm] = useState(() => createDefaultState());
  const [status, setStatus] = useState({ type: null, message: '' });
  const [submitting, setSubmitting] = useState(false);

  const totals = useMemo(() => {
    const quantity = Number(form.quantity) || 0;
    const price = Number(form.priceGBP) || 0;
    const postage = Number(form.postageGBP) || 0;
    const line = quantity * price;
    return {
      line: line.toFixed(2),
      grand: (line + postage).toFixed(2),
    };
  }, [form.quantity, form.priceGBP, form.postageGBP]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const required = ['productName', 'quantity', 'priceGBP', 'date'];
    const missing = required.filter((field) => !String(form[field]).trim());
    if (missing.length) {
      setStatus({
        type: 'error',
        message: `Missing required fields: ${missing.join(', ')}`,
      });
      return false;
    }

    if (Number(form.quantity) <= 0) {
      setStatus({ type: 'error', message: 'Quantity must be greater than zero.' });
      return false;
    }

    if (Number(form.priceGBP) <= 0) {
      setStatus({ type: 'error', message: 'Price must be greater than zero.' });
      return false;
    }

    if (Number(form.postageGBP) < 0) {
      setStatus({ type: 'error', message: 'Postage cannot be negative.' });
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setStatus({ type: null, message: '' });

    try {
      const payload = {
        ...form,
        quantity: Number(form.quantity),
        priceGBP: Number(form.priceGBP),
        seller: sellerId,
        postageGBP: Number(form.postageGBP) || 0,
      };

      const response = await fetch('/api/generate-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.message || 'Failed to generate invoice.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename =
        form.invoiceNumber?.trim() || `${sellerId}-${Date.now()}`;
      link.download = `invoice-${filename}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setStatus({
        type: 'success',
        message: 'Invoice saved to the database and PDF downloaded.',
      });
      setForm(createDefaultState());
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="productName">Product Name *</label>
          <input
            id="productName"
            name="productName"
            placeholder="Wireless keyboard"
            value={form.productName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="quantity">Quantity *</label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min="1"
            value={form.quantity}
            onChange={handleChange}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="priceGBP">Price (GBP) *</label>
        <div className="field">
          <label htmlFor="postageGBP">Postage (GBP)</label>
          <input
            id="postageGBP"
            name="postageGBP"
            type="number"
            min="0"
            step="0.01"
            value={form.postageGBP}
            onChange={handleChange}
          />
        </div>
          <input
            id="priceGBP"
            name="priceGBP"
            type="number"
            min="0"
            step="0.01"
            value={form.priceGBP}
            onChange={handleChange}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="date">Invoice Date *</label>
          <input
            id="date"
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="invoiceNumber">Invoice Number</label>
          <input
            id="invoiceNumber"
            name="invoiceNumber"
            placeholder="INV-2031"
            value={form.invoiceNumber}
            onChange={handleChange}
          />
        </div>

        <div className="field">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            placeholder="Optional notes and payment terms"
            value={form.notes}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="card__footer" style={{ marginTop: '1.5rem' }}>
        <div>
          <strong>Seller:</strong> {sellerName}
          <br />
          <strong>Line Total:</strong> £{totals.line}
          <br />
          <strong>Grand Total:</strong> £{totals.grand}
        </div>
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? 'Generating…' : 'Generate Invoice'}
        </button>
      </div>

      {status.message && (
        <p className={`status ${status.type || ''}`}>{status.message}</p>
      )}
    </form>
  );
}

