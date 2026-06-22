# MathHub — Revised Implementation Plan
## (Post Open-Questions Answers)

---

## Technology Decisions & Analysis

### 1. 🎬 Video Hosting Strategy — IMPORTANT

**Your decision:** Zoom recording links hosted by Zoom itself, behind a platform paywall.

**My analysis & recommendation:**

This is actually the smartest move for a bootstrapped start. Here's why it works and the risks:

| Aspect | Assessment |
|--------|-----------|
| **Cost** | ✅ Included in Zoom Pro (~$15/month) — no extra CDN bill |
| **Setup complexity** | ✅ Very low — teacher uploads recording, pastes link |
| **Piracy risk** | ⚠️ Medium — Zoom links can be shared by paying students |
| **Watermarking** | ⚠️ Zoom has built-in audio watermarking (Pro), not visual dynamic watermarking |
| **Platform control** | ⚠️ Zoom can break links, change expiry policies |

**How we'll protect the recordings on the platform side:**
- The Zoom link is **never exposed in the HTML source or API response directly**. The backend returns a short-lived signed token, and the frontend fetches the link only after verifying the student's subscription is active.
- The frontend **overlays a visible dynamic watermark** (student name + ID + timestamp) rendered as a CSS/canvas layer on top of the Zoom iframe, using `pointer-events: none` so it doesn't block interaction but appears on screen recordings.
- Zoom's own passcode protection adds another layer — the backend embeds the passcode in the link server-side, the student never sees the raw URL.

> **This approach is sound for your current scale.** When you grow, the migration path is: swap the Zoom link for a proper DRM host (VdoCipher ~$49/mo has excellent Egypt/Gulf CDN nodes) without changing any UI.

---

### 2. 📡 Live Sessions — Zoom Pro

**Your decision:** Zoom Pro confirmed. Live link behind paywall, recording uploaded manually after.

**My recommendation: Keep Zoom Pro, but here's a tighter workflow:**

```
Session Lifecycle (UI States):
  UPCOMING → LIVE → ENDED → RECORDING AVAILABLE
```

- **UPCOMING**: Session card shows date/time countdown. "Join" button locked (subscribe/enroll CTA).
- **LIVE** (admin flips status manually or via schedule): "Join Session" button revealed — clicking it opens Zoom link in new tab (link served from backend, never raw in HTML). Session card shows pulsing LIVE badge.
- **ENDED**: Card shows "Recording Coming Soon" placeholder.
- **RECORDING**: Admin uploads Zoom recording URL. Card transitions to video player view. Same paywall protection applies.

> **Why NOT a cheaper alternative like Google Meet?** Google Meet free has 60-min limit. Google Workspace Business Starter ($6/user/month) has unlimited meetings but no cloud recording. Zoom Pro ($15/month) gives you 5GB cloud storage + recording — which you're leveraging for hosting too. It's the right call.

---

### 3. 💳 Payment Gateway — Decision Required

**For Egypt-primary + Gulf-secondary audience:**

| Gateway | Transaction Fee | Setup | Gulf Support | Subscriptions | Verdict |
|---------|----------------|-------|-------------|---------------|---------|
| **Paymob** | ~2.75% + 3 EGP | Free | KSA, UAE, Oman ✅ | ✅ Built-in module | **Best for Egypt-first** |
| **PayTabs** | ~2.9% (negotiable) | Minimal | All GCC ✅✅ | ✅ | Best for Gulf-first |
| **Telr** | Tiered monthly plan | Low | UAE, KSA, Jordan ✅ | ✅ | Transparent pricing |
| **Fawry** | ~2.75% + 499 EGP/mo min | 999 EGP | ❌ Egypt only | Limited | Only if cash payments needed |

**My recommendation: Start with Paymob.**
- Egypt is your primary market and Paymob owns it
- They've expanded to KSA and UAE, covering your Gulf students
- Free setup, no minimum monthly
- Has a subscriptions module out of the box
- Developer-friendly API
- If Gulf volume grows significantly, add PayTabs as a secondary gateway later

> [!IMPORTANT]
> **Please confirm:** Is your business registered in Egypt? If yes, Paymob is the clear choice. If you need to bill Gulf students in USD/SAR/AED exclusively, PayTabs may be better. This affects which UI payment flow we design.

---

### 4. Unified Sessions Tab ✅

**Both Recorded + Live merged into one "Sessions" tab.**

Sessions have a lifecycle with 4 states, shown as UI states on the same card:

```
┌────────────────────────────────────────────────┐
│ 📅 UPCOMING    → grey card, countdown timer     │
│ 🔴 LIVE NOW    → red pulsing badge, join button │
│ ⏳ PROCESSING  → "Recording coming soon"         │
│ 🎬 RECORDING   → video player view available   │
└────────────────────────────────────────────────┘
```

Filter pills on the Sessions page: `All` | `Live` | `Recordings` | `Upcoming`

---

### 5. Multi-Student Parents ✅

Parent dashboard has a **student selector** (dropdown or tab bar) at the top. All data (reports, submissions, activity) filters by the selected student. A parent with 3 students sees all 3 and can switch between their views.

---

### 6. Notifications Dropdown ✅ (In-app only, no email)

Bell icon in topbar opens a slide-down panel:
- Notification items: icon + message + timestamp
- Types: New session available, assignment graded, session went live, subscription renewal reminder
- "Mark all read" button
- Max 20 items visible, "View all" link

---

## Revised Route Structure

```
app/
├── (auth)/
│   ├── layout.js                  ← Centered, no sidebar
│   ├── login/page.js
│   └── forgot-password/page.js
│
├── (student)/
│   ├── layout.js                  ← Student sidebar + topbar + notification provider
│   ├── page.js                    ← Dashboard
│   ├── sessions/
│   │   ├── page.js                ← Unified Sessions (Live + Recorded) ← REPLACES both old pages
│   │   └── [id]/page.js           ← Session detail (player OR live join)
│   ├── assignments/page.js
│   ├── quizzes/page.js
│   ├── analytics/page.js
│   ├── help/page.js               ← Assistance requests
│   ├── payments/page.js
│   └── settings/page.js
│
├── (admin)/
│   ├── layout.js                  ← Admin sidebar + topbar
│   ├── admin/
│   │   ├── page.js                ← Admin dashboard
│   │   ├── users/page.js
│   │   ├── sessions/
│   │   │   ├── page.js            ← Manage all sessions
│   │   │   └── [id]/page.js       ← Edit session (lifecycle controls)
│   │   ├── assignments/
│   │   │   ├── page.js
│   │   │   └── [id]/page.js       ← Grade / review
│   │   ├── reports/page.js
│   │   ├── payments/page.js
│   │   └── settings/page.js
│
├── (parent)/
│   ├── layout.js
│   ├── parent/
│   │   ├── page.js                ← Dashboard (student selector)
│   │   ├── reports/page.js
│   │   ├── payments/page.js
│   │   └── settings/page.js
│
├── globals.css
└── layout.js                      ← Root: fonts + metadata only
```

---

## Updated Sidebar Navigation

### Student Sidebar
| Icon | Label | Route |
|------|-------|-------|
| `dashboard` | Dashboard | `/` |
| `play_circle` | Sessions | `/sessions` ← NEW unified |
| `assignment` | Assignments | `/assignments` |
| `quiz` | Quizzes | `/quizzes` |
| `analytics` | Analytics | `/analytics` |
| `support_agent` | Help & Requests | `/help` |
| `payments` | Payments | `/payments` |
| `settings` | Settings | `/settings` |

### Admin Sidebar
| Icon | Label | Route |
|------|-------|-------|
| `dashboard` | Dashboard | `/admin` |
| `group` | Students & Parents | `/admin/users` |
| `play_circle` | Sessions | `/admin/sessions` |
| `assignment` | Assignments | `/admin/assignments` |
| `assessment` | Reports | `/admin/reports` |
| `payments` | Payments & Plans | `/admin/payments` |
| `settings` | Settings | `/admin/settings` |

### Parent Sidebar
| Icon | Label | Route |
|------|-------|-------|
| `dashboard` | Overview | `/parent` |
| `assessment` | Reports | `/parent/reports` |
| `payments` | Payments | `/parent/payments` |
| `settings` | Settings | `/parent/settings` |

---

## Shared Components to Build

| Component | Purpose | Used By |
|-----------|---------|---------|
| `NotificationDropdown.js` | Bell icon + notification list | All roles (topbar) |
| `SessionCard.js` | Unified card for all 4 session states | Student + Admin |
| `PaywallGate.js` | Locks content behind subscription check | Sessions, content |
| `WatermarkOverlay.js` | CSS/canvas overlay with student ID | Session player |
| `StudentSelector.js` | Dropdown to switch between students | Parent dashboard |
| `StatusBadge.js` | Colored pill for session/assignment status | All pages |
| `DataTable.js` | Sortable, filterable table | Admin pages |
| `Modal.js` | Generic overlay/dialog | User mgmt, forms |
| `FileUploadZone.js` | Drag-and-drop file upload | Assignments, sessions |
| `StatsCard.js` | KPI card with trend arrow | All dashboards |
| `TabBar.js` | Tab switching | Sessions, admin tables |
| `LifecycleControls.js` | Admin controls to advance session state | Admin sessions |

---

## Execution Order (5 Phases)

> [!IMPORTANT]
> Please review and confirm or reorder phases before I start implementing.

---

### Phase 1 — Foundation & Auth (Week 1)
*Nothing else works without this.*

1. **Restructure** existing pages into route groups `(student)/(admin)/(parent)/(auth)` with proper layouts
2. **Root layout** → minimal fonts/metadata only
3. **Shared components**: `NotificationDropdown`, `StatusBadge`, `Modal`, `StatsCard`
4. **Auth pages**: Login, Forgot Password (no backend — just UI with mock state)
5. **Update Student Sidebar**: Remove old Live/Recorded, add unified Sessions + Help + Payments links

---

### Phase 2 — Unified Sessions (Student + Admin) (Week 2)
*Core value of the platform.*

6. **Sessions list page** (`/sessions`) — unified with filter pills (All / Live / Recordings / Upcoming), session cards in all 4 states
7. **Session detail page** (`/sessions/[id]`) — 2 views:
   - **Live view**: Zoom join button (paywalled), countdown, live chat placeholder
   - **Recording view**: Watermark overlay + Zoom iframe or link, comments/Q&A thread below
8. **Admin: Manage Sessions** (`/admin/sessions`) — table of all sessions, status controls, edit
9. **Admin: Session lifecycle controls** — admin can set status (Upcoming → Live → Ended → Recording), paste Zoom link, set paywall price

---

### Phase 3 — Admin Core Tools (Week 3)
*Teacher's daily workflow.*

10. **Admin Dashboard** — KPI stats, upcoming sessions, pending assignments, recent activity
11. **Admin: User Management** — list students + parents, create/edit accounts, link parent↔student
12. **Admin: Assignments** — create assignment, view submissions, grade + feedback
13. **Admin: Reports** — generate + preview weekly reports per student (no email, just in-platform PDF view)

---

### Phase 4 — Student Features (Week 4)
*Completing the student experience.*

14. **Student: Assignments** — enhance upload flow with `FileUploadZone`, show grade + feedback
15. **Student: Help / Assistance Requests** — form to request help, status tracking
16. **Student: Analytics** — already built, connect to session progress data
17. **Parent Dashboard** — student selector, quick stats, latest report card, upcoming deadlines
18. **Parent: Reports** — detailed weekly report view per student

---

### Phase 5 — Payments & Polish (Week 5)
*Monetization and finishing touches.*

19. **Student: Payments page** — current plan card, subscription plans (if unsubscribed), payment history
20. **Admin: Payments/Revenue** — transaction table, plan management, revenue overview
21. **Parent: Payments** — payment history, receipts
22. **Settings pages** — Student, Admin, Parent (profile, password, notifications)
23. **Notification system** — notification dropdown content for all event types
24. **Final polish** — mobile responsiveness audit, loading states, empty states, error states

---

## Pages Count Summary (Final)

| Role | Pages |
|------|-------|
| Auth | 2 |
| Student | 9 (incl. unified sessions) |
| Admin | 7 |
| Parent | 4 |
| **Total** | **22** |

---

## What Happens to the Old Separate Sessions Pages?

- `app/recorded-sessions/` → **deleted**
- `app/live-sessions/` → **deleted**
- Both replaced by `app/(student)/sessions/` (unified)

The sessions feature is now a single coherent flow, which also simplifies the admin side significantly.
