import { asc } from "drizzle-orm";
import { ProductsManager } from "@/components/admin/products-manager";
import { getDb } from "@/lib/db";
import { products } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const db = getDb();
  const rows = await db.select().from(products).orderBy(asc(products.sortOrder));
  return (
    <div>
      <h2 className="mb-6 font-serif text-3xl text-mauve">Shop — unghie già fatte</h2>
      <ProductsManager products={rows} />
    </div>
  );
}
