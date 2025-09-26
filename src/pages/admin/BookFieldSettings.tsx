import { BookFieldSettings } from "@/components/admin/BookManagement/BookFieldSettings";

export default function BookFieldSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          ⚙️ Field Settings
        </h1>
        <p className="text-muted-foreground">
          Configure which book fields to display and manage
        </p>
      </div>
      
      <BookFieldSettings />
    </div>
  );
}