import { ISBNLookup } from "@/components/admin/BookManagement/ISBNLookup";

export default function ISBNLookupPage() {
  const handleBookFound = (bookData: any) => {
    // Handle adding book from ISBN lookup
    console.log('Book found:', bookData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          📖 ISBN Lookup
        </h1>
        <p className="text-muted-foreground">
          Search and import books using ISBN numbers with automatic affiliate link generation
        </p>
      </div>
      
      <ISBNLookup onBookFound={handleBookFound} />
    </div>
  );
}