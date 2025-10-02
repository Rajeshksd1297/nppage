# Role-Based Feature Guide

## 🔴 ADMIN ROLE - Complete System Access

### User Management
- View all registered users with advanced filtering and search
- Create, edit, and delete user accounts
- Assign and modify user roles (admin, moderator, publisher, user)
- Block/unblock user accounts
- View user profiles and activity history
- Assign users to publishers
- Manage moderator permissions for specific features

### Publisher Management
- Create and manage publisher organizations
- Configure publisher branding (logo, colors, themes)
- Assign authors to publishers
- Set publisher-specific features and tools access
- Manage publisher public pages and profiles
- Configure publisher field customizations

### Content Management - Books
- View all books across all users
- Create, edit, and delete any book
- Configure book field settings (custom fields, validations)
- Manage book categories and genres
- Set up ISBN lookup integration
- Configure affiliate link settings
- Bulk book operations and imports (ONIX support)

### Content Management - Blog
- Manage all blog posts from all users
- Approve/reject blog posts if approval is enabled
- Configure blog settings (categories, max lengths, image settings)
- Set default blog status and auto-slug generation
- Manage blog categories and allowed image types

### Content Management - Events
- Manage all events from all users
- Configure event settings (categories, max attendees, duration)
- Set event approval requirements
- Manage event types and registration settings

### Content Management - Awards
- Manage all awards from all users
- Configure award settings (categories, verification, certificates)
- Set award approval requirements
- Manage award categories and image settings

### Content Management - FAQs
- Manage all FAQ entries from all users
- Configure FAQ settings (categories, max lengths, approval)
- Set FAQ ordering and public display settings
- Manage FAQ categories

### Content Management - Gallery
- Manage all gallery items from all users
- Configure gallery settings (categories, image sizes, watermarks)
- Set gallery approval requirements
- Manage gallery categories and compression settings

### Newsletter Management
- View all newsletter campaigns
- Manage newsletter subscribers across all users
- Configure global newsletter settings
- Access newsletter analytics
- Send newsletters to subscriber lists

### Contact Form Management
- View all contact submissions from all users
- Reply to contact submissions
- Configure global contact form settings (spam protection, required fields)
- Manage contact form security (rate limiting, blocked domains)
- View contact analytics

### Support/Help Desk
- View and manage all support tickets
- Assign tickets to team members
- Configure helpdesk settings (SLA, business hours, categories)
- Manage ticket statuses and priorities
- View ticket analytics

### SEO Management
- Configure global SEO settings (site title, description, keywords)
- Manage meta tags and schema markup
- Set up site verification (Google, Bing)
- Configure social media integration (Open Graph, Twitter Cards)
- Manage robots.txt and sitemap settings
- Access AI-powered SEO suggestions

### Theme & Design Management
- Create and manage global themes
- Configure theme settings (colors, fonts, layouts)
- Set premium themes and access controls
- Real-time theme preview and editing
- Manage header and footer configurations
- Configure hero blocks and home page sections

### Home Page Management
- Edit home page sections and layouts
- Configure hero blocks with custom content
- Manage section order and visibility
- Visual page editor for drag-and-drop customization
- Preview changes before publishing

### Cookie & Privacy Management
- Configure cookie consent settings
- Manage cookie categories (required, optional)
- Set cookie banner appearance and behavior
- View cookie consent logs
- Configure GDPR compliance settings

### Domain & Deployment
- Manage custom domains
- Configure domain DNS settings
- Deploy to AWS (EC2 instances)
- Deploy to GoDaddy via FTP
- View deployment history and logs
- Monitor deployment status in real-time

### Backup & Security
- Configure automated backup schedules
- Perform manual backups (database, files, configuration)
- Manage backup retention and storage
- View security audit logs
- Download system configuration files
- Monitor security events and anomalies

### Analytics & Reporting
- View comprehensive site analytics
- Monitor user engagement metrics
- Track content performance
- View subscription analytics
- Export reports and data

### System Settings
- Configure AI platform integrations (OpenAI, Gemini)
- Manage API keys and secrets
- Configure email settings (Resend integration)
- Set up payment processing
- Manage subscription plans
- Configure role permissions

---

## 🟢 USER ROLE - Personal Content & Profile Management

### Profile Management
- Edit personal profile (name, bio, avatar, social links)
- Customize profile theme and layout
- Configure SEO settings for public profile
- Manage profile slug/URL
- Drag-and-drop profile designer
- Set profile visibility (public/private)

### Book Management
- Create and manage own books
- Upload book covers and images
- Add purchase links and affiliates
- Set book metadata (ISBN, genres, tags)
- Configure book SEO settings
- Publish/unpublish books
- View book analytics (if available)

### Blog Management
- Create and manage own blog posts
- Upload featured images
- Add tags and categories
- Configure post SEO settings
- Schedule publishing dates
- Manage post drafts and published content

### Event Management
- Create and manage own events
- Set event dates, locations, and details
- Upload event images
- Configure registration settings
- Manage virtual vs in-person events
- Track event attendees

### Award Management
- Add and manage own awards
- Upload award images and certificates
- Set award dates and categories
- Feature important awards
- Organize award display order

### FAQ Management
- Create and manage own FAQ entries
- Organize FAQs by category
- Set FAQ visibility and order
- Add detailed answers with formatting

### Gallery Management
- Upload and manage gallery images
- Organize images by category
- Add image descriptions and alt text
- Feature selected images
- Set image display order

### Newsletter Management
- Create newsletter campaigns
- Manage subscriber lists
- Configure newsletter settings
- View subscriber statistics
- Send newsletters to subscribers

### Contact Form
- Receive contact submissions on public profile
- Reply to contact messages
- Configure contact form settings
- View contact submission history
- Manage contact preferences

### Theme Customization
- Select from available themes
- Customize theme colors within limits
- Preview theme changes
- Access free themes (Pro themes require subscription)

### Subscription Management
- View current subscription plan
- Upgrade/downgrade plans
- View subscription limits and usage
- Manage billing information
- Cancel subscription

### Analytics (Limited)
- View own content statistics
- Track profile visits
- Monitor engagement on own content

---

## 🟣 PUBLISHER ROLE - Author & Brand Management

### Publisher Profile
- Manage publisher organization profile
- Configure branding (logo, colors, tagline)
- Set up publisher bio and description
- Manage publisher social links
- Configure public publisher page

### Author Management
- Add and manage authors under publisher
- Assign books to authors
- Set author permissions
- View author analytics
- Manage author profiles

### Brand Settings
- Customize publisher theme
- Set brand colors and typography
- Upload brand assets (logos, images)
- Configure email templates with branding

### Content Oversight
- View all books from assigned authors
- Monitor author content submissions
- Access aggregated analytics across authors
- Manage publisher-wide content settings

### Tools & Features Access
- Access publisher-specific tools (based on plan)
- Manage affiliate programs
- Configure publisher-wide SEO settings
- Set up publisher newsletter

### Billing & Subscriptions
- Manage publisher subscription
- View usage across all authors
- Handle billing for multiple authors
- Upgrade publisher plan

---

## 🟡 MODERATOR ROLE - Feature-Specific Management

### Configurable Permissions
Moderators can have granular permissions for each feature:

**Permission Types:**
- **View**: Can see content
- **Create**: Can add new content
- **Edit**: Can modify existing content
- **Delete**: Can remove content
- **Approve**: Can approve pending content

**Available Features:**
- Newsletter Management
- Blog Posts
- Events
- Awards
- FAQs
- Books
- Gallery
- Contact Submissions
- Support Tickets
- User Management

### Example Permission Sets:

**Content Moderator:**
- Blog: View, Create, Edit, Approve
- Events: View, Edit, Approve
- FAQs: View, Edit, Approve
- Gallery: View, Approve

**Support Moderator:**
- Contact Submissions: View, Edit
- Support Tickets: View, Create, Edit
- Users: View only

**Community Manager:**
- Newsletter: View, Create
- Blog: View, Create, Edit
- Events: View, Create, Edit
- Awards: View, Approve

---

## 🔐 Security & Role Hierarchy

### Role Hierarchy (Highest to Lowest):
1. **Admin** - Full system access
2. **Publisher** - Organization management + User permissions
3. **Moderator** - Feature-specific permissions (configurable)
4. **User** - Personal content only

### Security Notes:
- Roles are stored in separate `user_roles` table (prevents privilege escalation)
- All role checks use server-side validation via RLS policies
- Admin can assign multiple roles to single user
- Moderator permissions are granularly controlled per feature
- All actions are audit-logged for security tracking

---

## 📋 Quick Reference - "Can I do this?"

| Feature | User | Moderator* | Publisher | Admin |
|---------|------|-----------|-----------|-------|
| Manage own profile | ✅ | ✅ | ✅ | ✅ |
| Manage own books | ✅ | ✅* | ✅ | ✅ |
| View all books | ❌ | ❌ | ✅** | ✅ |
| Manage themes | ❌ | ❌ | ✅*** | ✅ |
| Manage users | ❌ | ✅* | ❌ | ✅ |
| Configure system | ❌ | ❌ | ❌ | ✅ |
| Approve content | ❌ | ✅* | ❌ | ✅ |
| Assign roles | ❌ | ❌ | ❌ | ✅ |
| Deploy website | ❌ | ❌ | ❌ | ✅ |
| Manage backups | ❌ | ❌ | ❌ | ✅ |

*Moderator permissions are configurable per feature
**Publisher can only see books from assigned authors
***Publisher can customize branding within their organization

---

## 🎯 Common User Workflows

### As a USER - "I want to publish my book"
1. Go to Dashboard → Books
2. Click "Add New Book"
3. Fill in book details (title, description, ISBN)
4. Upload cover image
5. Add purchase links
6. Configure SEO settings
7. Set status to "Published"
8. Share your public profile URL

### As a PUBLISHER - "I want to onboard a new author"
1. Go to Publisher Dashboard → Authors
2. Click "Add Author"
3. Enter author email
4. Assign permissions
5. Author receives invitation
6. Configure author's branding
7. Monitor author's content

### As an ADMIN - "I need to configure the site"
1. Go to Admin Dashboard → Settings
2. Configure global SEO settings
3. Set up themes
4. Configure home page sections
5. Enable/disable features
6. Set up backup schedule
7. Configure cookie consent

### As a MODERATOR - "I need to review content"
1. Go to assigned feature (e.g., Blog Management)
2. Filter by status "Pending Review"
3. Review content quality
4. Approve or request changes
5. Content appears on public site

---

## 📞 Support & Questions

For any role-related questions or permission issues:
1. Contact your system administrator
2. Submit a support ticket
3. Check the documentation
4. Review your subscription plan limits

**Note:** Some features may require specific subscription plans (Free, Pro, Publisher).