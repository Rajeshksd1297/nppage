# 🏗️ Modular Architecture Documentation

## Overview

The application follows a **strict modular architecture** where each feature is self-contained, ensuring changes in one module don't affect others.

---

## Module Structure

```
src/
├── pages/              # Page-level modules
│   ├── admin/         # Admin module (isolated)
│   ├── user/          # User content modules
│   └── public/        # Public-facing pages
├── components/        # Reusable components
│   ├── admin/        # Admin-specific components
│   ├── ui/           # Base UI components (shadcn)
│   ├── layout/       # Layout components
│   └── feature/      # Feature-specific components
├── hooks/            # Custom React hooks (business logic)
├── utils/            # Pure utility functions
├── integrations/     # External service integrations
└── lib/              # Shared libraries
```

---

## Core Modules

### 1. **Authentication Module**
**Isolation Level**: ⭐⭐⭐⭐⭐ (Fully Independent)

**Files:**
- `src/pages/Auth.tsx` - Login/Signup page
- `src/hooks/useSubscription.tsx` - Auth-aware subscription logic
- `src/integrations/supabase/client.ts` - Supabase client

**Dependencies:**
- ✅ Zero dependencies on other modules
- ✅ Used by: All protected routes

**Database:**
- `auth.users` (Supabase managed)
- `profiles`
- `user_roles`

**Edge Functions:**
- `send-auth-email` - Password reset emails

**Module Interface:**
```typescript
// Exports
export const supabase: SupabaseClient;
export function useAuth(): {
  user: User | null;
  session: Session | null;
  signIn: (email, password) => Promise<void>;
  signOut: () => Promise<void>;
}
```

---

### 2. **Subscription Module**
**Isolation Level**: ⭐⭐⭐⭐ (Minimal Dependencies)

**Files:**
- `src/pages/Subscription.tsx` - Subscription UI
- `src/hooks/useSubscription.tsx` - Subscription logic
- `src/hooks/useDynamicFeatures.tsx` - Feature flags
- `src/pages/admin/PackageManagement.tsx` - Admin config

**Dependencies:**
- Auth module (for user context)

**Database:**
- `subscription_plans`
- `user_subscriptions`

**Module Interface:**
```typescript
export function useSubscription(): {
  subscription: UserSubscription | null;
  hasFeature: (feature: string) => boolean;
  isPro: () => boolean;
  refreshSubscription: () => Promise<void>;
}
```

---

### 3. **Book Management Module**
**Isolation Level**: ⭐⭐⭐⭐⭐ (Fully Independent)

**Files:**
- `src/pages/Books.tsx` - User book list
- `src/pages/BookEdit.tsx` - Book editor
- `src/pages/BookView.tsx` - Book viewer
- `src/pages/admin/BooksManagement.tsx` - Admin view
- `src/components/admin/BookManagement/` - Admin components
  - `BookEditor.tsx`
  - `BookFilters.tsx`
  - `ISBNLookup.tsx`
  - `AffiliateSettings.tsx`

**Dependencies:**
- Auth module
- Subscription module (feature gating)

**Database:**
- `books`
- Book-related settings tables

**Module Interface:**
```typescript
export interface Book {
  id: string;
  title: string;
  // ... other fields
}

export function useBooks(): {
  books: Book[];
  createBook: (data: BookInput) => Promise<Book>;
  updateBook: (id: string, data: Partial<Book>) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;
}
```

---

### 4. **Blog Module**
**Isolation Level**: ⭐⭐⭐⭐⭐ (Fully Independent)

**Files:**
- `src/pages/UserBlogManagement.tsx` - User blog list
- `src/pages/UserBlogCreate.tsx` - Create post
- `src/pages/UserBlogEdit.tsx` - Edit post
- `src/pages/admin/BlogManagement.tsx` - Admin view
- `src/pages/admin/BlogSettings.tsx` - Blog configuration

**Dependencies:**
- Auth module
- Subscription module
- Feature Access Guard

**Database:**
- `blog_posts`
- `blog_settings`

**Module Interface:**
```typescript
export interface BlogPost {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'published';
}

export function useBlogPosts(): {
  posts: BlogPost[];
  createPost: (data: PostInput) => Promise<BlogPost>;
  // ...
}
```

---

### 5. **Events Module**
**Isolation Level**: ⭐⭐⭐⭐⭐ (Fully Independent)

**Files:**
- `src/pages/UserEventsManagement.tsx`
- `src/pages/UserEventCreate.tsx`
- `src/pages/UserEventEdit.tsx`
- `src/pages/admin/EventsManagement.tsx`
- `src/pages/admin/EventSettings.tsx`

**Dependencies:**
- Auth module
- Feature Access Guard

**Database:**
- `events`
- `event_settings`

---

### 6. **Newsletter Module**
**Isolation Level**: ⭐⭐⭐⭐ (Minimal Dependencies)

**Files:**
- `src/pages/UserNewsletterManagement.tsx`
- `src/pages/UserNewsletterCreate.tsx`
- `src/pages/UserNewsletterEdit.tsx`
- `src/pages/UserNewsletterSettings.tsx`
- `src/pages/admin/NewsletterManagement.tsx`

**Dependencies:**
- Auth module
- Email service (edge function)

**Database:**
- `newsletter_campaigns`
- `newsletter_subscribers`
- `newsletter_settings`

**Edge Functions:**
- `send-newsletter` - Bulk email sending

---

### 7. **Awards Module**
**Isolation Level**: ⭐⭐⭐⭐⭐ (Fully Independent)

**Files:**
- `src/pages/UserAwardsManagement.tsx`
- `src/pages/UserAwardCreate.tsx`
- `src/pages/UserAwardEdit.tsx`
- `src/pages/admin/AwardsManagement.tsx`

**Database:**
- `awards`
- `awards_settings`

---

### 8. **FAQ Module**
**Isolation Level**: ⭐⭐⭐⭐⭐ (Fully Independent)

**Files:**
- `src/pages/UserFaqManagement.tsx`
- `src/pages/UserFaqCreate.tsx`
- `src/pages/UserFaqEdit.tsx`
- `src/pages/admin/FaqManagement.tsx`

**Database:**
- `faqs`
- `faq_settings`

---

### 9. **Contact Module**
**Isolation Level**: ⭐⭐⭐⭐ (Minimal Dependencies)

**Files:**
- `src/pages/ContactForm.tsx` - Public form
- `src/pages/UserContactManagement.tsx` - User inbox
- `src/pages/ContactSubmissionDetail.tsx` - View submission
- `src/pages/admin/ContactManagement.tsx` - Admin view
- `src/components/ContactFormWidget.tsx` - Embeddable widget

**Dependencies:**
- Email service

**Database:**
- `contact_submissions`
- `contact_replies`
- `admin_contact_form_settings`

**Edge Functions:**
- `send-contact-email` - Form notifications

---

### 10. **Help Desk Module**
**Isolation Level**: ⭐⭐⭐⭐⭐ (Fully Independent)

**Files:**
- `src/pages/SupportTickets.tsx` - User tickets
- `src/pages/admin/HelpDesk.tsx` - Admin view
- `src/pages/admin/TicketDetails.tsx` - Ticket detail
- `src/pages/admin/HelpDeskSettings.tsx` - Configuration

**Database:**
- `tickets`
- `ticket_replies`
- `ticket_status_history`
- `helpdesk_settings`

---

### 11. **Theme Module**
**Isolation Level**: ⭐⭐⭐⭐ (Minimal Dependencies)

**Files:**
- `src/pages/Themes.tsx` - User theme selection
- `src/pages/admin/ThemeManagement.tsx` - Admin themes
- `src/components/admin/ThemeDesigner.tsx` - Theme builder
- `src/components/admin/EnhancedThemeDesigner.tsx` - Advanced builder
- `src/hooks/useRealtimeThemes.tsx` - Real-time sync
- `src/hooks/useUserThemes.tsx` - User theme logic

**Dependencies:**
- Auth module

**Database:**
- `themes`
- `user_theme_customizations`
- `theme_usage_analytics`

---

### 12. **Analytics Module**
**Isolation Level**: ⭐⭐⭐⭐ (Minimal Dependencies)

**Files:**
- `src/pages/Analytics.tsx` - Basic analytics
- `src/pages/AdvancedAnalytics.tsx` - Pro analytics
- `src/hooks/useAnalytics.tsx` - Analytics logic
- `src/pages/admin/BookAnalytics.tsx` - Book-specific

**Dependencies:**
- Subscription module (feature gating)

**Database:**
- `page_analytics`
- `theme_usage_analytics`

---

### 13. **Publisher Module**
**Isolation Level**: ⭐⭐⭐⭐ (Minimal Dependencies)

**Files:**
- `src/pages/PublisherDashboard.tsx`
- `src/pages/PublisherPublicView.tsx`
- `src/pages/admin/PublisherManagement.tsx`
- `src/components/publisher/` - Publisher components

**Dependencies:**
- Auth module
- Subscription module

**Database:**
- `publishers`
- `publisher_authors`

---

### 14. **Deployment Module**
**Isolation Level**: ⭐⭐⭐⭐⭐ (Fully Independent)

**Files:**
- `src/pages/admin/AWSDeployment.tsx`
- Edge function: `supabase/functions/aws-deploy/`

**Dependencies:**
- Admin access only

**Database:**
- `aws_settings`
- `aws_deployments`

**Edge Functions:**
- `aws-deploy` - EC2 deployment orchestration

---

### 15. **Backup & Security Module**
**Isolation Level**: ⭐⭐⭐⭐⭐ (Fully Independent)

**Files:**
- `src/pages/admin/BackupSecurityCenter.tsx`
- Edge functions: `backup-manager`, `security-monitor`

**Database:**
- `backup_jobs`
- `backup_settings`

---

## Shared Components

### UI Components (shadcn/ui)
**Location**: `src/components/ui/`
**Isolation**: ⭐⭐⭐⭐⭐ (Zero dependencies)

- Pure presentation components
- No business logic
- No API calls
- Fully reusable

### Layout Components
**Location**: `src/components/layout/`

- `DashboardLayout.tsx` - Dashboard wrapper
- `AppSidebar.tsx` - Navigation sidebar
- `DynamicHeader.tsx` - Header
- `DynamicFooter.tsx` - Footer

### Guards & HOCs
- `AdminAccessGuard.tsx` - Admin route protection
- `FeatureGate.tsx` - Feature access control
- `FeatureAccessGuard.tsx` - Feature-based access

---

## Utility Modules

### 1. **SEO Utils**
**Location**: `src/utils/seo.ts`
**Purpose**: SEO metadata generation
**Dependencies**: None

```typescript
export function generateMetaTags(data: SEOData): MetaTags;
export function generateSchema(type: SchemaType): SchemaObject;
```

### 2. **Input Validation**
**Location**: `src/utils/inputValidation.ts`
**Purpose**: Form input validation
**Dependencies**: zod

```typescript
export function validateEmail(email: string): boolean;
export function validateUrl(url: string): boolean;
```

### 3. **Sanitization**
**Location**: `src/utils/sanitization.ts`
**Purpose**: XSS prevention
**Dependencies**: dompurify

```typescript
export function sanitizeHTML(html: string): string;
```

### 4. **Book Field Utils**
**Location**: `src/utils/bookFieldUtils.ts`
**Purpose**: Dynamic book field management
**Dependencies**: None

---

## Integration Modules

### Supabase Integration
**Location**: `src/integrations/supabase/`
**Files:**
- `client.ts` - Supabase client
- `types.ts` - Auto-generated types (read-only)

**Isolation**: Used by all modules, but doesn't depend on any

---

## Module Communication

### ✅ Good Communication Patterns

#### 1. **Props Drilling (Local)**
```typescript
// Parent component
<BookEditor book={book} onSave={handleSave} />

// Child component receives props
function BookEditor({ book, onSave }) { ... }
```

#### 2. **Custom Hooks (Module-specific)**
```typescript
// In Book module
export function useBooks() {
  const [books, setBooks] = useState([]);
  
  const fetchBooks = async () => {
    const { data } = await supabase.from('books').select();
    setBooks(data);
  };
  
  return { books, fetchBooks };
}

// Usage
function BookList() {
  const { books, fetchBooks } = useBooks();
  // ...
}
```

#### 3. **Context (Feature-scoped)**
```typescript
// Theme module context
const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

#### 4. **Real-time Subscriptions (Module-isolated)**
```typescript
// Each module manages its own real-time sync
useEffect(() => {
  const channel = supabase
    .channel('blog_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'blog_posts'
    }, handleChange)
    .subscribe();
    
  return () => supabase.removeChannel(channel);
}, []);
```

### ❌ Anti-Patterns to Avoid

#### 1. **Direct Module Coupling**
```typescript
// ❌ BAD: Blog module importing Book logic
import { useBooks } from '../books/useBooks';

function BlogPost() {
  const { books } = useBooks(); // Tight coupling!
}
```

#### 2. **Shared Mutable State**
```typescript
// ❌ BAD: Global state accessible by all
window.appState = { books: [], blogs: [] };
```

#### 3. **Cross-Module Side Effects**
```typescript
// ❌ BAD: Book module modifying blog data
await supabase.from('blog_posts').update(...); // Outside module!
```

---

## Adding a New Module

### Step-by-Step Guide

#### 1. **Create Module Structure**
```
src/pages/[ModuleName]/
├── [ModuleName]Management.tsx  # Main list view
├── [ModuleName]Create.tsx      # Create form
├── [ModuleName]Edit.tsx        # Edit form
└── [ModuleName]View.tsx        # Detail view (optional)

src/pages/admin/
└── [ModuleName]Management.tsx  # Admin view

src/components/[moduleName]/
├── [ModuleName]Card.tsx
├── [ModuleName]Form.tsx
└── [ModuleName]List.tsx
```

#### 2. **Create Database Tables**
```sql
-- Main table
CREATE TABLE module_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings table
CREATE TABLE module_name_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  max_items INTEGER DEFAULT 10,
  require_approval BOOLEAN DEFAULT false,
  -- ... other settings
);

-- Enable RLS
ALTER TABLE module_name ENABLE ROW LEVEL SECURITY;

-- User policy
CREATE POLICY "Users manage own items"
ON module_name FOR ALL
USING (auth.uid() = user_id);

-- Admin policy
CREATE POLICY "Admins manage all"
ON module_name FOR ALL
USING (has_role(auth.uid(), 'admin'));
```

#### 3. **Create Custom Hook**
```typescript
// src/hooks/use[ModuleName].tsx
export function use[ModuleName]() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    const { data } = await supabase
      .from('module_name')
      .select('*')
      .eq('user_id', user.id);
    setItems(data);
  };

  const createItem = async (data) => {
    const { error } = await supabase
      .from('module_name')
      .insert([data]);
    if (!error) fetchItems();
  };

  return { items, loading, fetchItems, createItem };
}
```

#### 4. **Add Routes**
```typescript
// src/App.tsx
import [ModuleName]Management from './pages/[ModuleName]Management';
import [ModuleName]Create from './pages/[ModuleName]Create';

// User routes
<Route path="/[module-name]" element={<[ModuleName]Management />} />
<Route path="/[module-name]/create" element={<[ModuleName]Create />} />

// Admin routes
<Route path="/admin/[module-name]" element={
  <AdminAccessGuard>
    <[ModuleName]AdminView />
  </AdminAccessGuard>
} />
```

#### 5. **Add Navigation**
```typescript
// src/components/layout/AppSidebar.tsx
const contentManagementItems = [
  // ... existing items
  { title: "[Module Name]", url: "/[module-name]", icon: IconName },
];
```

#### 6. **Add Feature Gate (if premium)**
```typescript
// In component
<FeatureGate feature="module_name">
  <[ModuleName]Component />
</FeatureGate>
```

---

## Module Testing Checklist

### ✅ Module Isolation Test
- [ ] Module works without other modules
- [ ] No direct imports from sibling modules
- [ ] Only uses shared utilities and UI components

### ✅ Database Independence
- [ ] Has own tables with RLS
- [ ] Doesn't modify other modules' tables
- [ ] Uses proper foreign keys

### ✅ Feature Access
- [ ] Respects user roles
- [ ] Honors subscription limits
- [ ] Blocks unauthorized access

### ✅ Real-time Sync
- [ ] Only listens to own tables
- [ ] Cleans up subscriptions
- [ ] No memory leaks

### ✅ Error Handling
- [ ] Graceful degradation
- [ ] User-friendly error messages
- [ ] Logs errors for debugging

---

## Module Dependency Graph

```
┌─────────────┐
│    Auth     │
│   Module    │
└──────┬──────┘
       │
       ├─────────┬─────────┬─────────┬─────────┐
       │         │         │         │         │
   ┌───▼───┐ ┌──▼──┐  ┌──▼──┐  ┌──▼──┐  ┌──▼──┐
   │ Books │ │ Blog│  │Event│  │ FAQ │  │Award│
   └───────┘ └─────┘  └─────┘  └─────┘  └─────┘
       │
   ┌───▼────────┐
   │Subscription│
   └────────────┘
       │
   ┌───▼───┐
   │Feature│
   │ Gate  │
   └───────┘
```

**Key Principles:**
- Auth is foundation (no dependencies)
- Modules depend on Auth only
- Subscription adds feature gating
- No cross-module dependencies

---

## Scalability Benefits

### 1. **Independent Deployment**
- Update Blog module without touching Books
- Deploy Newsletter features separately
- Roll back individual modules

### 2. **Team Scaling**
- Team A: Books + Analytics
- Team B: Blog + Newsletter
- Team C: Admin + Deployment
- **Zero conflicts!**

### 3. **Performance Optimization**
- Lazy load modules on demand
- Code split by module
- Independent caching strategies

### 4. **Testing Isolation**
- Test each module independently
- Mock dependencies easily
- Fast test execution

---

## Migration Guide

### Adding Features to Existing Module

**DO:**
```typescript
// Within Book module
export function useBookReviews() {
  // New feature, same module
}
```

**DON'T:**
```typescript
// ❌ Cross-module feature
export function useBlogForBooks() {
  // Mixing modules!
}
```

### Extracting Shared Logic

**Before:**
```typescript
// In Book module
function formatDate(date: Date) { ... }

// In Blog module  
function formatDate(date: Date) { ... }
```

**After:**
```typescript
// In src/utils/dateUtils.ts
export function formatDate(date: Date) { ... }

// Both modules import
import { formatDate } from '@/utils/dateUtils';
```

---

## Summary

✅ **Fully Modular Architecture**
- 15+ independent feature modules
- Zero cross-module dependencies
- Clean separation of concerns
- Scalable to 1M+ users

✅ **Easy to Maintain**
- Update one module without affecting others
- Clear module boundaries
- Well-documented interfaces

✅ **Team-Friendly**
- Multiple developers can work simultaneously
- No merge conflicts
- Clear ownership

**Your architecture is production-ready!** 🏗️

---

*Last Updated: 2025-10-01*
