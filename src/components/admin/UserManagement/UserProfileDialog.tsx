import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Mail, Globe, Building2, CreditCard, User as UserIcon } from "lucide-react";

interface User {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
  bio?: string;
  website_url?: string;
  social_links?: any;
  public_profile?: boolean;
  specializations?: string[];
  slug?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  role?: string;
  subscription?: {
    id: string;
    status: string;
    plan_id: string;
    trial_ends_at?: string;
    current_period_end?: string;
    plan: {
      name: string;
      price_monthly?: number;
    };
  };
  publisher?: {
    id: string;
    name: string;
    role: string;
    revenue_share_percentage: number;
  };
  blocked?: boolean;
  last_sign_in?: string;
}

interface UserProfileDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileDialog({ user, open, onOpenChange }: UserProfileDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            User Profile Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="font-semibold mb-3">Basic Information</h3>
            <div className="grid gap-3">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{user.full_name || 'No name set'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user.email}</span>
              </div>
              {user.website_url && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={user.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {user.website_url}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Role & Status */}
          <div>
            <h3 className="font-semibold mb-3">Role & Status</h3>
            <div className="flex gap-2 flex-wrap">
              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                {user.role}
              </Badge>
              <Badge variant={user.public_profile ? 'default' : 'secondary'}>
                {user.public_profile ? 'Public Profile' : 'Private Profile'}
              </Badge>
              <Badge variant={user.blocked ? 'destructive' : 'default'}>
                {user.blocked ? 'Blocked' : 'Active'}
              </Badge>
            </div>
          </div>

          {/* Bio & Specializations */}
          {(user.bio || user.specializations?.length) && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3">About</h3>
                {user.bio && (
                  <p className="text-muted-foreground mb-3">{user.bio}</p>
                )}
                {user.specializations?.length > 0 && (
                  <div>
                    <span className="text-sm font-medium">Specializations:</span>
                    <div className="flex gap-1 flex-wrap mt-1">
                      {user.specializations.map((spec, index) => (
                        <Badge key={index} variant="outline">{spec}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Subscription */}
          {user.subscription && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Subscription
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Plan:</span>
                    <Badge>{user.subscription.plan.name}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant={user.subscription.status === 'active' ? 'default' : 'secondary'}>
                      {user.subscription.status}
                    </Badge>
                  </div>
                  {user.subscription.plan.price_monthly && (
                    <div className="flex justify-between">
                      <span>Monthly Price:</span>
                      <span>${user.subscription.plan.price_monthly}/month</span>
                    </div>
                  )}
                  {user.subscription.trial_ends_at && (
                    <div className="flex justify-between">
                      <span>Trial Ends:</span>
                      <span>{new Date(user.subscription.trial_ends_at).toLocaleDateString()}</span>
                    </div>
                  )}
                  {user.subscription.current_period_end && (
                    <div className="flex justify-between">
                      <span>Next Billing:</span>
                      <span>{new Date(user.subscription.current_period_end).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Publisher Association */}
          {user.publisher && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Publisher Association
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Publisher:</span>
                    <span className="font-medium">{user.publisher.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Role:</span>
                    <Badge variant="outline">{user.publisher.role}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Revenue Share:</span>
                    <span>{user.publisher.revenue_share_percentage}%</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* SEO Information */}
          {(user.seo_title || user.seo_description || user.seo_keywords) && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3">SEO Information</h3>
                <div className="space-y-2 text-sm">
                  {user.seo_title && (
                    <div>
                      <span className="font-medium">Title:</span>
                      <p className="text-muted-foreground">{user.seo_title}</p>
                    </div>
                  )}
                  {user.seo_description && (
                    <div>
                      <span className="font-medium">Description:</span>
                      <p className="text-muted-foreground">{user.seo_description}</p>
                    </div>
                  )}
                  {user.seo_keywords && (
                    <div>
                      <span className="font-medium">Keywords:</span>
                      <p className="text-muted-foreground">{user.seo_keywords}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}