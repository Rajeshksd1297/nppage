import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Edit, Trash2, Ban, CheckCircle, Shield, ShieldCheck } from "lucide-react";

interface User {
  id: string;
  role?: string;
  blocked?: boolean;
}

interface UserActionsProps {
  user: User;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleBlock: () => void;
  onUpdateRole: (role: string) => void;
}

export function UserActions({ user, onView, onEdit, onDelete, onToggleBlock, onUpdateRole }: UserActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={onView}>
          <Eye className="mr-2 h-4 w-4" />
          View Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit User
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onToggleBlock}>
          {user.blocked ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Unblock User
            </>
          ) : (
            <>
              <Ban className="mr-2 h-4 w-4" />
              Block User
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {user.role !== 'admin' && (
          <DropdownMenuItem onClick={() => onUpdateRole('admin')}>
            <ShieldCheck className="mr-2 h-4 w-4" />
            Make Admin
          </DropdownMenuItem>
        )}
        {user.role === 'admin' && (
          <DropdownMenuItem onClick={() => onUpdateRole('user')}>
            <Shield className="mr-2 h-4 w-4" />
            Remove Admin
          </DropdownMenuItem>
        )}
        {user.role !== 'moderator' && (
          <DropdownMenuItem onClick={() => onUpdateRole('moderator')}>
            <Shield className="mr-2 h-4 w-4" />
            Make Moderator
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}