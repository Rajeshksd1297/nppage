import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X } from "lucide-react";

interface FilterState {
  search: string;
  role: string;
  status: string;
  subscription: string;
  publisher: string;
}

interface UserFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  publishers: Array<{ id: string; name: string }>;
  totalUsers: number;
  filteredUsers: number;
}

export function UserFilters({ 
  filters, 
  onFiltersChange, 
  publishers, 
  totalUsers, 
  filteredUsers 
}: UserFiltersProps) {
  const updateFilter = (key: keyof FilterState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      role: 'all',
      status: 'all',
      subscription: 'all',
      publisher: 'all'
    });
  };

  const hasActiveFilters = filters.search || 
    filters.role !== 'all' || 
    filters.status !== 'all' || 
    filters.subscription !== 'all' || 
    filters.publisher !== 'all';

  return (
    <div className="space-y-4">
      {/* Search and Quick Actions */}
      <div className="flex gap-4 flex-wrap items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
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
        <Select value={filters.role} onValueChange={(value) => updateFilter('role', value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="moderator">Moderator</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.subscription} onValueChange={(value) => updateFilter('subscription', value)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Subscription" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subscriptions</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trialing">Trial</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="none">No Subscription</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.publisher} onValueChange={(value) => updateFilter('publisher', value)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Publisher" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Publishers</SelectItem>
            <SelectItem value="none">No Publisher</SelectItem>
            {publishers.map((publisher) => (
              <SelectItem key={publisher.id} value={publisher.id}>
                {publisher.name}
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
          
          {filters.role !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Role: {filters.role}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => updateFilter('role', 'all')}
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
          
          {filters.subscription !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Subscription: {filters.subscription}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => updateFilter('subscription', 'all')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.publisher !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Publisher: {filters.publisher === 'none' ? 'No Publisher' : 
                publishers.find(p => p.id === filters.publisher)?.name || filters.publisher}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => updateFilter('publisher', 'all')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredUsers} of {totalUsers} users
        {hasActiveFilters && ` (filtered)`}
      </div>
    </div>
  );
}