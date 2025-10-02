# 📚 COMPLETE PORTAL GUIDE
## Comprehensive Feature-by-Feature Documentation

---

## 🔐 AUTHENTICATION & ACCESS

### Login Page (`/auth`)
- **Email/Password Login**: Standard authentication
- **Google OAuth**: One-click social login
- **Sign Up Button**: Creates new account with automatic 30-day Pro trial
- **Forgot Password**: Email-based password reset
- **Post-Login**: Redirects to Dashboard based on role

### First-Time Setup
- New users automatically get:
  - Profile created with slug from email
  - 30-day Pro trial subscription
  - Default "user" role assigned
  - Welcome email sent

---

## 📊 USER DASHBOARD (`/dashboard`)

### Welcome Section
- **Personalized Greeting**: Shows user's full name
- **Quick Stats Cards**:
  - Total Books count
  - Published Books count
  - Draft Books count
  - Total Views/Analytics

### Dashboard Features Card
- **My Books**: Navigate to book management
- **Profile Settings**: Edit profile information
- **Theme Customization**: Access theme designer
- **Analytics**: View performance metrics

### Trial Banner (if applicable)
- Shows days remaining in trial
- **Upgrade Now** button → redirects to `/subscription`
- Auto-hides after trial expires

---

## 📖 BOOKS MANAGEMENT

### Books List Page (`/books`)
- **View Options**:
  - Grid view (default)
  - List view
  - Table view
- **Search Bar**: Real-time filtering by title, ISBN, author
- **Filter Dropdowns**:
  - Status: All, Published, Draft, Archived
  - Category: All, Fiction, Non-Fiction, etc.
  - Genre: Multiple selection
  - Language: Multiple selection
- **Sort Options**:
  - Newest first
  - Oldest first
  - Title A-Z
  - Title Z-A
- **Add New Book Button** → redirects to `/book/entry-method`

### Each Book Card Shows:
- Cover image
- Title & Subtitle
- Author name
- Publication date
- Status badge (Published/Draft/Archived)
- **Action Buttons**:
  - **View** → `/books/{slug}` (public preview)
  - **Edit** → `/book/edit/{id}` (edit form)
  - **Duplicate** (creates copy with "-copy" suffix)
  - **Delete** (confirmation dialog)

---

### Book Entry Method Page (`/book/entry-method`)

**TWO SEPARATE OPTIONS - NO POPUP:**

#### Option 1: ISBN Search
- **ISBN Input Field**: 10 or 13 digit ISBN
- **Search Button**: Fetches data from Google Books API
- **What Happens**:
  1. Searches Google Books API
  2. Auto-fills: title, author, description, cover image
  3. Generates affiliate purchase links (Amazon, Barnes & Noble, etc.)
  4. Pre-fills form data in localStorage
  5. Redirects to `/book/new` with data

#### Option 2: Manual Entry
- **Manual Entry Button** → redirects to `/book/new`
- **What Happens**:
  1. Clears any pre-filled data
  2. Opens blank book form
  3. User fills all fields manually
  4. No automatic affiliate links (unless ISBN added later)

**Help Section Displayed:**
- What is an ISBN?
- Why use ISBN search?
- Benefits of affiliate links

---

### Book Form Page (`/book/new` or `/book/edit/{id}`)

**SEPARATE PAGE - NOT A POPUP**

#### Basic Information Section
- **Title** (required, max 200 characters)
- **Subtitle** (optional, max 200 characters)
- **Description** (rich text editor, max 5000 characters)
- **ISBN** (optional, validated format)
  - **ISBN Lookup Button** (if editing and ISBN not set)

#### Publication Details Section
- **Status Dropdown**: Draft, Published, Archived
- **Publication Date** (date picker)
- **Publisher** (text input)
- **Language** (dropdown: English, Spanish, French, etc.)
- **Page Count** (number input)

#### Categorization Section
- **Category** (dropdown: Fiction, Non-Fiction, Biography, etc.)
- **Genres** (multi-select: Mystery, Romance, Sci-Fi, etc.)
- **Tags** (chip input, press Enter to add)

#### Media Section
- **Cover Image**:
  - Upload button (JPEG, PNG, WebP - max 5MB)
  - Preview thumbnail
  - Remove button
  - If ISBN search used: auto-populated

#### Purchase Links Section
- **Dynamic Purchase Link Manager**:
  - Platform name input (Amazon, Barnes & Noble, etc.)
  - URL input (full purchase link)
  - **Add Link** button
  - **Remove Link** button for each entry
- If ISBN provided: Auto-generates based on affiliate settings

#### SEO Section (Optional)
- **SEO Title** (max 60 characters)
- **SEO Description** (max 160 characters)
- **SEO Keywords** (comma-separated)
- **Slug** (auto-generated from title, editable)

#### Action Buttons
- **Save Book** (validates & saves to database)
- **Save as Draft** (sets status to draft)
- **Cancel** → back to `/books`

---

## 📝 BLOG MANAGEMENT

### Blog Posts List (`/user/blog`)

**SEPARATE PAGE FOR LISTING**

- **View All Posts**: Paginated table
- **Search Bar**: Filter by title, category, tags
- **Filter Options**:
  - Status: All, Published, Draft, Pending
  - Category: Dynamic from settings
  - Featured: Yes/No
- **Add New Post Button** → `/user/blog/create`

### Each Blog Post Row Shows:
- Featured image thumbnail
- Title
- Category badge
- Status badge
- Published date
- Word count
- Reading time
- **Action Buttons**:
  - **View** (preview)
  - **Edit** → `/user/blog/edit/{id}`
  - **Delete** (confirmation)

---

### Blog Post Create Page (`/user/blog/create`)

**SEPARATE PAGE - NOT A POPUP**

#### Content Section
- **Title** (required, max 100 characters)
- **Slug** (auto-generated, editable)
- **Excerpt** (optional, max 300 characters)
- **Content** (rich text editor - React Quill)
  - Bold, italic, underline formatting
  - Headings (H1-H6)
  - Lists (ordered, unordered)
  - Links, images
  - Code blocks
  - Max 50,000 characters

#### Categorization Section
- **Category** (dropdown from blog_settings)
- **Tags** (chip input, multiple allowed)
- **Featured** (toggle switch)

#### Media Section
- **Featured Image**:
  - Upload button (JPEG, PNG, WebP - max 5MB)
  - Preview
  - Alt text input (for SEO)

#### Publishing Section
- **Status Dropdown**:
  - Draft (save without publishing)
  - Published (goes live immediately)
  - Pending (requires approval if settings require it)
- **Publish Date** (date-time picker)
- **Published At** (shows if already published)

#### SEO Metadata Section
- **Meta Title** (max 60 characters)
- **Meta Description** (max 160 characters)

#### Statistics (auto-calculated)
- Word Count (displayed)
- Reading Time (displayed, ~200 words/min)

#### Action Buttons
- **Publish** (sets status to published)
- **Save as Draft**
- **Preview** (opens preview in new tab)
- **Cancel** → back to `/user/blog`

---

### Blog Post Edit Page (`/user/blog/edit/{id}`)

**SEPARATE PAGE - NOT A POPUP**

- Same form as Create
- Pre-filled with existing data
- Shows approval status if pending
- Shows approved by & date if approved
- **Additional Actions**:
  - **Unpublish** (if published)
  - **Request Approval** (if draft and approval required)

---

## 🎉 EVENTS MANAGEMENT

### Events List Page (`/user/events`)

**SEPARATE PAGE FOR LISTING**

- **Calendar View Option**: Monthly calendar with events
- **List View Option**: Table format
- **Search Bar**: Filter by title, location, type
- **Filter Options**:
  - Status: All, Upcoming, Past, Cancelled
  - Event Type: Conference, Workshop, Meetup, Webinar, Seminar
  - Virtual/In-Person: All, Virtual, In-Person
- **Add New Event Button** → `/user/events/create`

### Each Event Row Shows:
- Featured image
- Title
- Event date & time
- End date (if multi-day)
- Location (or "Virtual")
- Event type badge
- Status badge
- Current attendees / Max attendees
- **Action Buttons**:
  - **View Details** (popup with full info)
  - **Edit** → `/user/events/edit/{id}`
  - **Copy Join Link** (if virtual)
  - **Delete** (confirmation)

---

### Event Create Page (`/user/events/create`)

**SEPARATE PAGE - NOT A POPUP**

#### Basic Information Section
- **Title** (required, max 100 characters)
- **Description** (rich text, max 2000 characters)
- **Event Type** (dropdown from event_settings categories)

#### Date & Time Section
- **Event Date** (date-time picker, required)
- **End Date** (date-time picker, optional for multi-day)
- **Duration Calculator** (shows total time)

#### Location Section
- **Is Virtual** (toggle switch)
- **If Virtual**:
  - Meeting Link (Zoom, Google Meet, etc.)
- **If In-Person**:
  - Location (text input, address)
  - Venue name

#### Registration Section
- **Registration Required** (toggle)
- **Max Attendees** (number input, optional)
- **Current Attendees** (read-only, shows count)
- **Registration Deadline** (date picker)

#### Media Section
- **Featured Image**:
  - Upload (JPEG, PNG, WebP - max 5MB)
  - Preview
  - Alt text

#### Publishing Section
- **Status Dropdown**:
  - Upcoming (default for future events)
  - Past (for completed events)
  - Cancelled

#### Action Buttons
- **Create Event**
- **Save as Draft**
- **Cancel** → back to `/user/events`

---

### Event Edit Page (`/user/events/edit/{id}`)

**SEPARATE PAGE - NOT A POPUP**

- Same form as Create
- Pre-filled with existing data
- **Additional Info Displayed**:
  - Created date
  - Last updated
  - Total views (if analytics enabled)
- **Additional Actions**:
  - **Mark as Completed** (changes status to Past)
  - **Cancel Event** (changes status to Cancelled)
  - **Duplicate** (creates copy)

---

## 🏆 AWARDS MANAGEMENT

### Awards List Page (`/user/awards`)

**SEPARATE PAGE FOR LISTING**

- **Display Options**:
  - Grid view (cards with images)
  - List view (table format)
- **Search Bar**: Filter by title, organization, category
- **Filter Options**:
  - Category: Dynamic from awards_settings
  - Featured: Yes/No
  - Year: Dropdown of all years
- **Sort Options**:
  - Date (newest first)
  - Date (oldest first)
  - Title A-Z
- **Add New Award Button** → `/user/awards/create`

### Each Award Card Shows:
- Award image
- Title
- Organization
- Award date
- Category badge
- Featured star (if featured)
- **Action Buttons**:
  - **View** (preview)
  - **Edit** → `/user/awards/edit/{id}`
  - **Download Certificate** (if uploaded)
  - **Delete** (confirmation)

---

### Award Create Page (`/user/awards/create`)

**SEPARATE PAGE - NOT A POPUP**

#### Basic Information Section
- **Title** (required, max 100 characters)
- **Description** (textarea, max 1000 characters)
- **Organization** (text input, who gave the award)
- **Award Date** (date picker, required)

#### Categorization Section
- **Category** (dropdown from awards_settings)
- **Is Featured** (toggle - shows on profile prominently)
- **Sort Order** (number input for custom ordering)

#### Media Section
- **Award Image**:
  - Upload button (JPEG, PNG, WebP - max 5MB)
  - Preview thumbnail
  - Alt text for accessibility
- **Certificate**:
  - Upload PDF/image of certificate
  - Preview/download link
  - Optional field

#### Action Buttons
- **Create Award**
- **Save as Draft** (if approval required)
- **Cancel** → back to `/user/awards`

---

### Award Edit Page (`/user/awards/edit/{id}`)

**SEPARATE PAGE - NOT A POPUP**

- Same form as Create
- Pre-filled with existing data
- Shows approval status (if approval required in settings)
- **Additional Actions**:
  - **Toggle Featured** (quick action)
  - **Reorder** (change sort order)

---

## ❓ FAQ MANAGEMENT

### FAQ List Page (`/user/faqs`)

**SEPARATE PAGE FOR LISTING**

- **View All FAQs**: Accordion-style preview
- **Search Bar**: Filter by question or answer
- **Filter Options**:
  - Category: Dynamic from faq_settings
  - Published Status: All, Published, Unpublished
- **Sort Options**:
  - Sort order (custom)
  - Date created
  - Alphabetical
- **Add New FAQ Button** → `/user/faqs/create`

### Each FAQ Row Shows:
- Question (truncated)
- Category badge
- Published status badge
- Sort order number
- **Action Buttons**:
  - **Edit** → `/user/faqs/edit/{id}`
  - **Toggle Published** (quick action)
  - **Move Up/Down** (reorder)
  - **Delete** (confirmation)

---

### FAQ Create Page (`/user/faqs/create`)

**SEPARATE PAGE - NOT A POPUP**

#### Content Section
- **Question** (required, max 200 characters)
- **Answer** (textarea, max 2000 characters)
  - Rich text formatting if enabled in settings
- **Category** (dropdown from faq_settings)

#### Publishing Section
- **Is Published** (toggle)
  - If settings require approval: starts as unpublished
- **Sort Order** (number input for custom ordering)

#### Action Buttons
- **Create FAQ**
- **Save as Unpublished**
- **Preview** (shows how it will appear)
- **Cancel** → back to `/user/faqs`

---

### FAQ Edit Page (`/user/faqs/edit/{id}`)

**SEPARATE PAGE - NOT A POPUP**

- Same form as Create
- Pre-filled with existing data
- Shows approval status (if required)
- **Additional Actions**:
  - **Quick Publish Toggle**
  - **Duplicate** (creates copy)

---

## 🖼️ GALLERY MANAGEMENT

### Gallery Page (`/user/gallery`)

**SEPARATE PAGE FOR LISTING**

- **Masonry Grid Layout**: Pinterest-style
- **Search Bar**: Filter by title, category, alt text
- **Filter Options**:
  - Category: Dynamic from gallery_settings
  - Featured: Yes/No
- **Sort Options**:
  - Sort order (custom)
  - Newest first
  - Oldest first
- **Upload New Image Button** → Opens upload form on same page

### Image Upload Section (on same page)
- **Drag & Drop Zone**: Drop images to upload
- **File Browser Button**: Click to select files
- **Multi-Upload Support**: Upload multiple images at once
- **Allowed Types**: From gallery_settings (JPG, PNG, WebP, GIF)
- **Max Size**: From gallery_settings (default 10MB)

#### For Each Image Upload:
- **Title** (required, max 100 characters)
- **Description** (optional, max 500 characters)
- **Alt Text** (for SEO & accessibility)
- **Category** (dropdown from gallery_settings)
- **Is Featured** (toggle)
- **Sort Order** (number input)

### Each Gallery Image Shows:
- Image thumbnail
- Title overlay on hover
- Category badge
- Featured star (if applicable)
- **Action Buttons** (on hover):
  - **View Full Size** (lightbox)
  - **Edit Details** (inline form)
  - **Download** (original file)
  - **Delete** (confirmation)

---

## 📧 NEWSLETTER MANAGEMENT

### Newsletter List Page (`/user/newsletters`)

**SEPARATE PAGE FOR LISTING**

- **All Newsletters Table**: Shows sent and draft
- **Search Bar**: Filter by subject, content
- **Filter Options**:
  - Status: All, Draft, Sent, Scheduled
  - Date Range: Custom date picker
- **Add New Newsletter Button** → `/user/newsletters/create`

### Each Newsletter Row Shows:
- Subject line
- Status badge (Draft/Sent/Scheduled)
- Send date (if scheduled/sent)
- Recipient count (if sent)
- Open rate % (if sent and tracking enabled)
- Click rate % (if sent and tracking enabled)
- **Action Buttons**:
  - **Edit** → `/user/newsletters/edit/{id}` (if draft)
  - **View** (preview sent newsletter)
  - **Duplicate** (create copy)
  - **Delete** (confirmation, only drafts)

---

### Newsletter Create Page (`/user/newsletters/create`)

**SEPARATE PAGE - NOT A POPUP**

#### Content Section
- **Subject Line** (required, max 200 characters)
- **Preview Text** (appears in inbox preview, max 100 characters)
- **From Name** (defaults to user's name, editable)
- **Reply-To Email** (defaults to user's email)
- **Newsletter Content** (rich text editor):
  - Full HTML email editor
  - Template selection dropdown
  - Variables: {{subscriber_name}}, {{unsubscribe_link}}
  - Image uploads
  - Button creator
  - Link inserter

#### Recipients Section
- **Send To Options**:
  - All Subscribers (checkbox)
  - Specific Segments (multi-select)
  - Test Email (send to yourself first)
- **Subscriber Count Display**: Shows how many will receive

#### Scheduling Section
- **Send Now** (radio button)
- **Schedule for Later** (radio button)
  - Date-time picker
  - Timezone selector
- **Save as Draft** (radio button)

#### Preview & Test Section
- **Preview Button**: Opens email preview in new window
- **Send Test Email**: Enter email to receive test
- **Device Preview**: Desktop/Mobile/Tablet views

#### Action Buttons
- **Send Newsletter** (if Send Now selected)
- **Schedule** (if Schedule selected)
- **Save Draft**
- **Cancel** → back to `/user/newsletters`

---

### Newsletter Edit Page (`/user/newsletters/edit/{id}`)

**SEPARATE PAGE - NOT A POPUP**

- Same form as Create (only for drafts)
- If already sent: Shows as read-only with statistics
- **Statistics Displayed** (if sent):
  - Total sent
  - Delivered count
  - Bounced count
  - Opened count & %
  - Clicked count & %
  - Unsubscribed count

---

### Newsletter Subscribers Page (`/user/newsletters/subscribers`)

**SEPARATE PAGE FOR SUBSCRIBER MANAGEMENT**

- **All Subscribers Table**:
  - Email address
  - Name (if collected)
  - Subscribe date
  - Status (Active/Unsubscribed)
  - Source (Form/Import)
- **Search Bar**: Filter by email, name
- **Filter Options**:
  - Status: All, Active, Unsubscribed
  - Source: All, Form, Import
- **Export Subscribers Button**: Download CSV
- **Import Subscribers Button**: Upload CSV
  - Opens import form
  - CSV format helper
  - Duplicate detection
- **Add Subscriber Manually Button**: Opens form
  - Email (required)
  - Name (optional)
  - Consent confirmation checkbox

### Each Subscriber Row Shows:
- **Action Buttons**:
  - **Edit** (update name/email)
  - **Unsubscribe** (mark as unsubscribed)
  - **Delete** (permanent removal, confirmation)

---

### Newsletter Settings Page (`/user/newsletters/settings`)

**SEPARATE PAGE FOR CONFIGURATION**

#### Email Configuration Section
- **From Name** (default for all newsletters)
- **From Email** (must be verified)
- **Reply-To Email**
- **Email Verification Status**: Shows if verified
- **Verify Email Button**: Sends verification link

#### Subscription Form Settings
- **Enable Signup Form** (toggle)
- **Require Name Field** (toggle)
- **Require Consent Checkbox** (toggle)
- **Consent Text** (textarea, GDPR compliance)
- **Success Message** (after subscription)
- **Confirmation Email Settings**:
  - Enable double opt-in (toggle)
  - Confirmation email template

#### Unsubscribe Settings
- **Unsubscribe Link Text** (customizable)
- **Unsubscribe Page Message** (textarea)
- **Reason Collection** (toggle to ask why)

#### Tracking Settings
- **Enable Open Tracking** (toggle)
- **Enable Click Tracking** (toggle)

#### Action Buttons
- **Save Settings**
- **Reset to Defaults**

---

## 💬 CONTACT FORM MANAGEMENT

### Contact Submissions Page (`/user/contact`)

**SEPARATE PAGE FOR INBOX**

- **Inbox Table**: All received messages
- **Search Bar**: Filter by name, email, message
- **Filter Options**:
  - Status: All, New, Read, Replied, Resolved
  - Priority: All, High, Medium, Low
  - Date Range: Custom picker
  - Source: All, Contact Form, Direct, Other
- **Status Counter Cards**:
  - New (red badge)
  - In Progress (yellow badge)
  - Resolved (green badge)

### Each Submission Row Shows:
- Name
- Email
- Subject (if collected)
- Message preview (truncated)
- Status badge
- Priority indicator
- Submit date & time
- Source
- **Action Buttons**:
  - **View Details** → `/user/contact/{id}`
  - **Mark as Read** (quick action)
  - **Reply** (opens reply form)
  - **Delete** (confirmation)

---

### Contact Submission Detail Page (`/user/contact/{id}`)

**SEPARATE PAGE - NOT A POPUP**

#### Message Details Section
- **From**: Name & Email (click to copy)
- **Submitted At**: Date & time
- **Status**: Dropdown to change (New/Read/In Progress/Resolved)
- **Priority**: Dropdown to change (Low/Medium/High)
- **Source**: Display only
- **Message Content**: Full message display
- **Attachments** (if any):
  - List of files with download links
  - File type & size shown

#### Metadata Section
- **User IP**: Displayed (if captured)
- **User Agent**: Browser info
- **Submission Metadata**: Any custom fields collected

#### Reply Section
- **Reply History**: Shows all previous replies
  - Reply message
  - Replied by (name)
  - Reply date & time
  - Internal note indicator
- **New Reply Form**:
  - **Reply Message** (textarea with rich text)
  - **Internal Note** (toggle - not sent to submitter)
  - **Send Reply Button**
    - Sends email to submitter
    - Records in reply history
    - Updates status to "Replied"
  - **Save Note Button** (if internal note)

#### Action Buttons
- **Reply** (opens reply form if collapsed)
- **Mark Resolved** (changes status)
- **Assign To** (if multi-user setup)
- **Delete** (confirmation)
- **Back to Inbox** → `/user/contact`

---

### Contact Form Settings Page (`/user/contact/settings`)

**SEPARATE PAGE FOR CONFIGURATION**

#### Form Field Settings
- **Required Fields** (multi-select):
  - Name
  - Email
  - Subject
  - Message
  - Phone (if enabled)
- **Enable Phone Field** (toggle)
- **Enable Company Field** (toggle)
- **Enable Attachments** (toggle)
  - Max attachment size (MB)
  - Allowed file types (multi-select)

#### Security Settings
- **Enable Honeypot** (toggle - spam protection)
- **Rate Limiting**:
  - Max submissions per hour (per IP)
- **Auto Moderation** (toggle - AI spam detection)
- **Blocked Domains**: List of email domains to block
  - Add domain button
  - Remove domain for each

#### Email Notification Settings
- **Send Email on New Submission** (toggle)
- **Notification Email**: Where to send alerts
- **Email Template**: Customize notification format

#### Data Retention
- **Retention Days**: How long to keep submissions
- **Auto-Delete After Retention** (toggle)

#### Action Buttons
- **Save Settings**
- **Reset to Defaults**
- **Test Form** (opens public form in new tab)

---

## 🎨 THEME CUSTOMIZATION

### Theme Selection Page (`/themes`)

**SEPARATE PAGE FOR BROWSING THEMES**

- **Available Themes Grid**:
  - Preview thumbnails
  - Theme name
  - Description
  - "Free" or "Pro" badge
- **Filter Options**:
  - Plan Required: All, Free, Pro
  - Category: All, Modern, Classic, Minimal, Bold
- **Search Bar**: Filter by theme name

### Each Theme Card Shows:
- **Preview Image**
- **Theme Name & Description**
- **Color Palette Preview** (color dots)
- **Action Buttons**:
  - **Preview** (opens live preview in iframe)
  - **Apply Theme** (if unlocked)
  - **Customize** → `/themes/customize/{id}`
  - **Upgrade to Access** (if locked, Pro theme)

---

### Theme Customization Page (`/themes/customize/{id}`)

**SEPARATE PAGE - NOT A POPUP**

#### Live Preview Section (Left Half)
- **Live Preview Frame**: Shows your profile/site with theme applied
- **Device Preview Buttons**:
  - Desktop
  - Tablet
  - Mobile
- **Refresh Preview Button**

#### Customization Panel (Right Half)

##### Color Scheme Section
- **Primary Color**: Color picker
- **Secondary Color**: Color picker
- **Accent Color**: Color picker
- **Background Color**: Color picker
- **Text Color**: Color picker
- **Reset to Defaults** button

##### Typography Section
- **Heading Font**: Dropdown (Google Fonts)
- **Body Font**: Dropdown (Google Fonts)
- **Font Size Scale**: Slider (small/medium/large)
- **Line Height**: Slider
- **Letter Spacing**: Slider

##### Layout Section
- **Header Style**: Dropdown (Transparent, Solid, Gradient)
- **Footer Style**: Dropdown (Simple, Detailed, Minimal)
- **Content Width**: Slider (narrow/wide)
- **Section Spacing**: Slider (compact/spacious)
- **Border Radius**: Slider (sharp/rounded)

##### Component Styles Section
- **Button Style**: Dropdown (Flat, Outlined, 3D, Gradient)
- **Card Style**: Dropdown (Flat, Shadow, Border, Elevated)
- **Image Style**: Dropdown (Square, Rounded, Circle)

##### Advanced Section (Collapsible)
- **Custom CSS**: Textarea for advanced users
- **Import/Export Theme**: JSON format
- **Reset All Customizations** button

#### Action Buttons
- **Save Customizations** (persists to database)
- **Apply to Profile** (makes active)
- **Save as New Theme** (creates custom theme)
- **Discard Changes** → back to `/themes`

---

## 👤 PROFILE SETTINGS

### Profile Settings Page (`/profile`)

**SEPARATE PAGE WITH 3 TABS**

#### Tab 1: Profile (Basic Information)
**Profile Information Card:**
- **Full Name**: Text input (required)
- **Bio**: Textarea (max 500 characters)
- **Profile Picture**:
  - Upload button (max 5MB, JPEG/PNG/WebP)
  - Preview circle (displays current avatar)
  - Remove button
- **Cover Image/Banner**:
  - Upload button (max 5MB)
  - Preview rectangle
  - Remove button
- **Location**: Text input (city, country)
- **Website URL**: URL input (personal website)
- **Mobile Number**: Phone input (with country code selector)
- **Public Profile**: Toggle (make profile publicly visible)
- **Custom Slug**: Text input (unique URL identifier)
  - Shows current URL: `yoursite.com/{slug}`
  - Real-time availability checker
  - Auto-validation
- **Specializations**: Multi-select tags (areas of expertise)
- **Save & Next** button (saves and moves to Social tab)

**Visual Features:**
- Shows current plan badge (Free/Pro with crown icon)
- **View Profile** button (external link icon) - opens public profile in new tab
- Real-time sync: Changes reflected immediately via Supabase realtime

#### Tab 2: Social (Social Links)
**Social Links Configuration:**
- **Twitter/X**: URL input (with @ validation)
- **Facebook**: URL input (facebook.com validation)
- **Instagram**: URL input (instagram.com validation)
- **LinkedIn**: URL input (linkedin.com validation)
- **YouTube**: URL input (youtube.com validation)
- **TikTok**: URL input (tiktok.com validation)
- **Amazon Author Page**: URL input
- **Goodreads**: URL input
- **GitHub**: URL input
- **Medium**: URL input
- **Pinterest**: URL input
- **Custom Social Links**:
  - **Add Custom Link** button
  - For each custom link:
    - Platform name input
    - URL input
    - Icon picker dropdown
    - Remove button

**Action Buttons:**
- **Previous** (returns to Profile tab)
- **Save & Next** (saves and moves to SEO tab)

**Visual Features:**
- Social link previews
- Validation indicators for each link
- Grouped by categories (Professional, Creative, Social)

#### Tab 3: SEO (SEO Settings)
**Feature Gate**: Requires Pro plan - shows upgrade prompt if Free plan

**SEO Configuration (Pro Users):**
- **Profile Meta Title**: Text input (max 60 characters)
  - Character counter
  - Preview snippet
- **Profile Meta Description**: Textarea (max 160 characters)
  - Character counter
  - Preview snippet
- **Profile Keywords**: Comma-separated input
  - Chip/tag display
  - Suggested keywords based on content
- **Open Graph Image**: 
  - Upload custom OG image (1200x630px recommended)
  - Preview of how it appears on social media
- **Twitter Card Type**: Dropdown
  - Summary
  - Summary with Large Image
  - Preview of card appearance

**SEO Preview Section:**
- Google search result preview
- Facebook share preview
- Twitter card preview

**Action Buttons:**
- **Previous** (returns to Social tab)
- **Save SEO Settings** button

**For Free Users:**
- Shows locked SEO panel with:
  - Crown icon
  - "SEO Settings" heading
  - Description: "Advanced SEO customization is available with Pro plans"
  - **Upgrade to Pro** button (links to /subscription)

#### Additional Features Across All Tabs:
- Auto-save indicators
- Validation error messages inline
- Success toast notifications
- Loading states during saves
- Responsive design for mobile
- Keyboard navigation support

---

## 📊 ANALYTICS & INSIGHTS

### Analytics Page (`/analytics`)

**SEPARATE PAGE FOR BASIC ANALYTICS**

#### Overview Cards (Top Row)
- **Total Profile Views**: Count & trend
- **Total Book Views**: Count & trend
- **Total Blog Post Views**: Count & trend
- **Social Link Clicks**: Count & trend

#### Time Range Selector
- Last 7 days
- Last 30 days
- Last 90 days
- Custom date range

#### Views Over Time Chart
- Line chart showing daily views
- Filter by type: All, Profile, Books, Blog

#### Top Content Section
- **Most Viewed Books**: Table
  - Book title
  - View count
  - Trend indicator
- **Most Viewed Blog Posts**: Table
  - Post title
  - View count
  - Reading time
  - Trend indicator

#### Traffic Sources (if available)
- Direct
- Search engines
- Social media
- Referrals

#### Export Options
- **Export CSV** button
- **Export PDF Report** button

---

### Advanced Analytics Page (`/analytics/advanced`)

**SEPARATE PAGE - PRO FEATURE**

Shows upgrade banner if Free plan.

#### Advanced Metrics
- **Engagement Rate**: Time on page
- **Bounce Rate**: Percentage
- **Average Session Duration**: Minutes
- **Pages Per Session**: Average

#### Detailed Charts
- **Views by Device**: Pie chart (Desktop, Mobile, Tablet)
- **Views by Country**: World map with heat colors
- **Views by Browser**: Bar chart
- **Views by Hour of Day**: Heatmap

#### Conversion Tracking
- **Purchase Link Clicks**: By platform
- **Contact Form Submissions**: Count
- **Newsletter Signups**: Count
- **Social Link Clicks**: By platform

#### Export & Integrations
- **Export Advanced Report**: Excel format
- **Connect Google Analytics**: Button to integrate
- **Schedule Reports**: Email automated reports

---

## 📱 PUBLISHER FEATURES

*Available only to users with Publisher role*

### Publisher Dashboard (`/publisher`)

**SEPARATE DASHBOARD FOR PUBLISHERS**

#### Overview Cards
- **Total Authors**: Count under this publisher
- **Total Books**: Across all authors
- **Total Revenue**: If billing enabled
- **Active Authors**: Recently active

#### Quick Actions
- **Add New Author** button → `/publisher/authors/add`
- **Manage Branding** → `/publisher/branding`
- **View All Authors** → `/publisher/authors`
- **Publisher Settings** → `/publisher/settings`

---

### Publisher Branding Page (`/publisher/branding`)

**SEPARATE PAGE FOR BRAND CUSTOMIZATION**

#### Logo & Identity Section
- **Publisher Logo**:
  - Upload logo (PNG with transparency preferred)
  - Max 5MB
  - Preview
- **Publisher Name** (required)
- **Tagline** (optional, max 100 characters)

#### Color Scheme Section
- **Brand Primary Color**: Color picker
- **Brand Secondary Color**: Color picker
- **Applies To**: All author profiles under this publisher

#### Contact Information Section
- **Public Email**
- **Phone Number**
- **Address** (full address fields)

#### Social Media Section
- **Publisher Twitter**
- **Publisher Facebook**
- **Publisher Instagram**
- **Publisher LinkedIn**

#### Watermark Settings
- **Enable Watermark on Books** (toggle)
- **Watermark Image**: Upload
- **Watermark Position**: Dropdown (Corner, Center, Custom)

#### Action Buttons
- **Save Branding Settings**
- **Preview Changes** (shows sample author page)
- **Reset to Defaults**

---

### Publisher Author Management (`/publisher/authors`)

**SEPARATE PAGE FOR MANAGING AUTHORS**

- **All Authors Table**:
  - Author name
  - Email
  - Books count
  - Status (Active/Inactive)
  - Last login
  - Plan type
- **Search Bar**: Filter by name, email
- **Filter Options**:
  - Status: All, Active, Inactive, Pending
  - Plan: All, Free, Pro, Custom
- **Add New Author** button → `/publisher/authors/add`

### Each Author Row Shows:
- **Action Buttons**:
  - **View Profile** (public view)
  - **Edit Details** → `/publisher/authors/edit/{id}`
  - **Manage Access** (permissions popup)
  - **View Analytics** (author-specific analytics)
  - **Deactivate** (confirmation)

---

### Add New Author Page (`/publisher/authors/add`)

**SEPARATE PAGE - NOT A POPUP**

#### Author Account Section
- **Full Name** (required)
- **Email Address** (required, used for login)
- **Initial Password** (generated or custom)
- **Send Welcome Email** (toggle)

#### Publisher Assignment Section
- **Assign to Publisher**: Auto-filled (current publisher)
- **Author Role**: Dropdown (Author, Contributor)

#### Access Permissions Section
- **Can Manage Own Books** (toggle, default: true)
- **Can Manage Own Blog** (toggle, default: true)
- **Can Access Analytics** (toggle, default: true)
- **Can Customize Theme** (toggle, default: true)
- **Admin Access** (toggle, default: false)

#### Plan Assignment Section
- **Subscription Plan**: Dropdown
  - Free (default)
  - Pro
  - Custom publisher plan
- **Trial Period**: Number of days (optional)

#### Branding Settings
- **Use Publisher Branding** (toggle, default: true)
- **Allow Custom Branding** (toggle, default: false)

#### Action Buttons
- **Create Author Account** (sends invite email)
- **Save as Draft** (doesn't send email)
- **Cancel** → back to `/publisher/authors`

---

### Edit Author Page (`/publisher/authors/edit/{id}`)

**SEPARATE PAGE - NOT A POPUP**

- Same sections as Add New Author
- Pre-filled with existing data
- **Additional Actions**:
  - **Reset Password** (sends reset email)
  - **Change Plan** (immediate effect)
  - **Deactivate Account** (soft delete)
  - **View Activity Log** (shows author's actions)

---

### Publisher Settings Page (`/publisher/settings`)

**SEPARATE PAGE WITH TABS**

#### Tab 1: General Settings
- **Publisher Name**
- **Display Name** (public-facing)
- **Publisher Website**
- **Support Email**
- **Time Zone**: Dropdown
- **Language**: Dropdown (default for all authors)

#### Tab 2: Author Defaults
- **Default Author Plan**: Dropdown
- **Default Trial Days**: Number input
- **Auto-Approve Authors**: Toggle
- **Require Email Verification**: Toggle

#### Tab 3: Billing Settings (if enabled)
- **Revenue Share %**: For author sales
- **Payment Method**: Stripe/PayPal integration
- **Billing Cycle**: Monthly/Yearly
- **Invoice Settings**:
  - Company name
  - Tax ID
  - Billing address

#### Tab 4: Feature Access
- **Available Features for Authors**:
  - Books management (always on)
  - Blog posts (toggle)
  - Events (toggle)
  - Awards (toggle)
  - Gallery (toggle)
  - Newsletter (toggle)
  - Contact form (toggle)
  - Analytics (toggle)
  - SEO tools (toggle)

#### Tab 5: Integrations
- **ISBN Database**: Configure API access
- **Affiliate Programs**:
  - Amazon Associates ID
  - Barnes & Noble ID
  - Custom affiliate IDs
- **Email Service**: SMTP settings
- **Analytics**: Google Analytics code

---

## ⚙️ ADMIN PANEL

*Available only to users with Admin role*

### Admin Dashboard (`/admin`)

**SEPARATE COMPREHENSIVE ADMIN DASHBOARD**

#### System Overview Cards
- **Total Users**: Count & trend
- **Active Subscriptions**: Count by plan
- **Total Books**: Across all users
- **System Health**: Server status

#### Quick Actions Grid
- **User Management** → `/admin/users`
- **Book Catalog** → `/admin/books`
- **Blog Management** → `/admin/blog`
- **Newsletter Management** → `/admin/newsletters`
- **Contact Management** → `/admin/contact`
- **Help Desk** → `/admin/helpdesk`
- **Site Settings** → `/admin/settings`
- **Theme Management** → `/admin/themes`
- **SEO Settings** → `/admin/seo`
- **Analytics** → `/admin/analytics`
- **Role Management** → `/admin/roles`
- **Publisher Management** → `/admin/publishers`
- **Backup & Security** → `/admin/backup`
- **Deployment** → `/admin/deployment`

#### Recent Activity Feed
- Latest user registrations
- New book submissions
- Support tickets opened
- System alerts

---

### Admin User Management (`/admin/users`)

**SEPARATE PAGE FOR USER ADMIN**

- **All Users Table**:
  - User ID
  - Name
  - Email
  - Role badge
  - Plan badge
  - Registration date
  - Last login
  - Status (Active/Suspended)
- **Search Bar**: Multi-field search
- **Filter Options**:
  - Role: All, Admin, Publisher, Moderator, User
  - Plan: All, Free, Pro, Trial, Expired
  - Status: All, Active, Suspended, Pending
- **Sort Options**: Name, Date, Last Login
- **Bulk Actions**:
  - Select multiple users
  - Bulk assign role
  - Bulk suspend/activate
  - Bulk export
- **Add New User** button → `/admin/users/create`

### Each User Row Shows:
- **Action Buttons**:
  - **View Profile** (public preview)
  - **Edit** → `/admin/users/edit/{id}`
  - **Login As** (impersonate user, admin only)
  - **Suspend** (confirmation)
  - **Delete** (confirmation, permanent)

---

### Admin User Edit Page (`/admin/users/edit/{id}`)

**SEPARATE PAGE - NOT A POPUP**

#### User Account Section
- **Full Name** (editable)
- **Email** (editable with verification)
- **Profile Slug** (editable, unique check)
- **Account Status**: Dropdown (Active, Suspended, Pending)
- **Email Verified**: Checkbox
- **Verification Date**: Display only

#### Role Management Section
- **Assigned Roles** (multi-select):
  - Admin
  - Publisher
  - Moderator
  - User (default)
- **Role Permissions Display**: Shows what each role allows

#### Subscription Management Section
- **Current Plan**: Dropdown to change
- **Plan Status**: Active, Trialing, Expired
- **Trial Ends At**: Date (editable)
- **Subscription Ends At**: Date (editable)
- **Override Plan Limits**: Checkbox
  - Custom book limit
  - Custom feature access

#### Publisher Assignment Section (if Publisher role)
- **Assign to Publisher**: Dropdown of all publishers
- **Is Owner**: Checkbox (owns the publisher account)

#### Activity Logs Section
- **Login History**: Table
  - Date & time
  - IP address
  - Device
  - Location
- **Action History**: Table
  - Date & time
  - Action type
  - Resource affected
  - Status

#### Action Buttons
- **Save Changes**
- **Send Password Reset** (email to user)
- **Verify Email Manually**
- **Extend Trial** (add days)
- **Suspend Account** (with reason)
- **Delete Account** (permanent, confirmation)
- **Back to Users** → `/admin/users`

---

### Admin Books Management (`/admin/books-management`)

**SEPARATE PAGE WITH 5 TABS**

#### Tab 1: All Books
**Statistics Cards (Top Row):**
- **Total Books**: Count with trend indicator
- **Published**: Count with percentage
- **Drafts**: Count with percentage
- **Archived**: Count with percentage

**Filter & Search Section:**
- **Search Bar**: Real-time search by title, ISBN, author
- **Filter Dropdowns**:
  - Status: All, Published, Draft, Archived
  - Category: All categories from settings
  - Genre: Multiple selection
  - Language: Multiple selection
  - User: Filter by specific author

**Books Catalog Display:**
- **Grid View / List View toggle**
- Each book card/row shows:
  - Cover image thumbnail
  - Title & subtitle
  - Author name (links to user profile)
  - ISBN (if available)
  - Status badge (color-coded)
  - Publication date
  - Category & genres tags
  - View count (if analytics enabled)
  - Last updated timestamp

**Action Buttons (per book):**
- **View** (opens public preview)
- **Edit** (opens book editor)
- **Duplicate** (creates copy with "-copy" suffix)
- **Delete** (confirmation dialog)

**Bulk Actions:**
- Select multiple books checkbox
- **Bulk Publish** button
- **Bulk Archive** button
- **Bulk Delete** button
- **Export Selected** button (CSV/JSON)

**Pagination:**
- Items per page selector (10, 25, 50, 100)
- Page navigation (Previous, 1, 2, 3... Next)

#### Tab 2: ISBN Lookup
**ISBN Search Tool:**
- **ISBN Input**: 10 or 13 digit ISBN input field
- **Search Button**: Triggers Google Books API lookup
- **Search History**: Recent searches displayed
- **Clear History** button

**Search Results Display:**
- Book cover image preview
- Title and authors
- Publisher and publication date
- ISBN-10 and ISBN-13
- Page count
- Description preview
- Categories/genres
- Average rating (if available)

**Action Buttons (on results):**
- **Add to Catalog** (imports book data)
- **Generate Affiliate Links** (creates purchase links)
- **Copy Data** (copies to clipboard as JSON)
- **View on Google Books** (external link)

**Auto-Fill Features:**
- Automatically populates book form
- Generates affiliate purchase links based on settings
- Fetches cover image URL
- Extracts metadata for SEO

#### Tab 3: Affiliate Settings
**Affiliate Program Configuration:**
- **Enable Affiliate Links**: Toggle
- **Auto-Generate Links**: Toggle (on ISBN lookup)

**Amazon Affiliate Settings:**
- **Amazon Associates Tag**: Text input
- **Default Amazon Store**: Dropdown (US, UK, CA, etc.)
- **Link Format**: Radio buttons
  - Short link
  - Full link with tracking

**Barnes & Noble Settings:**
- **Affiliate ID**: Text input
- **Enable B&N Links**: Toggle

**Other Retailers Configuration:**
- **Add Custom Retailer** button
- For each retailer:
  - Retailer name
  - Base URL template
  - Affiliate parameter
  - Active toggle
  - Remove button

**Link Generation Templates:**
- **{{ISBN}}** placeholder
- **{{ASIN}}** placeholder (for Amazon)
- **{{TITLE}}** placeholder
- **{{AUTHOR}}** placeholder

**Preview Section:**
- Shows sample generated links
- **Test Links** button (validates URLs)

**Action Buttons:**
- **Save Affiliate Settings**
- **Test Configuration** (sends test request)
- **Reset to Defaults**

#### Tab 4: Field Settings
**Book Field Configuration:**

**Tab 4a: Basic Info Fields**
- **Title**: Required/Optional toggle, max length
- **Subtitle**: Required/Optional toggle, max length
- **Description**: Required/Optional toggle, max length, allow HTML toggle
- **ISBN**: Required/Optional toggle, validation format
- **Publisher**: Required/Optional toggle, max length
- **Page Count**: Required/Optional toggle, min/max values

**Tab 4b: Publishing Fields**
- **Publication Date**: Required/Optional toggle, allow future dates
- **Language**: Required/Optional toggle, available languages list
- **Status**: Default value dropdown, allowed statuses
- **Category**: Required/Optional toggle, available categories
- **Genres**: Required/Optional toggle, max selections, available genres

**Tab 4c: SEO Fields**
- **SEO Title**: Required/Optional toggle, max 60 characters
- **SEO Description**: Required/Optional toggle, max 160 characters
- **SEO Keywords**: Required/Optional toggle, max keywords count
- **Slug**: Auto-generate toggle, custom format

**Tab 4d: Advanced Fields**
- **Cover Image**: Required/Optional toggle, max size, allowed formats
- **Purchase Links**: Min/max links, required platforms
- **Tags**: Max tags, auto-suggest toggle

**Tab 4e: Custom Fields**
- **Add Custom Field** button
- For each custom field:
  - Field name
  - Field type (text, number, date, dropdown, etc.)
  - Required toggle
  - Default value
  - Validation rules
  - Remove button

**Import/Export Configuration:**
- **Export Field Config** (JSON)
- **Import Field Config** (JSON upload)

**Action Buttons:**
- **Save Field Settings**
- **Preview Form** (shows how book form will look)
- **Reset to Defaults**

#### Tab 5: Analytics
**Overview Statistics:**
- **Total Books Across All Users**: Count
- **Books Added This Month**: Count with trend
- **Average Books Per User**: Number
- **Most Active Author**: Name with count

**Publication Timeline Chart:**
- Line/bar chart showing books published over time
- Filterable by date range
- Group by: Day, Week, Month, Year

**Category Distribution:**
- Pie/donut chart showing book distribution by category
- Percentage and count for each category
- Top 5 categories highlighted

**Language Distribution:**
- Bar chart showing books by language
- Sortable by count
- Filterable

**Genre Analysis:**
- Top 10 most popular genres
- Bar chart with counts
- Combination genre analysis

**User Statistics:**
- Top 10 authors by book count
- Average books per author
- Authors with 0 books (inactive)

**ISBN Coverage:**
- Books with ISBN: Percentage
- Books without ISBN: Percentage
- Books with affiliate links: Percentage

**Status Breakdown:**
- Published books chart
- Draft books chart
- Archived books chart
- Trend over time

**Export Options:**
- **Export Analytics Report** (PDF)
- **Export Raw Data** (CSV)
- **Schedule Reports** (email setup)

**Refresh Button**: Recalculate statistics

**Date Range Selector**:
- Last 7 days
- Last 30 days
- Last 90 days
- Last year
- All time
- Custom date range

---

### Admin Blog Management (`/admin/blog`)

**SEPARATE PAGE FOR ALL BLOGS**

- **All Blog Posts Table** (all users):
  - Featured image
  - Title
  - Author name
  - Category
  - Status
  - Published date
  - Views
  - Comments (if enabled)
- **Search Bar**: Title, content, author
- **Filter Options**:
  - Status: All, Published, Draft, Pending, Archived
  - Category: Multi-select
  - Author: Search by user
  - Featured: Yes/No
- **Approval Queue**: Shows pending posts (if approval required)
- **Bulk Actions**:
  - Bulk approve
  - Bulk publish
  - Bulk delete

### Each Post Row Shows:
- **Action Buttons**:
  - **View** (preview)
  - **Edit** (admin can edit any post)
  - **Approve** (if pending)
  - **Feature** (toggle featured status)
  - **Delete** (confirmation)

---

### Admin Blog Settings (`/admin/blog/settings`)

**SEPARATE PAGE FOR BLOG CONFIGURATION**

#### Global Blog Settings
- **Require Approval**: Toggle
- **Auto-Publish**: Toggle (if approval disabled)
- **Allow HTML**: Toggle
- **Max Title Length**: Number input
- **Max Content Length**: Number input
- **Max Excerpt Length**: Number input

#### Category Management
- **Available Categories**: List
  - Add new category button
  - Edit category (inline)
  - Delete category (if unused)
  - Reorder categories (drag-drop)

#### Image Settings
- **Allowed Image Types**: Multi-select (JPEG, PNG, WebP)
- **Max Image Size MB**: Number input
- **Auto-Optimize Images**: Toggle
- **Image Compression Quality**: Slider (1-100)

#### Default Settings
- **Default Status**: Dropdown (Draft, Published)
- **Auto-Generate Slug**: Toggle
- **Enable Comments**: Toggle (future feature)

#### Action Buttons
- **Save Blog Settings**
- **Reset to Defaults**

---

### Admin Newsletter Management (`/admin/newsletters`)

**SEPARATE PAGE - MANAGE ALL NEWSLETTERS**

- **All Newsletters Table** (all users):
  - Subject
  - Sender name
  - Status
  - Scheduled/Sent date
  - Recipients count
  - Open rate %
  - Click rate %
- **Search Bar**: Subject, content
- **Filter Options**:
  - Status: All, Draft, Scheduled, Sent, Failed
  - User: Search by sender
  - Date Range: Custom picker

### Each Newsletter Row Shows:
- **Action Buttons**:
  - **View** (preview)
  - **View Analytics** (detailed stats)
  - **Cancel** (if scheduled, not sent)
  - **Resend** (if sent)
  - **Delete** (drafts only)

---

### Admin Newsletter Settings (`/admin/newsletters/settings`)

**SEPARATE PAGE FOR EMAIL CONFIG**

#### SMTP Configuration
- **SMTP Host**: Text input
- **SMTP Port**: Number input
- **SMTP Username**: Text input
- **SMTP Password**: Password input (encrypted)
- **Use TLS**: Toggle
- **Test Connection** button

#### Sending Limits
- **Max Emails Per Hour**: Number input
- **Max Emails Per Day**: Number input
- **Rate Limit Per User**: Number input

#### Default Settings
- **Default From Name**: Text input
- **Default From Email**: Text input (verified)
- **Default Reply-To**: Text input

#### Tracking Settings
- **Enable Open Tracking**: Toggle
- **Enable Click Tracking**: Toggle
- **Track Unsubscribes**: Toggle

#### Compliance Settings
- **Require Consent**: Toggle (GDPR)
- **Include Unsubscribe Link**: Toggle (always recommended)
- **Unsubscribe Text**: Textarea

#### Action Buttons
- **Save Settings**
- **Send Test Email** (enter email to test)

---

### Admin Contact Management (`/admin/contact`)

**SEPARATE PAGE - ALL CONTACT SUBMISSIONS**

- **All Submissions Table** (all users):
  - Submitted to (which user received it)
  - From name
  - From email
  - Subject
  - Status
  - Priority
  - Submit date
- **Search Bar**: Multi-field
- **Filter Options**:
  - Status: All, New, Read, Replied, Resolved
  - Priority: All, High, Medium, Low
  - Recipient User: Dropdown
  - Date Range: Custom picker
- **Bulk Actions**:
  - Bulk mark as read
  - Bulk assign priority
  - Bulk delete

### Each Submission Row Shows:
- **Action Buttons**:
  - **View Details** (full message)
  - **Reply** (send response)
  - **Change Status** (dropdown)
  - **Delete** (confirmation)

---

### Admin Help Desk (`/admin/helpdesk`)

**SEPARATE PAGE - SUPPORT TICKET SYSTEM**

- **All Tickets Table**:
  - Ticket number (auto-generated)
  - Title
  - Submitter name
  - Category
  - Status
  - Priority
  - Assigned to
  - Created date
  - Last updated
- **Search Bar**: Ticket #, title, submitter
- **Filter Options**:
  - Status: From helpdesk_settings (Open, In Progress, etc.)
  - Priority: High, Medium, Low
  - Category: From helpdesk_settings
  - Assigned To: Dropdown of admins/moderators
- **Statistics Cards**:
  - Open Tickets
  - In Progress
  - Resolved Today
  - Average Response Time
- **Add New Ticket** button → `/admin/helpdesk/create`

### Each Ticket Row Shows:
- **Action Buttons**:
  - **View Details** → `/admin/helpdesk/ticket/{id}`
  - **Assign To** (quick dropdown)
  - **Change Status** (quick dropdown)
  - **Change Priority** (quick dropdown)

---

### Admin Ticket Detail Page (`/admin/helpdesk/ticket/{id}`)

**SEPARATE PAGE - NOT A POPUP**

#### Ticket Information Section
- **Ticket Number**: Display (e.g., TICK-00123)
- **Title**: Editable
- **Status**: Dropdown to change
- **Priority**: Dropdown to change
- **Category**: Dropdown to change
- **Assigned To**: Dropdown of staff
- **Submitter**: Name & email (click to view user)
- **Created At**: Date & time
- **Last Updated**: Date & time

#### Description Section
- **Full Description**: Display with formatting
- **Attachments**: Download links (if any)

#### Response/Notes Section
- **Conversation Thread**: Chronological
  - Each response shows:
    - Author name
    - Date & time
    - Message content
    - Internal note indicator
- **Add Response**:
  - Textarea (rich text)
  - **Internal Note**: Toggle (not sent to user)
  - **Attach Files**: Upload button
  - **Send Response** button
    - If not internal: Sends email to submitter
    - Records in thread

#### Activity Log Section
- Status changes
- Priority changes
- Assignments
- Timestamp for each

#### Action Buttons
- **Resolve Ticket** (changes status to Resolved)
- **Close Ticket** (changes status to Closed)
- **Reopen Ticket** (if closed)
- **Delete Ticket** (confirmation)
- **Back to Help Desk** → `/admin/helpdesk`

---

### Admin Help Desk Settings (`/admin/helpdesk/settings`)

**SEPARATE PAGE FOR HELPDESK CONFIG**

#### Ticket Configuration
- **Ticket Number Prefix**: Text input (e.g., TICK, SUP, HLP)
- **Auto-Assign Tickets**: Toggle
- **Default Priority**: Dropdown (High, Medium, Low)

#### Categories Management
- **Available Categories**: List (editable)
  - General
  - Technical
  - Billing
  - Feature Request
  - Bug Report
  - Custom categories...
- **Add Category** button
- **Edit/Delete** for each

#### Status Management
- **Available Statuses**: List (editable)
  - Open
  - In Progress
  - Pending
  - Resolved
  - Closed
  - Custom statuses...
- **Add Status** button
- **Edit/Delete** for each

#### SLA Settings
- **SLA Response Hours**: Number input (e.g., 24)
- **Business Hours**: Time range selector
- **Business Days**: Multi-select (Mon-Sun)
- **Timezone**: Dropdown

#### Notification Settings
- **Email Notifications**: Toggle
- **Notify On New Ticket**: Toggle
- **Notify On Status Change**: Toggle
- **Notification Recipients**: List of email addresses

#### Action Buttons
- **Save Settings**
- **Reset to Defaults**

---

### Admin Site Settings (`/admin/settings`)

**SEPARATE PAGE WITH MULTIPLE TABS**

#### Tab 1: General Settings
- **Site Name**: Text input
- **Site Description**: Textarea
- **Admin Email**: Email input
- **Time Zone**: Dropdown
- **Date Format**: Dropdown (MM/DD/YYYY, DD/MM/YYYY, etc.)
- **Time Format**: Dropdown (12-hour, 24-hour)

#### Tab 2: Registration Settings
- **Allow Registration**: Toggle
- **Require Email Verification**: Toggle
- **Default User Role**: Dropdown
- **Auto-Assign Trial**: Toggle
- **Trial Duration Days**: Number input

#### Tab 3: Email Settings
- **Email Service Provider**: Dropdown (SMTP, SendGrid, Resend, etc.)
- **Configuration**: Depends on provider selected
- **Test Email** button

#### Tab 4: File Upload Settings
- **Max Upload Size MB**: Number input
- **Allowed File Types**: Multi-select
- **Storage Location**: Dropdown (Supabase, S3, etc.)

#### Tab 5: Security Settings
- **Enforce 2FA for Admins**: Toggle
- **Password Requirements**:
  - Min length: Number input
  - Require uppercase: Toggle
  - Require numbers: Toggle
  - Require symbols: Toggle
- **Session Timeout Minutes**: Number input
- **Max Login Attempts**: Number input
- **Lockout Duration Minutes**: Number input

#### Tab 6: Maintenance Mode
- **Enable Maintenance Mode**: Toggle
- **Maintenance Message**: Textarea
- **Allowed IPs**: List (admins can still access)

#### Action Buttons
- **Save All Settings**
- **Reset to Defaults**

---

### Admin Theme Management (`/admin/themes`)

**SEPARATE PAGE FOR THEME ADMIN**

- **All Themes Table**:
  - Theme preview thumbnail
  - Theme name
  - Author
  - Plan required (Free/Pro)
  - Active users count
  - Status (Active/Inactive)
- **Add New Theme** button → Opens theme creation form
- **Import Theme** button → Upload theme JSON

### Each Theme Row Shows:
- **Action Buttons**:
  - **Preview** (iframe preview)
  - **Edit** → Theme customizer
  - **Duplicate** (creates copy)
  - **Set as Default** (for new users)
  - **Deactivate** (hide from users)
  - **Delete** (if not in use)

---

### Admin SEO Settings (`/admin/seo`)

**SEPARATE PAGE FOR GLOBAL SEO**

#### Global SEO Section
- **Default Site Title**: Text input (max 60 chars)
- **Default Site Description**: Textarea (max 160 chars)
- **Default Keywords**: Textarea (comma-separated)
- **Default OG Image**: Upload (1200x630px recommended)

#### Search Engine Verification
- **Google Site Verification**: Meta tag input
- **Bing Site Verification**: Meta tag input
- **Pinterest Site Verification**: Meta tag input

#### Social Media Cards
- **Twitter Handle**: Text input (with @)
- **Facebook App ID**: Text input
- **Default Twitter Card Type**: Dropdown

#### Sitemap Settings
- **Enable Sitemap**: Toggle
- **Update Frequency**: Dropdown (Daily, Weekly, Monthly)
- **Priority**: Slider (0.0 - 1.0)
- **Exclude Pages**: Multi-select

#### Robots.txt Settings
- **Enable Robots.txt**: Toggle
- **Custom Robots Rules**: Textarea

#### Schema Markup
- **Enable Schema**: Toggle
- **Organization Schema**:
  - Organization name
  - Logo URL
  - Social profiles (list)

#### Action Buttons
- **Save SEO Settings**
- **Generate Sitemap Now**
- **View Sitemap** (opens in new tab)
- **View Robots.txt** (opens in new tab)

---

### Admin Role Management (`/admin/roles`)

**SEPARATE PAGE FOR ROLE CONFIG**

#### Available Roles Table
- **Role Name**: Admin, Publisher, Moderator, User
- **Users Count**: How many have this role
- **Permissions**: Summary of capabilities

### For Each Role:
- **Action Buttons**:
  - **View Permissions** → Opens permission matrix
  - **Edit** → Opens permission editor
  - **Assign to Users** → User selection interface

---

### Admin Role Permission Editor
**Opens on same page or modal**

#### Permission Matrix
- **Feature Categories** (rows):
  - Users
  - Books
  - Blog Posts
  - Events
  - Awards
  - FAQs
  - Gallery
  - Newsletters
  - Contact Forms
  - Help Desk
  - Themes
  - Settings
  - Analytics
  
- **Permission Types** (columns):
  - View
  - Create
  - Edit Own
  - Edit All
  - Delete Own
  - Delete All
  - Approve
  - Publish

#### Checkboxes for each combination
- Example: Role "Moderator" can:
  - ✅ View all blog posts
  - ✅ Edit all blog posts
  - ✅ Approve blog posts
  - ❌ Delete all blog posts

#### Action Buttons
- **Save Permissions**
- **Reset to Default**
- **Copy from Another Role** (template)

---

### Admin Publisher Management (`/admin/publishers`)

**SEPARATE PAGE FOR PUBLISHER ADMIN**

- **All Publishers Table**:
  - Publisher name
  - Owner name
  - Total authors
  - Total books
  - Active plan
  - Created date
- **Search Bar**: Name, owner email
- **Filter Options**:
  - Status: All, Active, Inactive
  - Plan: All, Free, Pro, Custom
- **Add New Publisher** button → `/admin/publishers/create`

### Each Publisher Row Shows:
- **Action Buttons**:
  - **View Details** → Publisher dashboard view
  - **Edit** → `/admin/publishers/edit/{id}`
  - **View Authors** (filtered list)
  - **View Analytics** (publisher-specific)
  - **Suspend** (confirmation)
  - **Delete** (confirmation, if no authors)

---

### Admin Publisher Edit Page (`/admin/publishers/edit/{id}`)

**SEPARATE PAGE - NOT A POPUP**

#### Publisher Account Section
- **Publisher Name**: Text input
- **Owner User**: Dropdown (assign ownership)
- **Status**: Dropdown (Active, Inactive, Suspended)
- **Plan**: Dropdown of available plans

#### Branding Section
- **Logo**: Upload
- **Primary Color**: Color picker
- **Secondary Color**: Color picker

#### Limits & Quotas Section
- **Max Authors**: Number input (or unlimited checkbox)
- **Max Books Per Author**: Number input
- **Custom Features**: Checkboxes
  - All features
  - Or specific feature toggles

#### Billing Section (if applicable)
- **Revenue Share %**: Number input
- **Billing Email**: Email input
- **Payment Status**: Display only

#### Authors Under This Publisher Section
- **Authors List**: Nested table
  - Author name
  - Email
  - Books count
  - Status
  - **Unassign** button for each

#### Action Buttons
- **Save Changes**
- **View Public Page** (publisher public profile)
- **Send Message** (email to publisher owner)
- **Suspend Publisher** (confirmation)
- **Delete Publisher** (if no authors, confirmation)
- **Back to Publishers** → `/admin/publishers`

---

### Admin Backup & Security Page (`/admin/backup`)

**SEPARATE PAGE FOR BACKUPS**

#### Backup Status Section
- **Last Backup**: Date & time
- **Next Scheduled Backup**: Date & time
- **Total Backups**: Count
- **Storage Used**: GB

#### Manual Backup Actions
- **Backup Database Now** button
  - Creates immediate database backup
  - Downloads or saves to configured storage
- **Backup Files Now** button
  - Backs up uploaded files
- **Full System Backup** button
  - Database + Files

#### Backup Schedule Section
- **Enable Automatic Backups**: Toggle
- **Frequency**: Dropdown (Hourly, Daily, Weekly, Monthly, Custom)
- **Custom Schedule**: Cron expression input (if Custom selected)
- **Retention Days**: Number input (how long to keep backups)
- **Auto Cleanup**: Toggle (deletes old backups)

#### Available Backups Table
- **Backup Date**: Date & time
- **Type**: Database, Files, or Full
- **Size**: MB/GB
- **Status**: Complete, Failed, In Progress
- **Action Buttons**:
  - **Download** (ZIP file)
  - **Restore** (confirmation, very dangerous)
  - **Delete** (confirmation)

#### Security Monitoring Section
- **Failed Login Attempts**: Count & details
- **Active Sessions**: Count
- **Security Alerts**: List of recent alerts
- **View Security Log** button → Opens log viewer

#### Action Buttons
- **Save Backup Settings**
- **Run Security Scan Now**
- **Download Implementation Guide** (for Knowledge Base)
- **Download Role-Based Feature Guide** (for Knowledge Base)

---

### Admin Deployment Page (`/admin/deployment`)

**SEPARATE PAGE WITH DEPLOYMENT OPTIONS**

#### Deployment Options Cards

##### Option 1: GoDaddy Deployment
- **Description**: Deploy to GoDaddy hosting via FTP
- **Configure** button → `/admin/godaddy-deployment`
- **Status**: Configured / Not Configured

##### Option 2: AWS Deployment
- **Description**: Deploy to AWS EC2 instance
- **Configure** button → `/admin/aws-deployment`
- **Status**: Configured / Not Configured

##### Option 3: Custom Deployment
- **Description**: Manual deployment instructions
- **View Guide** button → Opens deployment guide

---

### Admin GoDaddy Deployment Page (`/admin/godaddy-deployment`)

**SEPARATE PAGE WITH 4 TABS**

#### Tab 1: SOP (Standard Operating Procedure)
**Complete Deployment Guide:**
- **Prerequisites Checklist**:
  - GoDaddy hosting account active
  - FTP credentials available
  - Domain configured
  - SSL certificate (if using HTTPS)
  
**Step-by-Step Instructions:**
1. **Prepare Your Files**
   - Build production version
   - Verify all assets included
   - Check file permissions
   
2. **Configure FTP Settings**
   - Navigate to Configuration tab
   - Enter FTP host, port, username, password
   - Set deployment path (/public_html or subdirectory)
   - Test connection
   
3. **Initial Deployment**
   - Review files to be uploaded
   - Click "Deploy Now"
   - Monitor deployment log
   - Verify deployment success
   
4. **Post-Deployment Verification**
   - Navigate to Status Check tab
   - Run all status checks
   - Verify domain accessibility
   - Check SSL configuration
   - Test application functionality
   
5. **Troubleshooting Common Issues**
   - FTP connection failures
   - Permission errors
   - Missing files
   - SSL certificate issues
   - Deployment timeouts

**Best Practices:**
- Always backup before deployment
- Test in staging first
- Deploy during low-traffic periods
- Keep deployment logs
- Monitor for errors post-deployment

**Security Considerations:**
- Use secure FTP (SFTP) when available
- Rotate FTP credentials regularly
- Limit deployment path permissions
- Enable SSL/HTTPS
- Monitor access logs

#### Tab 2: Configuration
**FTP Connection Settings:**
- **FTP Host**: Text input (e.g., ftp.yourdomain.com)
  - Help text: "Your GoDaddy FTP hostname"
  - Validation: Must be valid hostname
- **FTP Port**: Number input (default: 21)
  - Help text: "Usually 21 for FTP, 22 for SFTP"
- **FTP Username**: Text input
  - Help text: "Your cPanel/FTP username"
  - Encrypted storage
- **FTP Password**: Password input
  - Help text: "Your cPanel/FTP password"
  - Encrypted storage
  - Show/hide password toggle
- **Deployment Path**: Text input (default: /public_html)
  - Help text: "Path where files will be uploaded"
  - Common paths dropdown:
    - /public_html (main domain)
    - /public_html/subdirectory
    - /httpdocs
  - Path validation

**Domain Configuration:**
- **Domain**: Text input (e.g., yourdomain.com)
  - Help text: "Your GoDaddy domain name"
  - Domain validation

**Connection Testing:**
- **Test Connection** button
  - Validates FTP credentials
  - Checks server accessibility
  - Verifies write permissions
  - Shows connection status (Success/Failed)
  - Displays error details if failed

**Action Buttons:**
- **Save Configuration** button
  - Saves settings to database
  - Encrypts sensitive data
  - Shows success notification
- **Clear Configuration** button (confirmation dialog)

**Configuration Status:**
- Shows last saved date/time
- Configuration completeness indicator
- Connection status badge (Connected/Not Configured/Error)

#### Tab 3: Deployment
**Current Deployment Status:**
- **Status Badge**: Pending/In Progress/Success/Failed
- **Last Deployment**:
  - Date and time
  - Duration (minutes:seconds)
  - Files uploaded count
  - Success/failure indicator
- **Current User**: Who initiated deployment

**Deployment Controls:**
- **Deployment Name**: Text input (optional, e.g., "v1.2.0 Release")
- **Deploy Now** button
  - Disabled if configuration incomplete
  - Shows confirmation dialog
  - Initiates deployment process

**Live Deployment Monitor:**
- **Progress Bar**: Visual progress (0-100%)
- **Current Step Indicator**:
  - Connecting to FTP server...
  - Building production files...
  - Uploading files (X/Y complete)...
  - Verifying deployment...
  - Deployment complete!
  
**Deployment Log (Real-time):**
- Scrollable log viewer
- Timestamped entries
- Color-coded messages:
  - Info (blue)
  - Success (green)
  - Warning (yellow)
  - Error (red)
- **Download Log** button
- **Clear Log** button

**Deployment History Table:**
- **Columns**:
  - Deployment Name
  - Started At (date/time)
  - Completed At (date/time)
  - Duration
  - Status badge (Success/Failed)
  - Deployed By (user name)
  - Actions

**For Each Deployment:**
- **View Log** button (opens full deployment log)
- **Revert** button (rollback to this deployment)
- **Delete** button (remove from history)

**Pagination:**
- Show last 10/25/50 deployments
- Previous/Next navigation

**Deployment Statistics:**
- Total deployments count
- Success rate percentage
- Average deployment time
- Last successful deployment date

#### Tab 4: Status Check
**Automated Health Checks:**

**Domain Accessibility Check:**
- **Domain URL**: Display configured domain
- **HTTP Status**: Shows 200 OK / Error code
- **Response Time**: Milliseconds
- **DNS Resolution**: Success/Failed
- **Status**: Green checkmark / Red X

**SSL/HTTPS Check:**
- **SSL Certificate Status**: Valid/Invalid/Expired
- **Certificate Expiry Date**: Date display
- **Certificate Issuer**: Display issuer name
- **HTTPS Redirect**: Working/Not Working
- **Security Grade**: A+ to F rating
- **Status**: Green checkmark / Red X

**File Structure Check:**
- **index.html**: Present/Missing
- **assets folder**: Present/Missing
- **Required Files**:
  - List of critical files
  - Each with checkmark/X status
- **File Count**: Total files deployed
- **Total Size**: MB/GB

**FTP Connection Check:**
- **Connection Status**: Connected/Failed
- **Server Response Time**: Milliseconds
- **Write Permissions**: Yes/No
- **Available Space**: GB free

**Application Functionality Check:**
- **Homepage Load**: Success/Failed
- **JavaScript Errors**: Count (0 = good)
- **Console Warnings**: Count
- **Broken Links**: Count
- **API Endpoints**: Responsive/Down

**Run All Checks Button:**
- Executes all status checks simultaneously
- Shows overall progress
- Displays summary:
  - X/Y checks passed
  - Overall health percentage
  - Critical issues count

**Individual Check Buttons:**
- Run Domain Check
- Run SSL Check
- Run File Check
- Run FTP Check
- Run Application Check

**Results Display:**
- **Overall Status**: Healthy (green) / Warning (yellow) / Critical (red)
- **Last Check Time**: Timestamp
- **Auto-Refresh**: Toggle (refresh every 5 min)

**Issue Resolution Guide:**
For each failed check, shows:
- Error description
- Possible causes
- Recommended actions
- Links to relevant documentation

**Export Reports:**
- **Download Status Report** (PDF)
- **Email Report** (send to admin email)

---

### Admin AWS Deployment Page (`/admin/aws-deployment`)

**SEPARATE PAGE WITH TABS**

#### Tab 1: AWS Configuration
- **AWS Access Key ID**: Text input (encrypted)
- **AWS Secret Access Key**: Password input (encrypted)
- **AWS Region**: Dropdown (us-east-1, eu-west-1, etc.)
- **Instance Type**: Dropdown (t2.micro, t2.small, etc.)
- **Key Pair Name**: Text input (for SSH access)
- **Security Group ID**: Text input
- **Subnet ID**: Text input
- **AMI ID**: Text input (Amazon Machine Image)
- **Save Configuration** button
- **Test Connection** button (validates AWS credentials)

#### Tab 2: Deployment
- **Deployment Name**: Text input (e.g., "Production", "Staging")
- **Auto Deploy**: Toggle (redeploy on code changes)
- **Deploy to AWS** button
  - Creates EC2 instance
  - Shows progress steps
  - Live deployment log
- **Current Deployments**: Table
  - Deployment name
  - Instance ID
  - Public IP
  - Status (Running, Stopped, Terminated)
  - Last deployed
  - **Action Buttons**:
    - **View Instance Details**
    - **Stop Instance**
    - **Terminate Instance** (confirmation)

#### Tab 3: Instance Management
- **Active Instances**: List
  - For each instance:
    - Instance ID
    - Public IP (click to open)
    - Status
    - Instance type
    - Launch time
    - **Actions**:
      - **SSH Connect** (shows command)
      - **View Logs**
      - **Restart**
      - **Stop**
      - **Terminate**

#### Tab 4: Monitoring
- **Instance Health**: Display
- **CPU Usage**: Chart
- **Memory Usage**: Chart
- **Network Traffic**: Chart
- **Deployment Logs**: Scrollable log viewer
- **Refresh** button

---

## 🔔 NOTIFICATIONS

### Notification Center (Bell Icon in Header)
- **Dropdown on click**: Shows recent notifications
- **Notification Types**:
  - New contact submission
  - New support ticket
  - Comment on blog post
  - Newsletter sent successfully
  - Backup completed
  - User registered
  - Book published
  - System alert
- **Each Notification Shows**:
  - Icon (by type)
  - Message
  - Time ago
  - Read/unread indicator
- **Action Buttons**:
  - **Mark All as Read**
  - **View All Notifications** → `/notifications`

### Notifications Page (`/notifications`)
**SEPARATE PAGE FOR ALL NOTIFICATIONS**

- **All Notifications List**: Paginated
- **Filter Options**:
  - Type: All, Contact, Ticket, Blog, System, etc.
  - Status: All, Unread, Read
  - Date Range: Custom picker
- **Sort Options**: Newest, Oldest, Unread first
- **Bulk Actions**:
  - Mark selected as read
  - Delete selected

---

## 🔍 SEARCH FUNCTIONALITY

### Global Search (Top Header)
- **Search Input**: Available on all pages
- **Search Icon**: Click or press "/" to focus
- **Real-time Suggestions**: As you type
- **Search Results Categorized**:
  - Books
  - Blog Posts
  - Events
  - Awards
  - FAQs
  - Users (admin only)
  - Pages
- **Each Result Shows**:
  - Title/Name
  - Category badge
  - Snippet/preview
  - **Go to** link

### Advanced Search Page (`/search`)
**SEPARATE PAGE FOR DETAILED SEARCH**

- **Search Query**: Large input
- **Search In**: Checkboxes
  - Books
  - Blog Posts
  - Events
  - Awards
  - FAQs
  - Gallery
  - All
- **Filters**:
  - Date Range
  - Author/User
  - Category
  - Status
- **Results Display**: Paginated list
- **Sort Options**: Relevance, Date, Title

---

## 📱 MOBILE RESPONSIVENESS

**ALL PAGES ARE MOBILE-RESPONSIVE**

### Mobile Navigation
- **Hamburger Menu**: Collapses navigation
- **Bottom Tab Bar** (optional):
  - Home
  - Books
  - Profile
  - More (expandable)
- **Swipe Gestures**: 
  - Swipe to go back
  - Pull to refresh
- **Mobile-Optimized Forms**:
  - Larger touch targets
  - Number keyboards for numeric inputs
  - Date pickers use native mobile pickers

---

## 🎯 KEY USER WORKFLOWS

### Workflow 1: Adding a Book with ISBN
1. User logs in → Dashboard
2. Click **My Books** → `/books`
3. Click **Add New Book** → `/book/entry-method`
4. Enter ISBN in "ISBN Search" section
5. Click **Search**
6. System fetches data from Google Books API
7. System generates affiliate purchase links
8. Data stored in localStorage
9. User redirected to `/book/new` with pre-filled form
10. User reviews/edits pre-filled data
11. User adds cover image (if not auto-fetched)
12. User selects status (Published/Draft)
13. User clicks **Save Book**
14. System validates all fields
15. System saves to database
16. User redirected to `/books` with success toast
17. New book appears in list

### Workflow 2: Adding a Book Manually
1. User logs in → Dashboard
2. Click **My Books** → `/books`
3. Click **Add New Book** → `/book/entry-method`
4. Click **Manual Entry**
5. User redirected to `/book/new` with blank form
6. User enters all fields manually:
   - Title, subtitle, description
   - ISBN (optional)
   - Publication details
   - Category, genres, tags
   - Upload cover image
   - Add purchase links manually
7. User clicks **Save Book**
8. System validates
9. System saves to database
10. User redirected to `/books`

### Workflow 3: Creating a Blog Post
1. User goes to `/user/blog`
2. Click **Add New Post** → `/user/blog/create`
3. User enters title (auto-generates slug)
4. User writes content in rich text editor
5. User selects category
6. User adds tags
7. User uploads featured image
8. User toggles "Featured" if desired
9. User sets status (Draft or Published)
10. User enters SEO metadata
11. System auto-calculates word count & reading time
12. User clicks **Publish** or **Save as Draft**
13. If "Require Approval" in settings: Status set to Pending
14. User redirected to `/user/blog`
15. Post appears in list with appropriate status badge

### Workflow 4: Managing Contact Submissions
1. User receives email notification of new contact
2. User goes to `/user/contact`
3. New submissions show with "New" badge
4. User clicks **View Details** on a submission → `/user/contact/{id}`
5. User reads full message
6. User clicks **Reply**
7. Reply form expands
8. User types response
9. User clicks **Send Reply**
10. System sends email to submitter
11. System updates status to "Replied"
12. Reply recorded in history
13. User marks as "Resolved" when done
14. User returns to inbox

### Workflow 5: Admin Approving Blog Posts
1. Admin logs in → `/admin`
2. Click **Blog Management** → `/admin/blog`
3. Filter by Status: "Pending"
4. Admin reviews pending posts
5. Admin clicks **View** to preview
6. Admin clicks **Approve**
7. System changes status to "Published"
8. System sends email notification to author
9. Post appears on public site
10. Post removed from pending queue

---

## 🎨 DESIGN SYSTEM

### Colors (from design system)
- **Primary**: Main brand color (buttons, links)
- **Secondary**: Supporting color
- **Accent**: Highlight color
- **Background**: Page background
- **Foreground**: Text color
- **Muted**: Subdued elements
- **Destructive**: Errors, delete actions
- **Success**: Confirmations, success states
- **Warning**: Cautions, warnings

### Typography
- **Headings**: Multiple levels (H1-H6)
- **Body**: Standard text
- **Small**: Fine print, labels
- **Large**: Emphasized text

### Components
- **Buttons**: Primary, Secondary, Outline, Ghost, Destructive
- **Cards**: Container for content sections
- **Badges**: Status indicators
- **Alerts**: Notifications and messages
- **Dialogs**: Modal popups for confirmations
- **Forms**: Input fields, textareas, selects, checkboxes
- **Tables**: Data display with sorting
- **Tabs**: Content organization
- **Accordions**: Expandable sections

---

## 🔒 SECURITY & PERMISSIONS

### Role-Based Access
- **Admin**: Full system access
- **Publisher**: Manage own authors and settings
- **Moderator**: Review and approve content
- **User**: Manage own content only

### Feature Access by Plan
- **Free Plan**:
  - Limited books (e.g., 5)
  - Basic theme access
  - Standard support
- **Pro Plan**:
  - Unlimited books
  - All themes
  - Advanced analytics
  - Priority support
  - Custom domain

### Data Privacy
- User passwords: Encrypted
- Admin credentials: Encrypted
- File uploads: Secured storage
- API keys: Encrypted secrets
- Database: RLS policies enforced

---

## 📞 SUPPORT & HELP

### Help Resources
- **Documentation**: `/docs` (this guide)
- **Video Tutorials**: `/tutorials`
- **FAQ**: `/help/faq`
- **Contact Support**: `/user/contact` or `/admin/helpdesk`

### Support Channels
- **Contact Form**: Available to all users
- **Help Desk**: For registered users
- **Email Support**: support@yoursite.com
- **Live Chat**: Available to Pro users

---

## 🚀 GETTING STARTED CHECKLIST

### For New Users
- [ ] Complete registration
- [ ] Verify email
- [ ] Set up profile (name, bio, photo)
- [ ] Choose and customize theme
- [ ] Add your first book (ISBN or manual)
- [ ] Explore dashboard features
- [ ] Create public profile slug
- [ ] Add social links
- [ ] Write first blog post (optional)
- [ ] Review analytics

### For Publishers
- [ ] Complete publisher setup
- [ ] Configure branding
- [ ] Add your first author
- [ ] Set up billing (if applicable)
- [ ] Configure author permissions
- [ ] Set up integrations (ISBN, affiliates)
- [ ] Review publisher analytics

### For Admins
- [ ] Review system settings
- [ ] Configure email settings
- [ ] Set up backup schedule
- [ ] Configure security settings
- [ ] Review user registrations
- [ ] Set up help desk categories
- [ ] Configure SEO settings
- [ ] Test deployment process

---

## 📊 REPORTING & ANALYTICS

### Available Reports
- User growth report
- Book catalog report
- Blog performance report
- Newsletter statistics report
- Contact form submissions report
- Support ticket report
- Revenue report (if billing enabled)

### Export Formats
- CSV
- PDF
- Excel
- JSON (for developers)

---

## ⚡ PERFORMANCE OPTIMIZATION

### Site Speed
- Image optimization
- Lazy loading
- CDN integration
- Caching strategies
- Minified assets

### Database
- Indexed queries
- RLS policies
- Connection pooling

---

## 🔄 UPDATES & MAINTENANCE

### System Updates
- Automatic security patches
- Feature updates (with changelog)
- Bug fixes
- Performance improvements

### Maintenance Mode
- Admin can enable maintenance mode
- Custom maintenance message
- Admins can still access site

---

## 📝 CHANGELOG

### Version History
- All updates logged
- Release notes available
- Breaking changes highlighted
- Migration guides provided

---

**END OF COMPLETE PORTAL GUIDE**

This guide covers every feature, page, button, and workflow in the platform. Each section is a separate page - no popups. All features are modular and can be accessed independently.

**For Knowledge Base**: Download this guide and add to your project's Knowledge Base for AI-powered user support.

**Last Updated**: 2025-01-30
**Version**: 1.0.0
