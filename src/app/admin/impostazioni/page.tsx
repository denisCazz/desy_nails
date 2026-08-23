import { SettingsForm } from "@/components/admin/settings-form";
import { getAllSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getAllSettings();
  return (
    <div>
      <h2 className="mb-6 font-serif text-3xl text-mauve">Impostazioni</h2>
      <SettingsForm settings={settings} />
    </div>
  );
}
