# UniSkill Hub – A Student Skill & Knowledge Sharing Platform

A LinkedIn-inspired academic networking web application built by undergraduate university students to showcase academic skills, connect across faculties, share study materials, publish knowledge articles, engage in peer discussions, and provide administrative oversight.

---

## 👥 University Coursework Group Project Overview

| Member | Module Responsibility | Key Web Pages & Scripts |
| :--- | :--- | :--- |
| **Member 1** | **Authentication & User Profile Management** | `index.html`, `register.html`, `login.html`, `dashboard.html`, `profile.html`, `js/register.js`, `js/login.js`, `js/dashboard.js`, `js/logout.js` |
| **Member 2** | **Learning Resource Management & Storage** | `resources/resources.html`, `resources/upload-resource.html`, `resources/resource-details.html`, `resources/my-resources.html`, `js/resources.js`, `js/upload-resource.js` |
| **Member 3** | **Knowledge Feed & Article Publishing** | `articles/articles.html`, `articles/create-article.html`, `articles/article-details.html`, `articles/edit-article.html`, `articles/my-articles.html`, `js/articles.js` |
| **Member 4** | **Skill Directory & Peer Connection System** | `skills.html`, `student-profile.html`, `connections.html`, `css/skills.css`, `js/skills.js` |
| **Member 5** | **Community Discussion & Collaboration** | `community.html`, `ask-question.html`, `question-details.html`, `notifications.html`, `css/community.css`, `js/community.js` |
| **Member 6** | **Admin Dashboard & System Management** | `admin-login.html`, `admin-dashboard.html`, `manage-users.html`, `manage-resources.html`, `manage-articles.html`, `reports.html`, `css/admin.css`, `js/admin.js` |

---

## 🛠️ Technologies & Architectural Principles

- **Frontend**: Pure **HTML5**, **CSS3**, and **Vanilla JavaScript** (Standard DOM manipulation, `fetch`, `async/await`, `localStorage`).
- **Backend / Database**: **Supabase** (PostgreSQL Database, Authentication, Row-Level Security, Supabase Cloud Storage).
- **Libraries**: Only the official `@supabase/supabase-js@2` CDN script.
- **Strictly Avoided**: No React, Vue, Angular, Bootstrap, Tailwind, Node.js, Express, TypeScript, or heavy chart libraries.
- **Design Philosophy**: Clean, professional, LinkedIn-inspired theme:
  - Primary Blue: `#0A66C2` (Hover: `#004182`, Light: `#E8F3FC`)
  - Background: `#F3F2EF`
  - Cards: Pure White (`#FFFFFF`) with subtle 1px border and light drop shadow
  - Typography: Clean system sans-serif font stack
  - Responsive: Mobile, tablet, and desktop adaptive 3-column feed layouts

---

## 📁 Complete Project Directory Structure

```text
University Student Skill & Knowledge Hub/
│
├── index.html                   # Platform Landing / Home Page (Member 1)
├── register.html                # Student Registration with Faculty & Degree (Member 1)
├── login.html                   # Student Login & Password Recovery (Member 1)
├── dashboard.html               # 3-Column LinkedIn Student Feed & Dashboard (Member 1)
├── profile.html                 # Student Profile Details & Skills Tagging (Member 1 & 4)
├── skills.html                  # Member 4: Skill Directory & Student Peer Search
├── student-profile.html         # Member 4: Public Student Profile & Shared Content
├── connections.html             # Member 4: Connection Requests & Connected Peers
├── community.html               # Member 5: Community Discussion Forum Feed
├── ask-question.html            # Member 5: Post New Academic Question Form
├── question-details.html        # Member 5: View Question & Peer Discussion Thread
├── notifications.html           # Member 5: Real-Time Alerts & Notification Feed
├── admin-login.html             # Member 6: Admin Portal Sign-In (admin@uniskill.lk)
├── admin-dashboard.html         # Member 6: System Overview & Platform Statistics
├── manage-users.html            # Member 6: Manage & Moderate Registered Students
├── manage-resources.html        # Member 6: Manage & Moderate Uploaded Resources
├── manage-articles.html         # Member 6: Manage & Moderate Published Articles
├── reports.html                 # Member 6: System Activity Tables & Usage Reports
├── resources.html               # Convenience Root Redirect to resources/resources.html
├── articles.html                # Convenience Root Redirect to articles/articles.html
├── supabase-schema.sql          # Unified PostgreSQL Database Schema (All 6 Members)
├── README.md                    # Comprehensive Project Documentation
│
├── resources/                   # Member 2: Learning Resource Module
│   ├── resources.html           # 1. Search & Filter Learning Materials
│   ├── upload-resource.html     # 2. File Upload Form with Drag-and-Drop (Max 20MB)
│   ├── resource-details.html    # 3. Resource Overview & Direct File Download
│   └── my-resources.html        # 4. Student Resource Management (Edit & Delete)
│
├── articles/                    # Member 3: Knowledge Feed & Article Module
│   ├── articles.html            # 1. Knowledge Feed with Categories & Likes
│   ├── create-article.html      # 2. Write & Publish Academic Article Form
│   ├── article-details.html     # 3. Read Full Article & Comment Discussion
│   ├── edit-article.html        # 4. Edit Existing Article Form
│   └── my-articles.html         # 5. Student Article Management (Edit & Delete)
│
├── css/
│   ├── style.css                # Global Theme, Navbar, Badges, Alert Boxes
│   ├── login.css                # Centered Authentication Card Styling
│   ├── profile.css              # Profile Header, Banner & Skills Pills Styling
│   ├── dashboard.css            # 3-Column Feed, Left Profile Card, Right Widgets
│   ├── resources.css            # Resource Cards, Dropzone & File Metadata (Member 2)
│   ├── articles.css             # Article Cards, Like Button & Comment Threads (Member 3)
│   ├── skills.css               # Student Cards, Filter Toolbar, Connections UI (Member 4)
│   ├── community.css            # Discussion Question Cards, Replies, Alerts (Member 5)
│   └── admin.css                # Metric Cards, Data Tables & Reports (Member 6)
│
└── js/
    ├── supabase-config.js       # Live Supabase v2 Client Setup & Offline Fallback
    ├── register.js              # Student Registration Logic & Validation
    ├── login.js                 # Student Login & Session Verification
    ├── dashboard.js             # Activity Feed Aggregator (Resources & Articles)
    ├── logout.js                # Session Sign-Out Utility
    ├── resources.js             # Member 2: Browse, Search, Category Filter & Bookmark
    ├── upload-resource.js       # Member 2: File Validation (PDF/DOC/PPT) & Cloud Upload
    ├── resource-details.js      # Member 2: Load Single Resource & Download Counter
    ├── my-resources.js          # Member 2: Manage Student Uploads (Edit/Delete)
    ├── articles.js              # Member 3: Load Feed, Like Toggle & Topic Filters
    ├── create-article.js        # Member 3: Article Publish Validation & Cloud Image
    ├── article-details.js       # Member 3: Load Article, Post Comments & Like Counter
    ├── edit-article.js          # Member 3: Update Article Fields
    ├── my-articles.js           # Member 3: Manage Student Articles (Edit/Delete)
    ├── skills.js                # Member 4: Skill Directory, Connections & Profile
    ├── community.js             # Member 5: Questions Feed, Answer Thread & Notifications
    └── admin.js                 # Member 6: Admin Auth, Metrics, Moderation & Reports
```

---

## 🗄️ Database Tables & Schema (Supabase PostgreSQL)

The database schema in `supabase-schema.sql` links all modules relational models with Row Level Security (RLS) enabled.

### Member 1: Authentication & Profiles
1. **`profiles` Table**:
   - `id` (UUID, Primary Key, references `auth.users(id)` ON DELETE CASCADE)
   - `full_name` (TEXT)
   - `email` (TEXT)
   - `faculty` (TEXT: Science, Computing, Engineering, Management, Humanities, Medicine)
   - `degree` (TEXT, e.g., "BSc Software Engineering")
   - `academic_year` (TEXT: 1st Year, 2nd Year, 3rd Year, 4th Year)
   - `profile_image` (TEXT, Avatar URL)
   - `bio` (TEXT, Student biography)
   - `skills` (TEXT, Comma-separated key skills)
   - `created_at` (TIMESTAMPTZ)

### Member 2: Learning Resources & Storage
2. **`categories` Table**:
   - `id` (BIGINT, Primary Key)
   - `category_name` (TEXT UNIQUE: Mathematics, Statistics, Programming, Networking, Business, English)
3. **`resources` Table**:
   - `id` (UUID, Primary Key DEFAULT `gen_random_uuid()`)
   - `user_id` (UUID, references `auth.users(id)` ON DELETE CASCADE)
   - `title` (TEXT)
   - `description` (TEXT)
   - `category_id` (BIGINT, references `categories(id)`)
   - `file_url` (TEXT, Supabase Storage download link)
   - `file_name` (TEXT)
   - `file_size` (TEXT, e.g. "2.4 MB")
   - `created_at` (TIMESTAMPTZ)
4. **`bookmarks` Table**:
   - `id` (UUID, Primary Key)
   - `user_id` (UUID, references `auth.users(id)`)
   - `resource_id` (UUID, references `resources(id)` ON DELETE CASCADE)
   - `created_at` (TIMESTAMPTZ)
   - `UNIQUE(user_id, resource_id)`

### Member 3: Knowledge Feed & Articles
5. **`articles` Table**:
   - `id` (UUID, Primary Key DEFAULT `gen_random_uuid()`)
   - `user_id` (UUID, references `auth.users(id)` ON DELETE CASCADE)
   - `title` (TEXT, 5 to 100 characters)
   - `content` (TEXT, 20 to 5000 characters)
   - `category` (TEXT: Programming, Statistics, Mathematics, Academic Tips, Research, General)
   - `image_url` (TEXT, Optional banner image)
   - `created_at`, `updated_at` (TIMESTAMPTZ)
6. **`article_comments` Table**:
   - `id` (UUID, Primary Key)
   - `article_id` (UUID, references `articles(id)` ON DELETE CASCADE)
   - `user_id` (UUID, references `auth.users(id)` ON DELETE CASCADE)
   - `comment` (TEXT)
   - `created_at` (TIMESTAMPTZ)
7. **`article_likes` Table**:
   - `id` (UUID, Primary Key)
   - `article_id` (UUID, references `articles(id)` ON DELETE CASCADE)
   - `user_id` (UUID, references `auth.users(id)` ON DELETE CASCADE)
   - `created_at` (TIMESTAMPTZ)
   - `UNIQUE(article_id, user_id)`

### Member 4: Skill Directory & Peer Connections
8. **`skills` Table**:
   - `id` (BIGINT, Primary Key)
   - `skill_name` (TEXT UNIQUE, e.g., "Python", "Data Science", "Web Development")
9. **`student_skills` Table**:
   - `id` (UUID, Primary Key DEFAULT `gen_random_uuid()`)
   - `user_id` (UUID, references `auth.users(id)` ON DELETE CASCADE)
   - `skill_id` (BIGINT, references `skills(id)` ON DELETE CASCADE)
   - `UNIQUE(user_id, skill_id)`
10. **`connections` Table**:
    - `id` (UUID, Primary Key DEFAULT `gen_random_uuid()`)
    - `sender_id` (UUID, references `auth.users(id)` ON DELETE CASCADE)
    - `receiver_id` (UUID, references `auth.users(id)` ON DELETE CASCADE)
    - `status` (TEXT: `'pending'`, `'accepted'`, `'rejected'`)
    - `created_at` (TIMESTAMPTZ)
    - `UNIQUE(sender_id, receiver_id)`

### Member 5: Community Discussions & Notifications
11. **`questions` Table**:
    - `id` (UUID, Primary Key DEFAULT `gen_random_uuid()`)
    - `user_id` (UUID, references `auth.users(id)` ON DELETE CASCADE)
    - `title` (TEXT, Question headline)
    - `description` (TEXT, Full question description)
    - `category` (TEXT: Programming, Mathematics, Statistics, Engineering, General)
    - `created_at` (TIMESTAMPTZ)
12. **`answers` Table**:
    - `id` (UUID, Primary Key DEFAULT `gen_random_uuid()`)
    - `question_id` (UUID, references `questions(id)` ON DELETE CASCADE)
    - `user_id` (UUID, references `auth.users(id)` ON DELETE CASCADE)
    - `answer` (TEXT, Peer solution content)
    - `created_at` (TIMESTAMPTZ)
13. **`notifications` Table**:
    - `id` (UUID, Primary Key DEFAULT `gen_random_uuid()`)
    - `user_id` (UUID, references `auth.users(id)` ON DELETE CASCADE)
    - `message` (TEXT, Notification alert message)
    - `is_read` (BOOLEAN DEFAULT FALSE)
    - `created_at` (TIMESTAMPTZ)

---

## ☁️ Supabase Cloud Storage Buckets

1. **`learning-resources` Bucket**:
   - Public read access for course notes, lecture slides, and past papers.
   - Allowed formats: `.pdf`, `.ppt`, `.pptx`, `.doc`, `.docx`.
   - Size limit: **20 MB**.
2. **`article-images` Bucket**:
   - Public read access for knowledge article headers and illustrations.
   - Allowed formats: `.jpg`, `.jpeg`, `.png`, `.webp`.
   - Size limit: **5 MB**.

---

## 🔍 Detailed Module Documentation

### Member 1: Authentication & User Profile Management
- **Registration (`register.html`, `js/register.js`)**:
  - Full client-side input validation (Name, university email, secure password, faculty selection, degree, academic year).
  - Uses `supabase.auth.signUp()`.
  - Automatically provisions profile row in `profiles` table.
  - Automatically logs the student in upon registration and redirects to `index.html` with a success welcome banner.
- **Login (`login.html`, `js/login.js`)**:
  - Authenticates student using `supabase.auth.signInWithPassword()`.
  - Caches active session in `localStorage.uniskill_active_session`.
  - Includes password recovery modal (`supabase.auth.resetPasswordForEmail()`).
- **Student Dashboard (`dashboard.html`, `js/dashboard.js`)**:
  - 3-column LinkedIn-inspired grid.
  - Left column: Student identity card, academic year, faculty, and navigation shortcuts.
  - Middle feed: Post creator bar + unified feed displaying peer resources and articles.
  - Right column: Faculty announcements and suggested peer connections.

---

### Member 2: Learning Resource Management & Storage
- **Browse & Search Materials (`resources/resources.html`, `js/resources.js`)**:
  - Search by title, description, category, and faculty.
  - Category dropdown filter (Mathematics, Statistics, Programming, Networking, Business, English).
  - Sort by Newest, Oldest, or Alphabetical (A-Z).
  - Quick toggle to display "Saved Only" resources.
- **Resource Upload (`resources/upload-resource.html`, `js/upload-resource.js`)**:
  - Drag-and-drop zone with file size check (max 20 MB).
  - Directly uploads to Supabase Storage bucket `learning-resources`.
  - Saves file metadata into `resources` table.
- **Resource Details (`resources/resource-details.html`, `js/resource-details.js`)**:
  - Displays full description, uploader information, file type icon, file size, and direct download button.
  - Lists related resources in the same academic subject.
- **Manage My Resources (`resources/my-resources.html`, `js/my-resources.js`)**:
  - Allows students to manage their uploaded files.
  - Provides inline modal editing for Title, Description, and Category.
  - Secure deletion with confirmation dialog.

---

### Member 3: Knowledge Feed & Article Publishing
- **Knowledge Feed (`articles/articles.html`, `js/articles.js`)**:
  - Clean card feed with author photo, name, faculty, publication date, and category badge.
  - Category filters: Programming, Statistics, Mathematics, Academic Tips, Research.
  - Real-time search by keyword and author.
  - Interactive Like button with instant counter update and persistence.
- **Article Publishing (`articles/create-article.html`, `js/create-article.js`)**:
  - Form validation: Title (min 5, max 100), Category, Content (min 20, max 5000).
  - Optional banner image upload to Supabase Storage `article-images`.
  - Immediate sync with the main dashboard feed.
- **Article Details & Comments (`articles/article-details.html`, `js/article-details.js`)**:
  - Full article reader view with author card and like button.
  - Peer comment section where students post constructive discussions.
- **Manage My Articles (`articles/my-articles.html`, `articles/edit-article.html`, `js/edit-article.js`)**:
  - View, edit, or delete published articles.

---

### Member 4: Skill Directory & Peer Connection System
- **Skill Directory & Peer Search (`skills.html`, `js/skills.js`)**:
  - Search students across the university by skill name (e.g., Python, Machine Learning, Java, UI/UX, Statistics, AutoCAD).
  - Filter students by faculty (Science, Computing, Engineering, Management, Humanities, Medicine) and academic year.
  - Student card displays avatar, name, degree, faculty, skills pills, and **+ Connect** button.
- **Public Student Profile (`student-profile.html`, `js/skills.js`)**:
  - Comprehensive view of an undergraduate peer.
  - Displays bio, academic details, verified skills pills, shared learning resources, and published articles.
  - Connection action button (Connect, Pending, Connected).
- **Peer Connections Manager (`connections.html`, `js/skills.js`)**:
  - Tabbed interface:
    - **Pending Requests**: Displays received connection requests with **Accept** and **Decline** actions.
    - **My Network**: Displays all accepted peer connections with profile links and remove option.
    - **Suggested Peers**: Recommends students from the same faculty or degree program.
  - Connection statuses are synced to Supabase `connections` table and local cache.

---

### Member 5: Community Discussion & Collaboration
- **Discussion Forum Feed (`community.html`, `js/community.js`)**:
  - Academic Q&A forum inspired by Stack Overflow and LinkedIn groups.
  - Topic category tabs: *All Topics, Programming, Mathematics, Statistics, Engineering, General Studies*.
  - Question cards show question title, author, faculty, preview snippet, topic badge, answer count, and date.
  - Direct CTA button: **+ Ask a Question**.
- **Ask Academic Question (`ask-question.html`, `js/community.js`)**:
  - Clean form with Title, Category selection, and Description textarea.
  - Client-side validation: Title min 8 chars, Description min 20 chars.
  - Automatically posts to Supabase `questions` table and notifies peers.
- **Question Details & Peer Answers (`question-details.html`, `js/community.js`)**:
  - Detailed view of the question with original poster details.
  - Answer thread showing all peer solutions and explanations with timestamps.
  - Rich answer reply box where students can contribute solutions.
- **Alerts & Notification Feed (`notifications.html`, `js/community.js`)**:
  - Real-time notification feed for peer connection requests, accepted connections, and replies to questions.
  - Visual unread indicators and a **Mark all as read** button.

---

### Member 6: Admin Dashboard & System Management
- **Admin Portal Sign-In (`admin-login.html`, `js/admin.js`)**:
  - Dedicated administrative sign-in portal.
  - Preset Academic Administrator Credentials:
    - **Email**: `admin@uniskill.lk`
    - **Password**: `admin123`
  - Strict role verification guarding administrative routes.
- **Admin Dashboard (`admin-dashboard.html`, `js/admin.js`)**:
  - Clean metric summary cards:
    - **Total Registered Students**
    - **Total Uploaded Resources**
    - **Total Knowledge Articles**
    - **Total Community Discussions**
  - Quick action shortcuts to moderation tables.
  - Recent system audit and platform activity log.
- **Manage Students (`manage-users.html`, `js/admin.js`)**:
  - Searchable data table of all university students.
  - Columns: Student Name, Email, Faculty, Academic Year, Date Joined, Actions.
  - Delete / Suspend student account action with instant table update.
- **Manage Learning Resources (`manage-resources.html`, `js/admin.js`)**:
  - Searchable data table of all uploaded study materials.
  - Columns: Title, Category, Uploader, File Size, Upload Date, File Link, Actions.
  - Delete inappropriate or duplicate resource materials.
- **Manage Knowledge Articles (`manage-articles.html`, `js/admin.js`)**:
  - Searchable data table of all published articles.
  - Columns: Title, Category, Author, Publish Date, Actions.
  - Content moderation: Delete non-academic or inappropriate posts.
- **System Reports (`reports.html`, `js/admin.js`)**:
  - Clean statistical tables (zero heavy chart dependencies):
    - **Most Active Students** (Ranked by published resources and articles).
    - **Trending Technical Skills** (Ranked by number of student endorsements).
    - **Most Downloaded Resources** (Ranked by peer downloads and bookmarks).

---

## 🚀 Setup & Execution Guide

### 1. Running Locally
Because UniSkill Hub is built using standard HTML5, CSS3, and Vanilla JavaScript, **no compilation, bundlers, or Node.js environment are required**.

1. Clone or extract the project folder to your local machine.
2. Open `index.html` in any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari).
3. Alternatively, serve the folder with any static local web server (e.g., VS Code *Live Server*, Python `python -m http.server 8000`).

### 2. Supabase Cloud Database Configuration
The project is already pre-configured with active Supabase API credentials in [`js/supabase-config.js`](file:///c:/Users/Admin/Documents/University%20Student%20Skill%20&%20Knowledge%20Hub/js/supabase-config.js).

If you want to deploy your own Supabase instance:
1. Log in to [Supabase](https://supabase.com) and create a new project.
2. In the Supabase Dashboard, navigate to **SQL Editor**.
3. Open [`supabase-schema.sql`](file:///c:/Users/Admin/Documents/University%20Student%20Skill%20&%20Knowledge%20Hub/supabase-schema.sql), copy its full contents, paste them into the SQL editor, and click **Run**.
4. In **Storage**, verify that two public buckets are created:
   - `learning-resources` (Public: Yes)
   - `article-images` (Public: Yes)
5. Copy your Project URL and Anon Public Key from **Project Settings > API** into `js/supabase-config.js`.

---

## 🎓 6-Member Presentation & Demonstration Script

Follow this step-by-step walkthrough during your evaluation:

### 1. Member 1: Authentication & User Profile
1. Open [`index.html`](file:///c:/Users/Admin/Documents/University%20Student%20Skill%20&%20Knowledge%20Hub/index.html). Point out the LinkedIn-style navbar, hero section, and 3-step workflow.
2. Click **"Join Now"** (`register.html`). Fill in student details:
   - Select Faculty (*Faculty of Science*), Degree (*BSc Computer Science*), Academic Year (*3rd Year*).
   - Click **"Create Account"**. Show that registration automatically signs the user in and redirects to `index.html` with a green welcome banner.
3. Click **"Go to Student Dashboard"** (`dashboard.html`).
   - Show the 3-column LinkedIn feed layout.
   - Show the left student card with avatar, degree, faculty, and quick shortcuts.
   - Click **"My Profile"** (`profile.html`) to show full profile details, bio, and skill tags.

### 2. Member 2: Learning Resource Management & Storage
1. From the navbar, click **"Resources"** (`resources/resources.html`).
   - Point out category filters (*Mathematics*, *Programming*, *Statistics*).
   - Use the search bar to filter by keyword.
   - Click the **Bookmark** button on any resource card (turns gold: *Saved ★*).
2. Click **"+ Upload Resource"** (`resources/upload-resource.html`).
   - Drag or choose a PDF/DOC/PPT file (verified <= 20 MB).
   - Select category and enter description.
   - Click **"Upload Resource"** — show success alert and automatic appearance in the feed.
3. Open **"My Resources"** (`resources/my-resources.html`).
   - Demonstrate inline editing of resource title/category and deletion.

### 3. Member 3: Knowledge Feed & Article Publishing
1. From the navbar, click **"Articles"** (`articles/articles.html`).
   - Show category buttons (*Programming*, *Statistics*, *Academic Tips*).
   - Click the **Like** button on any article — observe live counter increment.
2. Click **"Write Article"** (`articles/create-article.html`).
   - Enter title (*"Understanding Binary Search in C++"*), select Category (*Programming*), write content.
   - Click **"Publish Article"** — show automatic redirect and placement at the top of the feed.
3. Click **"Read full article"** (`articles/article-details.html`).
   - Show full article text and post a comment in the discussion box.
4. Show that published articles automatically appear in the main student dashboard feed (`dashboard.html`).

### 4. Member 4: Skill Directory & Peer Connections
1. From the navbar, click **"Network"** (`skills.html`).
   - Show directory of students with their avatars, degrees, and verified skill badges.
   - Type in the search box: e.g., *"Python"*, *"Statistics"*, or *"Machine Learning"* — results filter immediately.
   - Filter by Faculty (*Faculty of Science*) and Year (*2nd Year*).
   - Click **"+ Connect"** on a student card — the button changes to a green **"Pending"** state.
2. Click on a student's name or avatar to open **`student-profile.html`**.
   - Show detailed view: student bio, faculty, full skill badges, and their shared resources.
3. Click **"Manage Connections"** or navigate to `connections.html`.
   - Show **"Pending Requests"** tab with **Accept** and **Decline** buttons.
   - Click **Accept** — peer moves immediately to the **"My Network"** tab.
   - Show **"Suggested Peers"** tab recommending fellow classmates from the same faculty.

### 5. Member 5: Community Discussion & Collaboration
1. From the navbar, click **"Community"** (`community.html`).
   - Show the academic discussion forum with topic filter pills (*All Topics*, *Programming*, *Mathematics*, *Statistics*).
   - Show question preview cards with topic badges and answer counts.
2. Click **"+ Ask a Question"** (`ask-question.html`).
   - Fill in Question Title (*"How do I normalize database tables to 3NF?"*), select category (*Computing / Programming*), write description.
   - Click **"Post Question"** — redirected to forum where question is pinned to the top.
3. Click on a question to open **`question-details.html`**.
   - Show original question details and author info.
   - Write a solution in the answer box and click **"Submit Answer"** — response appears instantly in the discussion thread.
4. Click **"Alerts"** in the top navbar (`notifications.html`).
   - Show real-time notification alerts (connection requests, accepted connections, question answers).
   - Test clicking **"Mark all as read"** to clear unread badges.

### 6. Member 6: Admin Dashboard & System Management
1. Click **"Admin Portal"** in the footer of any page (or go to `admin-login.html`).
2. Sign in with the administrative credentials:
   - **Email**: `admin@uniskill.lk`
   - **Password**: `admin123`
3. Land on **Admin Dashboard** (`admin-dashboard.html`):
   - Show top metric cards: Total Students, Total Resources, Total Articles, Total Questions.
   - Show Platform Overview and Recent Activity log.
4. Navigate to **"Manage Users"** (`manage-users.html`):
   - Search students by name or email.
   - Show delete / suspend student action with confirmation modal.
5. Navigate to **"Manage Resources"** (`manage-resources.html`):
   - Search uploaded resources and demonstrate moderation deletion.
6. Navigate to **"Manage Articles"** (`manage-articles.html`):
   - Search published articles and demonstrate article removal.
7. Click **"Reports"** (`reports.html`):
   - Show clean, professional analytical tables:
     - **Most Active Students** table.
     - **Trending Academic Skills** table.
     - **Most Downloaded Resources** table.
8. Click **"Logout"** in the admin sidebar — safely redirects back to `index.html`.

---

## 🔒 Security & Offline Resilience

- **Supabase Row-Level Security (RLS)**: Enforces access control at the database level so students can only modify or delete their own resources and articles.
- **Fail-Safe Offline Mode**: If internet access is interrupted or Supabase cloud is unreachable during the presentation, all modules seamlessly fall back to local browser storage (`localStorage`) and pre-populated sample university data. The platform will never crash or display blank screens during evaluation!

---

*UniSkill Hub – Developed as a collaborative university coursework project.*
