import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X } from "lucide-react";

interface Book {
  category?: string;
  genres?: string[];
  language?: string;
  status: string;
}

interface FilterState {
  search: string;
  status: string;
  category: string;
  genre: string;
  language: string;
}

interface BookFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  books: Book[];
  totalBooks: number;
  filteredBooks: number;
}

export function BookFilters({
  filters,
  onFiltersChange,
  books,
  totalBooks,
  filteredBooks
}: BookFiltersProps) {
  const updateFilter = (key: keyof FilterState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: 'all',
      category: 'all',
      genre: 'all',
      language: 'all'
    });
  };

  const hasActiveFilters = filters.search ||
    filters.status !== 'all' ||
    filters.category !== 'all' ||
    filters.genre !== 'all' ||
    filters.language !== 'all';

  // Get unique values for filter options
  const categories = Array.from(new Set(books.filter(b => b.category).map(b => b.category)));
  const genres = Array.from(new Set(books.flatMap(b => b.genres || [])));
  const languages = Array.from(new Set(books.filter(b => b.language).map(b => b.language)));

  return (
    <div className="space-y-4">
      {/* Search and Quick Actions */}
      <div className="flex gap-4 flex-wrap items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, ISBN, or publisher..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filters:</span>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex gap-4 flex-wrap">
        <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.genre} onValueChange={(value) => updateFilter('genre', value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Genre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genres</SelectItem>
            {genres.map((genre) => (
              <SelectItem key={genre} value={genre}>
                {genre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.language} onValueChange={(value) => updateFilter('language', value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            {languages.map((language) => (
              <SelectItem key={language} value={language}>
                {language?.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters} className="gap-2">
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Active filters:</span>

          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: "{filters.search}"
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => updateFilter('search', '')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filters.status !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Status: {filters.status}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => updateFilter('status', 'all')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filters.category !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Category: {filters.category}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => updateFilter('category', 'all')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filters.genre !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Genre: {filters.genre}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => updateFilter('genre', 'all')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filters.language !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Language: {filters.language?.toUpperCase()}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => updateFilter('language', 'all')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredBooks} of {totalBooks} books
        {hasActiveFilters && ` (filtered)`}
      </div>
    </div>
  );
}