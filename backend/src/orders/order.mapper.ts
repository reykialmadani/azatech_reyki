import { formatMoney } from '../common/utils/money.js';
import type { Prisma } from '../generated/prisma/client.js';

// Relasi TIDAK memfilter deleted_at: produk/pelanggan yang sudah diarsipkan
// tetap tampil utuh di riwayat order.
export const orderSummaryInclude = {
  customer: { select: { id: true, customerName: true, phone: true, customerAddress: true } },
  user: { select: { id: true, name: true } },
  _count: { select: { items: true } },
} satisfies Prisma.OrderInclude;

export const orderDetailInclude = {
  ...orderSummaryInclude,
  items: {
    orderBy: { id: 'asc' },
    include: {
      product: { select: { id: true, productCode: true, productName: true, imageUrl: true } },
    },
  },
} satisfies Prisma.OrderInclude;

type OrderSummaryRow = Prisma.OrderGetPayload<{ include: typeof orderSummaryInclude }>;
type OrderDetailRow = Prisma.OrderGetPayload<{ include: typeof orderDetailInclude }>;

export const toOrderSummary = (order: OrderSummaryRow) => ({
  id: order.id,
  order_number: order.orderNumber,
  customer_id: order.customerId,
  created_by: order.createdBy,
  order_date: order.orderDate,
  total_amount: formatMoney(order.totalAmount),
  created_at: order.createdAt,
  updated_at: order.updatedAt,
  customer: {
    id: order.customer.id,
    customer_name: order.customer.customerName,
    phone: order.customer.phone,
    customer_address: order.customer.customerAddress,
  },
  user: { id: order.user.id, name: order.user.name },
  items_count: order._count.items,
});

export const toOrderDetail = (order: OrderDetailRow) => ({
  ...toOrderSummary(order),
  items: order.items.map((item) => ({
    id: item.id,
    product_id: item.productId,
    quantity: item.quantity,
    unit_price: formatMoney(item.unitPrice),
    subtotal: formatMoney(item.subtotal),
    product: {
      id: item.product.id,
      product_code: item.product.productCode,
      product_name: item.product.productName,
      image_url: item.product.imageUrl,
    },
  })),
});
