import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowUpDown, ArrowUp, ArrowDown, Calendar, CreditCard, Building2 } from "lucide-react";
import { UserActions } from "./UserActions";

interface User {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
  bio?: string;
  website_url?: string;
  role?: string;
  subscription?: {
    id: string;
    status: string;
    plan: { name: string; price_monthly?: number };
  };
  publisher?: {
    id: string;
    name: string;
    role: string;
  };
  blocked?: boolean;
}

type SortField = 'full_name' | 'email' | 'created_at' | 'role' | 'subscription_status';
type SortDirection = 'asc' | 'desc';

interface SortableTableProps {
  users: User[];
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  onToggleBlock: (userId: string, blocked: boolean) => void;
  onUpdateRole: (userId: string, role: string) => void;
}

export function SortableTable({ 
  users, 
  onView, 
  onEdit, 
  onDelete, 
  onToggleBlock, 
  onUpdateRole 
}: SortableTableProps) {
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'full_name':
        aValue = a.full_name?.toLowerCase() || '';
        bValue = b.full_name?.toLowerCase() || '';
        break;
      case 'email':
        aValue = a.email.toLowerCase();
        bValue = b.email.toLowerCase();
        break;
      case 'created_at':
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;
      case 'role':
        aValue = a.role || 'user';
        bValue = b.role || 'user';
        break;
      case 'subscription_status':
        aValue = a.subscription?.status || 'none';
        bValue = b.subscription?.status || 'none';
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => {
    const isActive = sortField === field;
    const direction = isActive ? sortDirection : null;

    return (
      <TableHead>
        <Button
          variant="ghost"
          onClick={() => handleSort(field)}
          className="h-auto p-0 font-semibold hover:bg-transparent"
        >
          <span className="flex items-center gap-2">
            {children}
            {direction === 'asc' && <ArrowUp className="h-4 w-4" />}
            {direction === 'desc' && <ArrowDown className="h-4 w-4" />}
            {!direction && <ArrowUpDown className="h-4 w-4 opacity-50" />}
          </span>
        </Button>
      </TableHead>
    );
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <SortableHeader field="full_name">Name</SortableHeader>
            <SortableHeader field="email">Email</SortableHeader>
            <SortableHeader field="role">Role</SortableHeader>
            <SortableHeader field="subscription_status">Subscription</SortableHeader>
            <SortableHeader field="created_at">Joined</SortableHeader>
            <TableHead>Publisher</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedUsers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                No users found
              </TableCell>
            </TableRow>
          ) : (
            sortedUsers.map((user) => (
              <TableRow key={user.id} className="hover:bg-muted/50">
                <TableCell>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback>
                      {user.full_name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
                
                <TableCell className="font-medium">
                  {user.full_name || 'Unnamed User'}
                </TableCell>
                
                <TableCell className="text-muted-foreground">
                  {user.email}
                </TableCell>
                
                <TableCell>
                  <Badge variant={user.role === 'admin' ? 'default' : user.role === 'moderator' ? 'secondary' : 'outline'}>
                    {user.role}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  {user.subscription ? (
                    <div className="flex items-center gap-2">
                      <Badge variant={user.subscription.status === 'active' ? 'default' : 'secondary'}>
                        {user.subscription.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {user.subscription.plan.name}
                      </span>
                    </div>
                  ) : (
                    <Badge variant="outline">Free</Badge>
                  )}
                </TableCell>
                
                <TableCell className="text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </TableCell>
                
                <TableCell>
                  {user.publisher ? (
                    <div className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      <span className="text-xs">{user.publisher.name}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">None</span>
                  )}
                </TableCell>
                
                <TableCell>
                  <Badge variant={user.blocked ? 'destructive' : 'default'}>
                    {user.blocked ? 'Blocked' : 'Active'}
                  </Badge>
                </TableCell>
                
                <TableCell className="text-right">
                  <UserActions
                    user={user}
                    onView={() => onView(user)}
                    onEdit={() => onEdit(user)}
                    onDelete={() => onDelete(user.id)}
                    onToggleBlock={() => onToggleBlock(user.id, user.blocked || false)}
                    onUpdateRole={(role) => onUpdateRole(user.id, role)}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}