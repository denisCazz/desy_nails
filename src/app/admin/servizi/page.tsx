import { asc } from "drizzle-orm";
import { ServicesManager } from "@/components/admin/services-manager";
import { getDb } from "@/lib/db";
import { services } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  const db = getDb();
  const rows = await db.select().from(services).orderBy(asc(services.sortOrder));
  return (
    <div>
      <h2 className="mb-6 font-serif text-3xl text-mauve">Servizi</h2>
      <ServicesManager services={rows} />
    </div>
  );
}
