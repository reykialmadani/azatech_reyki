-- Aturan bisnis dijaga juga di level database sebagai pengaman terakhir
-- (Prisma schema belum bisa mendeklarasikan CHECK constraint).

-- Stok tidak pernah negatif, bahkan jika ada race condition / bug di service.
ALTER TABLE "products" ADD CONSTRAINT "products_stock_gte_0" CHECK ("stock" >= 0);
ALTER TABLE "products" ADD CONSTRAINT "products_price_gt_0" CHECK ("price" > 0);

ALTER TABLE "order_items" ADD CONSTRAINT "order_items_quantity_gt_0" CHECK ("quantity" > 0);
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_unit_price_gt_0" CHECK ("unit_price" > 0);
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_subtotal_gte_0" CHECK ("subtotal" >= 0);

ALTER TABLE "orders" ADD CONSTRAINT "orders_total_amount_gte_0" CHECK ("total_amount" >= 0);

ALTER TABLE "order_counters" ADD CONSTRAINT "order_counters_last_seq_gte_0" CHECK ("last_seq" >= 0);
