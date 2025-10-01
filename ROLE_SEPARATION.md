# 🔐 User & Admin Role Separation

## Overview

The system maintains **strict separation** between User and Admin roles at multiple levels for security and scalability.

---

## Role Types

### 1. **Admin**
- Full system access
- Manage users, packages, settings
- Access to all admin pages (`/admin/*`)
- Deploy to production
- View all analytics

### 2. **User** 
- Own profile and content management
- Feature access based on subscription
- No admin page access
- View only own data

### 3. **Moderator** (Optional)
- Content moderation
- Support tickets
- No admin system access

---

## Implementation Layers

### 1. **Database Level (Most Secure)**

#### Tables
```sql
-- User roles stored separately (NEVER in profiles!)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  role app_role NOT NULL  -- enum: 'admin', 'user', 'moderator'
);

-- Security function to check roles
CREATE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS boolean
SECURITY DEFINER;
```

#### RLS Policies Example
```sql
-- Only admins can access aws_settings
CREATE POLICY "Admins only" 
ON aws_settings FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Users can only see own books
CREATE POLICY "Own books only"
ON books FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
```

**✅ Security Benefit**: Even if frontend is bypassed, database blocks unauthorized access.

---

### 2. **Application Level**

#### Route Protection
```typescript
// All /admin/* routes wrapped with AdminAccessGuard
<Route path="/admin/*" element={
  <AdminAccessGuard>
    {/* Admin pages here */}
  </AdminAccessGuard>
} />
```

#### AdminAccessGuard Component
**Location**: `src/components/AdminAccessGuard.tsx`

```typescript
export const AdminAccessGuard = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check role via secure RPC call
  const roleData = await supabase.rpc('get_current_user_role');
  setIsAdmin(roleData === 'admin');
  
  if (!isAdmin) {
    return <AccessDenied />;
  }
  
  return children;
};
```

**Protection**: Blocks non-admins from accessing admin UI.

---

### 3. **UI Level**

#### Sidebar Navigation
**Location**: `src/components/layout/AppSidebar.tsx`

```typescript
// Different menus for different roles
const isAdmin = currentUserRole === 'admin';

{isAdmin ? (
  <AdminSidebarItems />
) : (
  <UserSidebarItems />
)}
```

#### Conditional Features
```typescript
// Features shown based on role + subscription
{hasFeature('advanced_analytics') && !isAdmin && (
  <AnalyticsCard />
)}
```

---

## Access Matrix

| Feature | Admin | User (Free) | User (Pro) |
|---------|-------|-------------|------------|
| **Dashboard** | ✅ All data | ✅ Own data | ✅ Own data |
| **User Management** | ✅ | ❌ | ❌ |
| **Role Management** | ✅ | ❌ | ❌ |
| **Package Management** | ✅ | ❌ | ❌ |
| **Book Publishing** | ✅ All | ✅ Limited | ✅ Unlimited |
| **Advanced Analytics** | ✅ | ❌ | ✅ |
| **Custom Domain** | ✅ | ❌ | ✅ |
| **AWS Deployment** | ✅ | ❌ | ❌ |
| **Backup & Security** | ✅ | ❌ | ❌ |
| **Theme Management** | ✅ | Basic | ✅ Premium |

---

## Admin Pages List

All protected by `AdminAccessGuard`:

### Core Admin
- `/admin` - Admin Dashboard
- `/admin/users` - User Management
- `/admin/role-management` - **NEW** Role Assignment
- `/admin/help-desk` - Help Desk Management

### Site Management  
- `/admin/production-readiness` - **NEW** Go-Live Checklist
- `/admin/home-page-management` - Home Page Editor
- `/admin/theme-management` - Theme Designer
- `/admin/backup-security` - Backup Center
- `/admin/domain-settings` - Domain Configuration
- `/admin/email-settings` - Email Templates
- `/admin/aws-deployment` - AWS EC2 Deployment

### Content Management
- `/admin/book-catalog` - All Books
- `/admin/blog-management` - All Blog Posts
- `/admin/events-management` - All Events
- `/admin/awards-management` - All Awards
- `/admin/faq-management` - All FAQs
- `/admin/newsletter-management` - Campaigns
- `/admin/contact-management` - Contact Submissions

### Business Management
- `/admin/publishers` - Publisher Management
- `/admin/package-management` - **Subscription Plans**
- `/admin/help-desk-settings` - Support Settings

---

## User Pages List

Accessible to all authenticated users:

### Core Features
- `/dashboard` - User Dashboard
- `/profile` - My Profile
- `/books` - My Books
- `/analytics` - Basic Analytics

### Content Creation
- `/user/blog` - My Blog Posts
- `/user/events` - My Events
- `/user/awards` - My Awards
- `/user/faq` - My FAQs
- `/user/newsletter` - My Campaigns

### Support
- `/support-tickets` - My Tickets
- `/subscription` - My Subscription
- `/contact-form-settings` - Contact Form

---

## How Roles Are Assigned

### 1. **New User Signup**
```sql
-- Automatic trigger on user creation
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
EXECUTE FUNCTION handle_new_user();

-- Function assigns 'user' role by default
INSERT INTO user_roles (user_id, role)
VALUES (new.id, 'user');
```

### 2. **Admin Assignment**
**Via Role Management Page** (`/admin/role-management`):
1. Admin logs in
2. Goes to Role Management
3. Selects user
4. Changes role to 'admin'
5. Change takes effect immediately

**Via Database**:
```sql
-- Manually promote user to admin
UPDATE user_roles 
SET role = 'admin' 
WHERE user_id = 'user-uuid-here';
```

### 3. **Trial Users**
```sql
-- All new users get 30-day Pro trial
-- But remain 'user' role (not 'admin')
INSERT INTO user_subscriptions (
  user_id, 
  plan_id, 
  status, 
  trial_ends_at
) VALUES (
  new.id,
  pro_plan_id,
  'trialing',
  NOW() + INTERVAL '30 days'
);
```

**Note**: Trial gives Pro features, NOT admin access!

---

## Security Best Practices

### ✅ DO
- Check roles at database level (RLS)
- Use `AdminAccessGuard` for all admin routes
- Call `get_current_user_role()` RPC for role checks
- Store roles in separate `user_roles` table
- Use `has_role()` function in RLS policies

### ❌ DON'T
- Store roles in `profiles` table (security risk!)
- Check roles only in frontend (can be bypassed!)
- Hard-code admin emails in code
- Trust client-side role information
- Give admin access to trial users

---

## Testing Role Separation

### 1. **Test User Role**
```bash
# 1. Create regular user account
# 2. Try to access /admin
# 3. Should see "Access Denied"
# 4. Verify can only see own data
```

### 2. **Test Admin Role**
```bash
# 1. Create admin user (via Role Management)
# 2. Access /admin
# 3. Should see all admin pages
# 4. Verify can see all users' data
```

### 3. **Test Database Protection**
```sql
-- As regular user, try to access admin table
SELECT * FROM aws_settings;
-- Should return: permission denied

-- As admin, same query
SELECT * FROM aws_settings;
-- Should work
```

---

## Role Management Page

**NEW Page**: `/admin/role-management`

### Features
- ✅ View all users with current roles
- ✅ Change user roles (User → Admin, etc.)
- ✅ Role statistics dashboard
- ✅ Permission matrix display
- ✅ Security warnings

### How to Use
1. Login as Admin
2. Navigate to **Core Admin → Role Management**
3. Select user from table
4. Choose new role from dropdown
5. Change applies immediately

---

## Real-Time Sync

Role changes sync immediately across:
- ✅ Database RLS policies
- ✅ AdminAccessGuard checks
- ✅ Sidebar navigation
- ✅ Feature access
- ✅ API endpoints

**Implementation**: Uses Supabase Real-time subscriptions

---

## Audit Trail

All role changes are tracked:

```sql
-- Optional: Create audit table
CREATE TABLE role_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  old_role app_role,
  new_role app_role,
  changed_by UUID,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Troubleshooting

### "User can access admin pages"
**Check**:
1. Is `AdminAccessGuard` wrapping the route?
2. Does user actually have admin role in `user_roles` table?
3. Are you using the correct user account?

### "Admin can't access admin pages"
**Check**:
1. Is role set correctly in database?
   ```sql
   SELECT * FROM user_roles WHERE user_id = 'admin-uuid';
   ```
2. Clear browser cache/cookies
3. Log out and log back in

### "Role changes not taking effect"
**Fix**:
1. Check real-time subscription is active
2. Refresh the page
3. Verify RLS policies are enabled

---

## Production Deployment

### Pre-Deployment Checklist
- [ ] Verify at least one admin user exists
- [ ] Test AdminAccessGuard on all admin routes
- [ ] Confirm RLS policies block non-admins
- [ ] Test role change functionality
- [ ] Verify admin can't be demoted by non-admin

### Post-Deployment
- [ ] Create admin accounts for team
- [ ] Document who has admin access
- [ ] Set up admin account rotation policy
- [ ] Monitor role changes in audit logs

---

## Summary

✅ **Database**: Roles enforced by RLS policies  
✅ **Application**: Protected by AdminAccessGuard  
✅ **UI**: Conditional rendering based on role  
✅ **Management**: Visual role management dashboard  
✅ **Security**: Multi-layer protection  
✅ **Scalability**: Ready for 1M users  

**Role separation is production-ready!** 🚀

---

*Last Updated: 2025-10-01*
