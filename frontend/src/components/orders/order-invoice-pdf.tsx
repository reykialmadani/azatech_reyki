import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import { formatRupiah, formatTanggalWaktu } from "@/lib/format";
import type { OrderDetail } from "@/types/order";

// Versi PDF dari OrderInvoiceView. Font bawaan (Helvetica) tidak memuat spasi khusus
// dari Intl (NBSP / narrow NBSP), jadi dinormalisasi ke spasi biasa.
const plain = (text: string) => text.replace(/[  ]/g, " ");
const rupiah = (v: number | string) => plain(formatRupiah(v));

const zinc = { 100: "#f4f4f5", 200: "#e4e4e7", 500: "#71717a", 700: "#3f3f46", 900: "#18181b" };

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: zinc[900] },
  row: { flexDirection: "row", justifyContent: "space-between" },
  section: { paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: zinc[200] },
  brand: { fontSize: 18, fontFamily: "Helvetica-Bold", letterSpacing: 3 },
  brandTag: {
    marginLeft: 6,
    paddingHorizontal: 3,
    paddingVertical: 1,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#fff",
    backgroundColor: "#000",
  },
  muted: { color: zinc[500], fontSize: 9 },
  label: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: zinc[500], letterSpacing: 0.8, textTransform: "uppercase" },
  mono: { fontFamily: "Courier" },
  bold: { fontFamily: "Helvetica-Bold" },
  right: { textAlign: "right" },
  th: { paddingVertical: 8, backgroundColor: zinc[100], borderBottomWidth: 1, borderBottomColor: zinc[200] },
  td: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: zinc[100] },
  colProduct: { flex: 1, paddingHorizontal: 8 },
  colPrice: { width: 90, paddingHorizontal: 8, textAlign: "right" },
  colQty: { width: 40, paddingHorizontal: 8, textAlign: "right" },
  colSubtotal: { width: 100, paddingHorizontal: 8, textAlign: "right" },
  totals: { width: 220, marginLeft: "auto", marginTop: 20 },
  grandTotal: { marginTop: 8, paddingTop: 8, borderTopWidth: 2, borderTopColor: "#000", alignItems: "baseline" },
});

function InvoiceDocument({ order }: { order: OrderDetail }) {
  const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Document title={`Faktur ${order.order_number}`} author="AZATECH STORE">
      <Page size="A4" style={s.page}>
        <View style={[s.row, { paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: zinc[200] }]}>
          <View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={s.brand}>AZATECH</Text>
              <Text style={s.brandTag}>STORE</Text>
            </View>
            <Text style={[s.muted, { marginTop: 4 }]}>Sistem Order Management &amp; Katalog</Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 3 }}>
            <Text style={s.label}>Faktur Penjualan</Text>
            <Text style={[s.mono, s.bold, { fontSize: 13 }]}>{order.order_number}</Text>
            <Text style={s.muted}>{plain(formatTanggalWaktu(order.order_date))}</Text>
            <Text style={{ fontSize: 8, color: "#047857" }}>Selesai</Text>
          </View>
        </View>

        <View style={[s.section, s.row]}>
          <View style={{ gap: 3, maxWidth: 280 }}>
            <Text style={s.label}>Ditagihkan Kepada</Text>
            <Text style={s.bold}>{order.customer.customer_name}</Text>
            <Text style={[s.mono, { color: zinc[700] }]}>{order.customer.phone ?? "-"}</Text>
            <Text style={{ color: zinc[700] }}>{order.customer.customer_address}</Text>
          </View>
          <View style={{ gap: 3, alignItems: "flex-end" }}>
            <Text style={s.label}>Kasir / Admin</Text>
            <Text>{order.user.name}</Text>
          </View>
        </View>

        <View style={{ marginTop: 20 }}>
          <View style={[s.row, s.th]} fixed>
            <Text style={[s.label, s.colProduct]}>Produk</Text>
            <Text style={[s.label, s.colPrice]}>Harga Satuan</Text>
            <Text style={[s.label, s.colQty]}>Qty</Text>
            <Text style={[s.label, s.colSubtotal]}>Subtotal</Text>
          </View>
          {order.items.map((item) => (
            <View key={item.id} style={[s.row, s.td]} wrap={false}>
              <View style={s.colProduct}>
                <Text style={s.bold}>{item.product.product_name}</Text>
                <Text style={[s.mono, s.muted]}>{item.product.product_code}</Text>
              </View>
              <Text style={[s.colPrice, { color: zinc[700] }]}>{rupiah(item.unit_price)}</Text>
              <Text style={[s.colQty, { color: zinc[700] }]}>{item.quantity}</Text>
              <Text style={[s.colSubtotal, s.bold]}>{rupiah(item.subtotal)}</Text>
            </View>
          ))}
        </View>

        <View style={s.totals} wrap={false}>
          <View style={s.row}>
            <Text style={s.muted}>Jumlah item</Text>
            <Text style={s.muted}>{totalQty}</Text>
          </View>
          <View style={[s.row, s.grandTotal]}>
            <Text style={[s.label, { color: zinc[900] }]}>Grand Total</Text>
            <Text style={[s.bold, { fontSize: 16 }]}>{rupiah(order.total_amount)}</Text>
          </View>
        </View>

        <Text style={[s.muted, { marginTop: 24, fontSize: 8, maxWidth: 300 }]}>
          Harga satuan adalah harga produk pada saat transaksi dibuat dan tidak berubah meskipun harga katalog diperbarui.
        </Text>
      </Page>
    </Document>
  );
}

export async function downloadInvoicePdf(order: OrderDetail) {
  const blob = await pdf(<InvoiceDocument order={order} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `faktur-${order.order_number}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Ditunda agar browser sempat memulai unduhan sebelum URL dicabut.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
