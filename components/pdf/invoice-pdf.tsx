"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";
import { COMPANY_INFO, COMPANY_LOGO_BASE64 } from "@/lib/pdf-utils";

// Register fonts if needed
// Font.register({ family: 'Open Sans', src: '...' });

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: "#228822",
    paddingBottom: 20,
  },
  logo: {
    width: 80,
    height: 90,
  },
  companyInfo: {
    textAlign: "right",
    flex: 1,
    marginLeft: 20,
  },
  companyName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#228822",
    marginBottom: 4,
  },
  companyTagline: {
    fontSize: 10,
    color: "#666666",
    marginBottom: 8,
  },
  companyContact: {
    fontSize: 9,
    color: "#444444",
    lineHeight: 1.4,
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 20,
    textAlign: "center",
  },
  infoSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  infoBox: {
    width: "48%",
  },
  infoLabel: {
    fontSize: 8,
    color: "#888888",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 11,
    color: "#333333",
    marginBottom: 8,
  },
  infoValueBold: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 8,
  },
  table: {
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#228822",
    padding: 10,
  },
  tableHeaderText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 10,
  },
  tableRow: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
  },
  tableRowAlt: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
    backgroundColor: "#f9f9f9",
  },
  tableCell: {
    fontSize: 10,
    color: "#333333",
  },
  col1: { width: "50%" },
  col2: { width: "15%", textAlign: "center" },
  col3: { width: "17%", textAlign: "right" },
  col4: { width: "18%", textAlign: "right" },
  totalsSection: {
    marginTop: 10,
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 5,
    width: 250,
  },
  totalLabel: {
    fontSize: 10,
    color: "#666666",
    width: 120,
  },
  totalValue: {
    fontSize: 10,
    color: "#333333",
    width: 130,
    textAlign: "right",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: "#228822",
    width: 250,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#228822",
    width: 120,
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#228822",
    width: 130,
    textAlign: "right",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#dddddd",
    paddingTop: 15,
  },
  footerText: {
    fontSize: 8,
    color: "#888888",
    marginBottom: 3,
  },
  statusBadge: {
    backgroundColor: "#228822",
    color: "#ffffff",
    padding: "4 12",
    borderRadius: 4,
    fontSize: 10,
    fontWeight: "bold",
  },
  statusUnpaid: {
    backgroundColor: "#dc2626",
  },
  statusSent: {
    backgroundColor: "#2563eb",
  },
  notes: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 5,
  },
  notesText: {
    fontSize: 9,
    color: "#666666",
    lineHeight: 1.4,
  },
});

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface InvoicePDFProps {
  invoice: {
    invoice_number: string;
    invoice_date: string;
    due_date?: string;
    status: string;
    subtotal: number;
    tax_amount: number;
    total_amount: number;
    notes?: string;
    place?: {
      name: string;
      address?: string;
      city?: string;
      contact_person?: string;
      contact_phone?: string;
    };
    branch?: {
      name: string;
      city?: string;
    };
  };
  items: InvoiceItem[];
}

export function InvoicePDF({ invoice, items }: InvoicePDFProps) {
  const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString()}`;
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-PK", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with Logo */}
        <View style={styles.header}>
          <Image src={COMPANY_LOGO_BASE64} style={styles.logo} />
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{COMPANY_INFO.name}</Text>
            <Text style={styles.companyTagline}>{COMPANY_INFO.tagline}</Text>
            <Text style={styles.companyContact}>
              {COMPANY_INFO.address}
              {"\n"}
              {COMPANY_INFO.phone}
              {"\n"}
              {COMPANY_INFO.email}
            </Text>
          </View>
        </View>

        {/* Invoice Title */}
        <Text style={styles.invoiceTitle}>INVOICE</Text>

        {/* Invoice & Client Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Bill To</Text>
            <Text style={styles.infoValueBold}>
              {invoice.place?.name || "N/A"}
            </Text>
            {invoice.place?.address && (
              <Text style={styles.infoValue}>{invoice.place.address}</Text>
            )}
            {invoice.place?.city && (
              <Text style={styles.infoValue}>{invoice.place.city}</Text>
            )}
            {invoice.place?.contact_person && (
              <Text style={styles.infoValue}>
                Attn: {invoice.place.contact_person}
              </Text>
            )}
            {invoice.place?.contact_phone && (
              <Text style={styles.infoValue}>
                Tel: {invoice.place.contact_phone}
              </Text>
            )}
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Invoice Number</Text>
            <Text style={styles.infoValueBold}>{invoice.invoice_number}</Text>

            <Text style={styles.infoLabel}>Invoice Date</Text>
            <Text style={styles.infoValue}>
              {formatDate(invoice.invoice_date)}
            </Text>

            <Text style={styles.infoLabel}>Due Date</Text>
            <Text style={styles.infoValue}>{invoice.due_date ? formatDate(invoice.due_date) : "N/A"}</Text>

            <Text style={styles.infoLabel}>Status</Text>
            <Text
              style={[
                styles.statusBadge,
                ...(invoice.status === "unpaid" ? [styles.statusUnpaid] : []),
                ...(invoice.status === "sent" ? [styles.statusSent] : []),
              ]}
            >
              {invoice.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.col1]}>
              Description
            </Text>
            <Text style={[styles.tableHeaderText, styles.col2]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.col3]}>Rate</Text>
            <Text style={[styles.tableHeaderText, styles.col4]}>Amount</Text>
          </View>
          {items.map((item, index) => (
            <View
              key={index}
              style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
            >
              <Text style={[styles.tableCell, styles.col1]}>
                {item.description}
              </Text>
              <Text style={[styles.tableCell, styles.col2]}>
                {item.quantity}
              </Text>
              <Text style={[styles.tableCell, styles.col3]}>
                {formatCurrency(item.unit_price)}
              </Text>
              <Text style={[styles.tableCell, styles.col4]}>
                {formatCurrency(item.total)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(invoice.subtotal)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(invoice.tax_amount)}
            </Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total Due:</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(invoice.total_amount)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Notes:</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Thank you for your business with {COMPANY_INFO.name}
          </Text>
          <Text style={styles.footerText}>
            {COMPANY_INFO.website} | {COMPANY_INFO.email}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
