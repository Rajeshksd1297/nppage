import { AffiliateSettings } from "@/components/admin/BookManagement/AffiliateSettings";

export default function AffiliateSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          🔗 Affiliate Settings
        </h1>
        <p className="text-muted-foreground">
          Configure affiliate links for various book retailers
        </p>
      </div>
      
      <AffiliateSettings />
    </div>
  );
}