// features/invoices/pdf/InvoiceDocument.tsx
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  companyName: { fontSize: 16, fontWeight: 700 },
  metaBlock: { alignItems: "flex-end" },
  section: { marginBottom: 16 },
  table: { display: "flex", width: "auto", borderStyle: "solid", borderWidth: 1, borderColor: "#ddd" },
  row: { flexDirection: "row" },
  cellHeader: { flex: 1, padding: 6, fontWeight: 700, backgroundColor: "#f5f5f5", fontSize: 9 },
  cell: { flex: 1, padding: 6, fontSize: 9 },
  totalsRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 8 },
  footer: { marginTop: 32, fontSize: 8, color: "#888", textAlign: "center" },
})

export type InvoiceLineItem = {
  description: string
  amountPaisa: number
}

export type InvoiceDocumentData = {
  invoiceNumber: string
  createdAt: Date
  sellerName: string
  sellerPan: string | null
  buyerName: string
  buyerEmail: string
  buyerPan: string | null
  lineItems: InvoiceLineItem[]
  subtotalPaisa: number
  vatRatePercent: number | null
  vatAmountPaisa: number | null
  totalPaisa: number
}

export function InvoiceDocument({ invoice }: { invoice: InvoiceDocumentData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{invoice.sellerName}</Text>
            {invoice.sellerPan && <Text>PAN: {invoice.sellerPan}</Text>}
          </View>
          <View style={styles.metaBlock}>
            <Text>Invoice No: {invoice.invoiceNumber}</Text>
            <Text>Date: {invoice.createdAt.toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ fontWeight: 700, marginBottom: 4 }}>Bill To</Text>
          <Text>{invoice.buyerName}</Text>
          <Text>{invoice.buyerEmail}</Text>
          {invoice.buyerPan && <Text>PAN: {invoice.buyerPan}</Text>}
        </View>

        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={[styles.cellHeader, { flex: 3 }]}>Description</Text>
            <Text style={styles.cellHeader}>Amount (NPR)</Text>
          </View>
          {invoice.lineItems.map((item, i) => (
            <View style={styles.row} key={i}>
              <Text style={[styles.cell, { flex: 3 }]}>{item.description}</Text>
              <Text style={styles.cell}>{(item.amountPaisa / 100).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsRow}>
          <View style={{ width: 200 }}>
            <View style={styles.row}>
              <Text style={{ flex: 1 }}>Subtotal</Text>
              <Text>NPR {(invoice.subtotalPaisa / 100).toFixed(2)}</Text>
            </View>
            {invoice.vatAmountPaisa != null && (
              <View style={styles.row}>
                <Text style={{ flex: 1 }}>VAT ({invoice.vatRatePercent}%)</Text>
                <Text>NPR {(invoice.vatAmountPaisa / 100).toFixed(2)}</Text>
              </View>
            )}
            <View style={[styles.row, { marginTop: 4, fontWeight: 700 }]}>
              <Text style={{ flex: 1 }}>Total</Text>
              <Text>NPR {(invoice.totalPaisa / 100).toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>
          This is a computer-generated invoice and does not require a signature.
        </Text>
      </Page>
    </Document>
  )
}
