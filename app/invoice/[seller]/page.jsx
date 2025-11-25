import { notFound } from 'next/navigation';
import InvoiceForm from '@/components/InvoiceForm';
import { getTemplateById } from '@/lib/templates';

export default function SellerInvoicePage({ params }) {
  const template = getTemplateById(params.seller);
  if (!template) {
    return notFound();
  }

  return (
    <section>
      <div className="seller-hero">
        <p className="btn secondary" style={{ width: 'fit-content' }}>
          Template: {template.id}
        </p>
        <h1>{template.seller}</h1>
        <p>{template.description}</p>
      </div>
      <InvoiceForm sellerId={template.id} sellerName={template.seller} />
    </section>
  );
}

