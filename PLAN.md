# MathHub — Frontend Implementation Handoff Plan

## 1. Project Overview

An e-learning platform for a math teacher serving Egypt and Gulf students. The teacher manages sessions, assignments, and subscriptions. Three user roles: **Admin (Teacher)**, **Student**, **Parent**.

---

## 2. Current Codebase State

**Location:** `/home/marcello/bm_solutions/math_hub/frontend/`
**Stack:** Next.js 16.2.3 (App Router) · React 19 · Tailwind CSS v4 · JavaScript (no TypeScript)
**Run:** `npm run dev` → http://localhost:3000

### What already exists (flat structure — needs restructuring):
```
frontend/
├── app/
│   ├── globals.css          ← Tailwind v4 theme (DO NOT CHANGE)
│   ├── layout.js            ← Root layout with Sidebar + Topbar
│   ├── page.js              ← Student Dashboard
│   ├── recorded-sessions/page.js   ← TO BE DELETED
│   ├── live-sessions/page.js       ← TO BE DELETED
│   ├── assignments/page.js
│   ├── quizzes/page.js
│   └── analytics/page.js
├── components/
│   ├── Sidebar.js           ← Student sidebar (needs updating)
│   └── Topbar.js            ← Shared topbar
```

### What must be done first — Route Group Restructuring:
Move all existing student pages into `app/(student)/` route group.
Delete `recorded-sessions/` and `live-sessions/` — replaced by unified `sessions/`.

---

## 3. Design System (Tailwind v4 — `globals.css`)

**DO NOT change these tokens.** Use them via Tailwind utility classes.

```css
/* Brand Colors */
--color-primary: #903311          /* Rust — buttons, active states, CTA */
--color-primary-hover: #7A2B0E
--color-primary-light: rgba(144,51,17,0.10)
--color-primary-xlight: rgba(144,51,17,0.05)
--color-primary-container: #B84A1C

--color-secondary: #285474        /* Teal — secondary actions, insights */
--color-secondary-hover: #1E4460
--color-secondary-light: rgba(40,84,116,0.10)
--color-secondary-xlight: rgba(40,84,116,0.05)

--color-surface: #E1E4E4          /* Page background */
--color-surface-low: #EAEDED      /* Sidebar, card bg */
--color-surface-lowest: #FFFFFF
--color-surface-high: #D4D8D8     /* Borders, dividers */
--color-surface-highest: #C8CCCC

--color-ink: #1A1A1A              /* Primary text */
--color-ink-muted: #858585        /* Secondary text, labels */
--color-ink-on-primary: #FFFFFF
--color-danger: #C62828
--color-warning: #E6A817
```

**Typography:**
- Headlines: `font-headline` → Manrope (loaded via `next/font/google`)
- Body: `font-body` → Inter (loaded via `next/font/google`)
- Icons: Material Symbols Outlined (loaded via `<link>` in root layout)

**Global CSS classes (defined in globals.css):**
- `.glass` — frosted glass card: `background: rgba(255,255,255,0.65); backdrop-filter: blur(16px)`
- `.animate-fade-in-up` — card entrance animation
- `.animate-pulse-live` — pulsing red dot for LIVE badge
- `.stagger` — stagger child animations (add to grid containers)

**Card pattern used throughout:** `className="glass rounded-2xl p-6 shadow-glass hover:shadow-elevated hover:-translate-y-1 transition-all duration-400"`

---

## 4. Technology Decisions

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Live sessions | Zoom Pro | Teacher hosts, recording manual upload |
| Video hosting | Zoom Cloud Recording | Included in Zoom Pro, zero extra cost |
| Payment gateway | **PayTabs** | Gulf-first audience (KSA, UAE, Jordan), pan-GCC coverage, subscription support |
| Watermarking | CSS overlay in frontend | Student name + ID rendered as `pointer-events:none` layer over Zoom iframe |
| Notifications | In-app dropdown only | No email — platform notifications only |

### Video / Session Security Model
- Zoom recording links are **never exposed in HTML source**
- Backend stores link + passcode; serves a short-lived signed token to authenticated subscribers only
- Frontend: on session player page, overlay `<div>` with student name + ID + timestamp, `position:absolute; pointer-events:none; opacity:0.18; z-index:50`
- This watermark appears in screen recordings, deterring piracy

### PayTabs Integration Notes (UI only — backend handles API)
- Display plan cards with price in USD (Gulf audience)
- Checkout redirects to PayTabs hosted page (no card form to build)
- Show payment history table fetched from backend
- Invoice download links served by backend

---

## 5. Target Route Structure

```
app/
├── (auth)/                         ← No sidebar, centered layout
│   ├── layout.js
│   ├── login/page.js
│   └── forgot-password/page.js
│
├── (student)/                      ← Student sidebar + topbar
│   ├── layout.js
│   ├── page.js                     ← Dashboard
│   ├── sessions/
│   │   ├── page.js                 ← Unified sessions list
│   │   └── [id]/page.js            ← Session detail (live OR recording)
│   ├── assignments/page.js
│   ├── quizzes/page.js
│   ├── analytics/page.js
│   ├── help/page.js                ← Assistance requests
│   ├── payments/page.js
│   └── settings/page.js
│
├── (admin)/                        ← Admin sidebar + topbar
│   ├── layout.js
│   └── admin/
│       ├── page.js                 ← Admin dashboard
│       ├── users/page.js
│       ├── sessions/
│       │   ├── page.js
│       │   └── [id]/page.js        ← Edit session + lifecycle controls
│       ├── assignments/
│       │   ├── page.js
│       │   └── [id]/page.js        ← Grade / review
│       ├── reports/page.js
│       ├── payments/page.js
│       └── settings/page.js
│
├── (parent)/                       ← Parent sidebar + topbar
│   ├── layout.js
│   └── parent/
│       ├── page.js                 ← Dashboard (multi-student selector)
│       ├── reports/page.js
│       ├── payments/page.js
│       └── settings/page.js
│
├── globals.css                     ← DO NOT MODIFY
└── layout.js                       ← Root: fonts + Material Symbols link only
```

**Note:** Next.js route groups `(auth)`, `(student)`, `(admin)`, `(parent)` do NOT affect URL paths. `/sessions` is still the URL for the student sessions page inside `(student)/sessions/page.js`.

---

## 6. Sidebar Navigation per Role

### Student Sidebar
```js
const studentNav = [
  { href: "/",            icon: "dashboard",     label: "Dashboard" },
  { href: "/sessions",    icon: "play_circle",   label: "Sessions" },
  { href: "/assignments", icon: "assignment",    label: "Assignments" },
  { href: "/quizzes",     icon: "quiz",          label: "Quizzes" },
  { href: "/analytics",   icon: "analytics",     label: "Analytics" },
  { href: "/help",        icon: "support_agent", label: "Help & Requests" },
  { href: "/payments",    icon: "payments",      label: "Payments" },
  { href: "/settings",    icon: "settings",      label: "Settings" },
];
```

### Admin Sidebar
```js
const adminNav = [
  { href: "/admin",              icon: "dashboard",   label: "Dashboard" },
  { href: "/admin/users",        icon: "group",       label: "Students & Parents" },
  { href: "/admin/sessions",     icon: "play_circle", label: "Sessions" },
  { href: "/admin/assignments",  icon: "assignment",  label: "Assignments" },
  { href: "/admin/reports",      icon: "assessment",  label: "Reports" },
  { href: "/admin/payments",     icon: "payments",    label: "Payments & Plans" },
  { href: "/admin/settings",     icon: "settings",    label: "Settings" },
];
```

### Parent Sidebar
```js
const parentNav = [
  { href: "/parent",           icon: "dashboard",  label: "Overview" },
  { href: "/parent/reports",   icon: "assessment", label: "Reports" },
  { href: "/parent/payments",  icon: "payments",   label: "Payments" },
  { href: "/parent/settings",  icon: "settings",   label: "Settings" },
];
```

---

## 7. Shared Components to Create

All in `components/` folder. Use `"use client"` directive only where client interactivity is needed.

| File | Description |
|------|-------------|
| `NotificationDropdown.js` | Bell icon → slide-down panel with notification list. "Mark all read" button. Max 20 items. Types: session live, assignment graded, subscription renewal. Mock data until backend ready. |
| `SessionCard.js` | Single card supporting 4 states (see §8). Props: `{ session, enrolled }` |
| `PaywallGate.js` | Wraps locked content. Shows subscribe/enroll CTA if `enrolled=false`. |
| `WatermarkOverlay.js` | Absolute positioned overlay. Props: `{ studentName, studentId }`. Renders diagonal tiled text, `opacity-20`, `pointer-events-none`, `z-50`. |
| `StudentSelector.js` | Dropdown to switch between linked students. For parent layout topbar. |
| `StatusBadge.js` | Colored pill. Props: `{ status }` — maps to color. |
| `DataTable.js` | Sortable table. Props: `{ columns, data, actions }`. |
| `Modal.js` | Generic dialog. Props: `{ open, onClose, title, children }`. Backdrop blur. |
| `FileUploadZone.js` | Drag-and-drop. Props: `{ accept, onFile }`. Dashed border, hover state. |
| `StatsCard.js` | KPI card. Props: `{ icon, label, value, trend, color }`. |
| `TabBar.js` | Pill tab switcher. Props: `{ tabs, active, onChange }`. |
| `LifecycleControls.js` | Admin-only. Buttons to advance session state. Props: `{ currentStatus, onAdvance }`. |

---

## 8. Unified Sessions Feature (Critical)

Sessions replace both the old `recorded-sessions` and `live-sessions` pages.

### Session Lifecycle States

| State | UI Behaviour |
|-------|-------------|
| `UPCOMING` | Grey card. Countdown timer. "Register" button (paywalled). No media. |
| `LIVE` | Card has pulsing red "LIVE NOW" badge. "Join Session" button appears (opens Zoom link in new tab, served from backend — never raw in HTML). |
| `ENDED` | "Recording Coming Soon" placeholder. Greyed out. |
| `RECORDING` | Full card with thumbnail area. "Watch Recording" button. Paywall check. Clicking opens session detail page with Zoom recording iframe + watermark overlay. |

### Sessions List Page (`/sessions/page.js`)
- Page header: "Sessions"
- Filter `TabBar`: `All | Live | Recordings | Upcoming`
- Responsive grid of `SessionCard` components (3 cols desktop, 2 tablet, 1 mobile)
- Mock data array covering all 4 states for UI dev

### Session Detail Page (`/sessions/[id]/page.js`)
Two views based on session state:

**LIVE view:**
```
┌─────────────────────────────────────────────┐
│  🔴 LIVE NOW badge          [Leave Session] │
│  Session title + instructor                 │
│  ─────────────────────────────────────────  │
│  [Join on Zoom button — full width primary] │
│  Zoom link opens in new tab (backend token) │
│  ─────────────────────────────────────────  │
│  Session info: topic, duration, date        │
└─────────────────────────────────────────────┘
```

**RECORDING view (2-column layout):**
```
┌───────────────────────────┬────────────────┐
│  Zoom iframe / link area  │  Session       │
│  + WatermarkOverlay on top│  Outline       │
│  (8 cols)                 │  (4 cols)      │
│                           │  Chapter list  │
│                           │  with checks   │
├───────────────────────────┴────────────────┤
│  Tabs: Overview | Comments & Q&A           │
│  Comments thread + "Ask a Question" input  │
└────────────────────────────────────────────┘
```

---

## 9. Page-by-Page Specifications

### AUTH

**Login (`/login`)**
- Centered card on `bg-surface` background, no sidebar
- MathHub logo + "Digital Atheneum" tagline
- Email input + Password input (show/hide toggle)
- Primary "Sign In" button (full width, rust gradient)
- "Forgot Password?" link
- No role selector (backend determines role, redirects to correct portal)

**Forgot Password (`/forgot-password`)**
- Same centered layout
- Email input + "Send Reset Link" button
- Success state: checkmark icon + "Check your email" message

---

### STUDENT PAGES

**Dashboard (`/`)**
- Already built. Minor additions needed:
  - "Upcoming Sessions" mini-list (next 2 sessions from mock data)
  - "Open Requests" count badge on Help sidebar link

**Sessions (`/sessions`)** — See §8 above

**Session Detail (`/sessions/[id]`)** — See §8 above

**Assignments (`/assignments`)** — Already built. Enhance:
- `FileUploadZone` component for PDF upload
- Show grade + teacher feedback below each submitted row

**Quizzes (`/quizzes`)** — Already built. No changes needed.

**Analytics (`/analytics`)** — Already built. No changes needed.

**Help & Requests (`/help`)**
- Header + "New Request" primary button
- New Request form (shown in `Modal`): Topic (dropdown linked to sessions), Description (textarea), Priority (Low/Medium/High radio), optional file attach
- Requests list below: each as card or table row
- Status badges: `Open` (rust), `In Progress` (teal), `Resolved` (muted)
- Expandable row shows admin response

**Payments (`/payments`)**
- If subscribed: "Current Plan" glass card (plan name, price, renewal date, "Manage" button)
- If NOT subscribed: 2–3 plan cards side by side with features list + price in USD + "Subscribe" button → redirect to PayTabs
- "Payment History" table: Date | Description | Amount | Status | Receipt
- Receipt column: download icon button

**Settings (`/settings`)**
- Profile section: Name, email, avatar upload (`FileUploadZone`)
- Password section: Current PW, New PW, Confirm PW
- Notifications section: toggle switches for in-app notification types
- Save button per section

---

### ADMIN PAGES

**Admin Dashboard (`/admin`)**
- Stats row (4 `StatsCard`): Total Students, Sessions This Month, Pending Assignments, Revenue MTD
- Quick Actions row: "Add Session", "Create Assignment", "Add User", "Generate Report" — each a glass card with icon + label, navigates to respective page
- Two-column bottom: Recent Activity feed (left) | Upcoming Sessions mini-list (right)
- Revenue bar chart (CSS bars, same pattern as student Analytics page)

**User Management (`/admin/users`)**
- Header: "Users" + "Add User" button (opens `Modal`)
- `TabBar`: `All | Students | Parents`
- Search input
- `DataTable`: Avatar initials | Name | Email | Role badge | Status badge | Joined | Actions (Edit / Deactivate)
- Add/Edit `Modal` form: First name, Last name, Email, Role (Student/Parent dropdown), Auto-generate password toggle, Link student ↔ parent selector (multi-select for parent)

**Manage Sessions (`/admin/sessions`)**
- Header: "Sessions" + "Add Session" button (opens `Modal`)
- `DataTable`: Title | Date | Status badge | Enrolled count | Actions (Edit / Delete)
- "Add Session" `Modal`: Title, Description, Scheduled date+time, Max participants, Zoom live link (pasted by teacher), Price (or free)
- Edit opens same modal pre-filled + shows `LifecycleControls` to advance state
- When advancing to RECORDING: form field to paste Zoom recording link

**Session Edit (`/admin/sessions/[id]`)**
- Full edit form
- `LifecycleControls` component: current state shown, "Advance to [next state]" button
- Recording link field appears only when state = ENDED → RECORDING

**Assignment Management (`/admin/assignments`)**
- Header + "Create Assignment" button
- `TabBar`: `Pending Review | All | Graded`
- Table: Student | Assignment | Submitted | Grade | Status | Actions
- Create Assignment `Modal`: Title, Description, Due date, attach PDF material

**Assignment Review (`/admin/assignments/[id]`)**
- Two-panel layout:
  - Left (7 cols): PDF viewer placeholder (iframe or download link), student info
  - Right (5 cols): Grading panel — score input (0–100), feedback textarea, "Save Grade" primary button

**Reports (`/admin/reports`)**
- "Generate Report" section: student multi-select, date range picker, "Generate" button
- Preview panel below (shows report card with grade breakdown, sessions watched, assignments completed, teacher notes)
- Download as PDF button
- Report history table: Student | Period | Generated | Actions (View / Delete)
- NOTE: No email sending — in-platform only

**Admin Payments (`/admin/payments`)**
- Revenue overview: 3 `StatsCard` — Total Earned, This Month, Pending
- `TabBar`: `Transactions | Plans`
- Transactions table: Student | Plan | Amount | Date | Status | Invoice
- Plans tab: list of subscription plans as cards + "Add Plan" button
- Plan card: Name, Price/period, Features list, Active toggle, Edit button
- Add/Edit Plan `Modal`: Name, Price (USD), Billing cycle (monthly/term), Features (textarea), Active toggle

**Admin Settings (`/admin/settings`)**
- Platform name field
- Timezone selector
- PayTabs config section (display-only keys, actual secrets in backend .env)
- Default session settings

---

### PARENT PAGES

**Parent Dashboard (`/parent`)**
- `StudentSelector` in topbar (dropdown, all linked students)
- All content below filters by selected student
- Stats row (3 `StatsCard`): Average Grade, Sessions Watched This Week, Assignments Submitted
- Latest Report card: week label + key metrics + "View Full Report" link
- Upcoming Deadlines list: next 3 assignments/sessions due
- Recent Activity feed: student's latest 5 actions

**Reports (`/parent/reports`)**
- Report cards list sorted newest first
- Each card: Week range | Grade trend (↑↓ arrow) | Sessions watched | Assignments completed | "View Details" button
- Expanded/detail view: Grade breakdown table, session list with % watched, assignment scores, teacher notes text area (read-only), "Download PDF" button

**Parent Payments (`/parent/payments`)**
- Current plan card
- Payment history table: Date | Amount | Status | Receipt download

**Parent Settings (`/parent/settings`)**
- Profile info (name, email, avatar)
- Linked students (read-only list)
- Notification preferences toggles

---

## 10. Notification Dropdown

Add to `Topbar.js` (all roles).

```jsx
// Bell icon with unread count badge
// Click → absolute positioned panel slides down (z-50)
// Panel contents:
//   - "Notifications" header + "Mark all read" link
//   - List of notification items (max 20):
//     { icon, message, time, read: bool }
//   - Unread items have bg-primary-xlight left border
//   - "View all" link at bottom
// Notification types + icons:
//   session_live     → "live_tv"       → "Session is now live: [title]"
//   recording_ready  → "play_circle"   → "Recording available: [title]"
//   assignment_graded→ "grade"         → "Assignment graded: [score]/100"
//   subscription     → "payments"      → "Subscription renews in 3 days"
//   new_assignment   → "assignment"    → "New assignment posted: [title]"
```

Use mock data array. State management: `useState` for `open` toggle and `notifications` array.

---

## 11. Execution Order (Phases)

### Phase 1 — Foundation (do this first, everything depends on it)
1. Restructure into route groups: move existing pages into `(student)/`
2. Minimize root `layout.js` to fonts + Material Symbols `<link>` only
3. Create `(student)/layout.js`, `(admin)/layout.js`, `(parent)/layout.js`, `(auth)/layout.js`
4. Build shared components: `Modal`, `StatusBadge`, `StatsCard`, `TabBar`, `NotificationDropdown`
5. Update `Topbar.js` to include `NotificationDropdown`
6. Build auth pages: Login, Forgot Password
7. Delete old `recorded-sessions/` and `live-sessions/` directories

### Phase 2 — Unified Sessions (core feature)
8. Build `SessionCard.js` (all 4 states)
9. Build `PaywallGate.js`, `WatermarkOverlay.js`
10. Student Sessions list page (`/sessions`)
11. Student Session detail page (`/sessions/[id]`) — both LIVE and RECORDING views
12. Admin Sessions list page (`/admin/sessions`)
13. Admin Session edit + `LifecycleControls` (`/admin/sessions/[id]`)

### Phase 3 — Admin Tools
14. Admin Dashboard (`/admin`)
15. User Management (`/admin/users`) + `DataTable.js`
16. Assignment Management (`/admin/assignments`) + `FileUploadZone.js`
17. Assignment Review (`/admin/assignments/[id]`)
18. Reports (`/admin/reports`)

### Phase 4 — Student & Parent Features
19. Student Help/Requests (`/help`)
20. Enhance Student Assignments (FileUploadZone + grade/feedback display)
21. Parent Dashboard (`/parent`) + `StudentSelector.js`
22. Parent Reports (`/parent/reports`)

### Phase 5 — Payments & Polish
23. Student Payments (`/payments`)
24. Admin Payments (`/admin/payments`)
25. Parent Payments (`/parent/payments`)
26. All Settings pages (student, admin, parent)
27. Mobile responsiveness audit across all pages
28. Loading states (skeleton screens) on data-heavy pages
29. Empty states (no sessions, no assignments, etc.)
30. Error boundary pages

---

## 12. Key Implementation Rules

1. **All pages are Server Components by default.** Only add `"use client"` when you need `useState`, `useEffect`, `usePathname`, or event handlers.
2. **No inline styles** except for dynamic values (e.g., `style={{ width: \`${progress}%\` }}`). Use Tailwind classes for everything else.
3. **Mock data** — all pages use hardcoded mock data arrays at the top of the file. No API calls yet. Backend integration is a separate phase.
4. **Consistent card pattern:** `className="glass rounded-2xl p-6 shadow-glass hover:shadow-elevated hover:-translate-y-1 transition-all duration-400 animate-fade-in-up"`
5. **Page headers** follow this pattern:
   ```jsx
   <div className="mb-10 animate-fade-in-up">
     <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Page Title</h1>
     <p className="text-ink-muted text-base max-w-[600px] leading-relaxed">Subtitle</p>
   </div>
   ```
6. **Primary buttons:** `className="px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 hover:-translate-y-0.5 active:scale-95 transition-all"`
7. **Secondary buttons:** `className="px-6 py-3 bg-surface-highest text-primary font-headline font-bold rounded-xl hover:bg-primary hover:text-white active:scale-95 transition-all duration-300"`
8. **Tables** use this structure: `glass rounded-2xl overflow-hidden` wrapper → `<table className="w-full text-left">` → `<thead>` with `bg-surface-low` → `<tbody>` rows with `hover:bg-white/50 transition-colors`
9. **Never hardcode color hex values in JSX.** Always use Tailwind tokens (e.g., `text-primary`, `bg-secondary-light`).
10. **Stagger animations:** Wrap grid containers with `className="... stagger"` — the CSS handles the rest.

---

## 13. Package.json (Current)

```json
{
  "dependencies": {
    "next": "16.2.3",
    "react": "19.2.4",
    "react-dom": "19.2.4"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "eslint": "^9",
    "eslint-config-next": "16.2.3",
    "tailwindcss": "^4"
  }
}
```

No additional packages needed for the UI phase. PayTabs integration (redirect-based checkout) requires no frontend SDK.
