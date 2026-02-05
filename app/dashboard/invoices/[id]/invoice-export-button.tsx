"use client";

import { PDFDownloadButton } from "@/components/pdf/pdf-download-button";
import { InvoicePDF } from "@/components/pdf/invoice-pdf";

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface InvoiceExportProps {
  invoice: {
    invoice_number: string;
    invoice_date: string;
    due_date?: string;
    status: string;
    subtotal: number;
    tax_amount: number;
    total: number;
    notes?: string;
    place?: {
      name: string;
      address?: string;
      city?: string;
      contact_person?: string;
      contact_phone?: string;
    };
  };
  items: InvoiceItem[];
}

export function InvoiceExportButton({ invoice, items }: InvoiceExportProps) {
  // Transform items to match PDF component expectations
  const pdfItems = items.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total: item.amount,
  }));

  const pdfInvoice = {
    ...invoice,
    total_amount: invoice.total,
  };

  return (
    <PDFDownloadButton
      document={<InvoicePDF invoice={pdfInvoice} items={pdfItems} />}
      fileName={`Invoice-${invoice.invoice_number}.pdf`}
    >
      Export PDF
    </PDFDownloadButton>
  );
}
