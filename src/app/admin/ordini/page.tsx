import { desc } from "drizzle-orm";
import { OrdersTable } from "@/components/admin/orders-table";
import { getDb } from "@/lib/db";
import { orderItems, orders } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const db = getDb();
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt));
  const items = await db.select().from(orderItems);
  const withItems = rows.map((order) => ({
    ...order,
    items: items.filter((item) => item.orderId === order.id),
  }));

  return (
    <div>
      <h2 className="mb-6 font-serif text-3xl text-mauve">Ordini</h2>
      <OrdersTable orders={withItems} />
    </div>
  );
}
