# MathHub — Backend Implementation Plan (Finalized)

## Decisions Incorporated

| # | Decision |
|---|----------|
| 1 | **VPS self-hosting** — DigitalOcean or Hetzner, Docker + Nginx |
| 2 | **Domain via Cloudflare** — not yet registered; PayTabs webhook configured once domain is live |
| 3 | **Supabase** — free tier for Postgres + file storage; migrate later if needed |
| 4 | **Resend** — strictly for password-reset transactional emails only; all other notifications remain in-app |
| 5 | **Full quiz engine** — backend-driven; teacher builds rich quizzes (text, media, choices, text-answer, media-upload); MC auto-graded; text/media manually graded by admin |
| 6 | **Two-tier RBAC** — `SUPERADMIN` (Teacher) has full access; `ASSISTANT` (additional admins) can manage users, grade work, and advance session lifecycle — but cannot access payments, platform settings, webhooks, or perform destructive actions |

---

## Architecture

```
math_hub/
├── frontend/          ← Existing Next.js (unchanged)
└── backend/           ← New Express service
```

**VPS Deployment Stack:**
```
Cloudflare DNS
  → Nginx (reverse proxy + SSL termination via Let's Encrypt)
    → Docker container: backend (Node.js :4000)
    → Docker container: frontend (Next.js :3000)  ← optional, or Vercel
Supabase (external): PostgreSQL + File Storage
Resend (external): Transactional email
```

`docker-compose.yml` orchestrates backend + Nginx. Supabase and Resend are external managed services — no containers needed for them.

---

## Tech Stack

| Concern | Choice |
|---------|--------|
| Runtime | Node.js 22 LTS |
| Framework | Express 5 |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 6 |
| Auth | JWT (access 15min + refresh 7d, httpOnly cookie) |
| Passwords | bcrypt |
| File storage | Supabase Storage |
| Payments | PayTabs Hosted Payment Page |
| Email | Resend (password reset only) |
| Validation | Zod |
| Rate limiting | express-rate-limit |
| Deployment | Docker + Nginx + Let's Encrypt |

---

## RBAC Model

```
Role enum: SUPERADMIN | ASSISTANT | STUDENT | PARENT
```

| Permission | SUPERADMIN | ASSISTANT | STUDENT | PARENT |
|-----------|:---:|:---:|:---:|:---:|
| Manage users (CRUD) | ✅ | ✅ | ❌ | ❌ |
| Create/edit sessions | ✅ | ✅ | ❌ | ❌ |
| Advance session lifecycle | ✅ | ✅ | ❌ | ❌ |
| Create/edit quizzes | ✅ | ✅ | ❌ | ❌ |
| Grade assignments & quizzes | ✅ | ✅ | ❌ | ❌ |
| View payments & revenue | ✅ | ❌ | own only | ❌ |
| Platform settings (PayTabs, keys) | ✅ | ❌ | ❌ | ❌ |
| Destructive actions (delete data, reset) | ✅ | ❌ | ❌ | ❌ |
| Create new SUPERADMIN accounts | ✅ | ❌ | ❌ | ❌ |
| Generate reports | ✅ | ✅ | ❌ | read own child |

Middleware: `requireRole('SUPERADMIN')`, `requireRole('ASSISTANT', 'SUPERADMIN')`, `requireOwnerOrAdmin`.

---

## Database Schema (Prisma)

```prisma
enum Role         { SUPERADMIN ASSISTANT STUDENT PARENT }
enum SessionStatus { UPCOMING LIVE ENDED RECORDING }
enum PricingType  { SESSION COURSE }
enum PurchaseType { SESSION COURSE FREE }
enum PaymentStatus { PENDING PAID FAILED REFUNDED }
enum Priority     { LOW MEDIUM HIGH }
enum TicketStatus { OPEN IN_PROGRESS RESOLVED }
enum QuestionType { MULTIPLE_CHOICE TEXT_ANSWER MEDIA_UPLOAD MIXED }
enum AttemptStatus { IN_PROGRESS SUBMITTED GRADED }
enum NotificationType {
  SESSION_LIVE RECORDING_READY ASSIGNMENT_GRADED
  NEW_ASSIGNMENT HELP_RESPONSE QUIZ_GRADED
}

// ── Users ──────────────────────────────────────────────
model User {
  id           String  @id @default(cuid())
  name         String
  email        String  @unique
  passwordHash String
  role         Role    @default(STUDENT)
  studentCode  String? @unique   // e.g. STU-20241001 — used in watermark
  avatarUrl    String?
  isActive     Boolean @default(true)
  createdAt    DateTime @default(now())

  linkedChildren   ParentStudent[]       @relation("ParentLinks")
  linkedParents    ParentStudent[]       @relation("StudentLinks")
  enrollments      Enrollment[]
  submissions      AssignmentSubmission[]
  quizAttempts     QuizAttempt[]
  payments         Payment[]
  notifications    Notification[]
  helpRequests     HelpRequest[]
  reports          Report[]
  refreshTokens    RefreshToken[]
  passwordResets   PasswordReset[]
}

model ParentStudent {
  parentId  String
  parent    User   @relation("ParentLinks", fields: [parentId], references: [id])
  studentId String
  student   User   @relation("StudentLinks", fields: [studentId], references: [id])
  @@id([parentId, studentId])
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  expiresAt DateTime
  revoked   Boolean  @default(false)
}

model PasswordReset {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  expiresAt DateTime
  used      Boolean  @default(false)
}

// ── Sessions & Courses ─────────────────────────────────
model Course {
  id           String    @id @default(cuid())
  name         String
  coursePrice  Float
  sessionPrice Float
  sessions     Session[]
  enrollments  Enrollment[]
  createdAt    DateTime  @default(now())
}

model Session {
  id               String        @id @default(cuid())
  title            String
  topic            String
  description      String?
  scheduledAt      DateTime
  durationMin      Int
  status           SessionStatus @default(UPCOMING)
  zoomLiveEnc      String?       // AES-256 encrypted
  zoomRecordingEnc String?       // AES-256 encrypted — never sent raw
  zoomPasscodeEnc  String?       // AES-256 encrypted
  pricingType      PricingType   @default(SESSION)
  sessionPrice     Float?
  courseId         String?
  course           Course?       @relation(fields: [courseId], references: [id])
  enrollments      Enrollment[]
  assignments      Assignment[]
  quizzes          Quiz[]
  createdAt        DateTime      @default(now())
}

model Enrollment {
  id           String       @id @default(cuid())
  userId       String
  user         User         @relation(fields: [userId], references: [id])
  sessionId    String?
  session      Session?     @relation(fields: [sessionId], references: [id])
  courseId     String?
  course       Course?      @relation(fields: [courseId], references: [id])
  purchaseType PurchaseType
  grantedAt    DateTime     @default(now())
  payment      Payment?
  @@unique([userId, sessionId])
}

// ── Assignments ────────────────────────────────────────
model Assignment {
  id          String    @id @default(cuid())
  title       String
  description String?
  dueDate     DateTime
  materialUrl String?
  sessionId   String?
  session     Session?  @relation(fields: [sessionId], references: [id])
  submissions AssignmentSubmission[]
  createdAt   DateTime  @default(now())
}

model AssignmentSubmission {
  id           String     @id @default(cuid())
  assignmentId String
  assignment   Assignment @relation(fields: [assignmentId], references: [id])
  studentId    String
  student      User       @relation(fields: [studentId], references: [id])
  fileUrl      String
  grade        Int?
  feedback     String?
  submittedAt  DateTime   @default(now())
  gradedAt     DateTime?
  @@unique([assignmentId, studentId])
}

// ── Quiz Engine ────────────────────────────────────────
model Quiz {
  id          String       @id @default(cuid())
  title       String
  description String?
  sessionId   String?
  session     Session?     @relation(fields: [sessionId], references: [id])
  questions   Question[]
  attempts    QuizAttempt[]
  isPublished Boolean      @default(false)
  createdAt   DateTime     @default(now())
}

model Question {
  id          String       @id @default(cuid())
  quizId      String
  quiz        Quiz         @relation(fields: [quizId], references: [id], onDelete: Cascade)
  text        String
  mediaUrl    String?      // image or video attached to question
  type        QuestionType
  order       Int
  points      Int          @default(1)
  correctText String?      // optional — for loose auto-grading of text answers
  choices     Choice[]
  answers     Answer[]
}

model Choice {
  id         String   @id @default(cuid())
  questionId String
  question   Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  text       String
  isCorrect  Boolean  @default(false)
  order      Int
  answers    Answer[]
}

model QuizAttempt {
  id          String        @id @default(cuid())
  quizId      String
  quiz        Quiz          @relation(fields: [quizId], references: [id])
  studentId   String
  student     User          @relation(fields: [studentId], references: [id])
  answers     Answer[]
  score       Float?
  maxScore    Float?
  status      AttemptStatus @default(IN_PROGRESS)
  startedAt   DateTime      @default(now())
  submittedAt DateTime?
  @@unique([quizId, studentId])
}

model Answer {
  id           String      @id @default(cuid())
  attemptId    String
  attempt      QuizAttempt @relation(fields: [attemptId], references: [id])
  questionId   String
  question     Question    @relation(fields: [questionId], references: [id])
  choiceId     String?
  choice       Choice?     @relation(fields: [choiceId], references: [id])
  textAnswer   String?     // for TEXT_ANSWER type
  mediaUrl     String?     // for MEDIA_UPLOAD type
  isCorrect    Boolean?    // auto-set for MC; manually set for text/media
  pointsEarned Float?
}

// ── Payments ───────────────────────────────────────────
model Payment {
  id            String        @id @default(cuid())
  userId        String
  user          User          @relation(fields: [userId], references: [id])
  enrollmentId  String?       @unique
  enrollment    Enrollment?   @relation(fields: [enrollmentId], references: [id])
  amount        Float
  currency      String        @default("USD")
  type          PurchaseType
  status        PaymentStatus @default(PENDING)
  paytabsRef    String?
  paytabsCartId String?       @unique
  receiptUrl    String?
  createdAt     DateTime      @default(now())
  paidAt        DateTime?
}

// ── Notifications ──────────────────────────────────────
model Notification {
  id        String           @id @default(cuid())
  userId    String
  user      User             @relation(fields: [userId], references: [id])
  type      NotificationType
  message   String
  read      Boolean          @default(false)
  createdAt DateTime         @default(now())
}

// ── Help Requests ──────────────────────────────────────
model HelpRequest {
  id          String       @id @default(cuid())
  studentId   String
  student     User         @relation(fields: [studentId], references: [id])
  topic       String
  description String
  priority    Priority     @default(MEDIUM)
  status      TicketStatus @default(OPEN)
  adminReply  String?
  repliedAt   DateTime?
  createdAt   DateTime     @default(now())
}

// ── Reports ────────────────────────────────────────────
model Report {
  id                   String   @id @default(cuid())
  studentId            String
  student              User     @relation(fields: [studentId], references: [id])
  weekStart            DateTime
  weekEnd              DateTime
  avgGrade             Float?
  sessionsAttended     Int      @default(0)
  assignmentsSubmitted Int      @default(0)
  quizAvgScore         Float?
  teacherNotes         String?
  generatedAt          DateTime @default(now())
}
```

---

## API Routes

### Auth — `/api/auth`
| Method | Route | Access | Notes |
|--------|-------|--------|-------|
| POST | `/login` | Public | Returns access token + sets refresh httpOnly cookie |
| POST | `/logout` | Auth | Revokes refresh token |
| POST | `/refresh` | Public | Rotates refresh token |
| POST | `/forgot-password` | Public | Sends Resend email with reset link |
| POST | `/reset-password` | Public | Validates token, sets new password |

### Users — `/api/users`
| Method | Route | Access |
|--------|-------|--------|
| GET | `/` | ASSISTANT+ |
| POST | `/` | ASSISTANT+ (SUPERADMIN only to create SUPERADMIN role) |
| PATCH | `/:id` | ASSISTANT+ (SUPERADMIN to change roles) |
| DELETE | `/:id` | SUPERADMIN only |
| POST | `/:id/link-parent` | ASSISTANT+ |
| GET/PATCH | `/me` | Auth (own) |

### Sessions — `/api/sessions`
| Method | Route | Access |
|--------|-------|--------|
| GET | `/` | Auth |
| POST/PATCH/DELETE | `/` or `/:id` | ASSISTANT+ (DELETE: SUPERADMIN only) |
| PATCH | `/:id/status` | ASSISTANT+ |
| GET | `/:id/zoom-link` | Auth + Enrolled |
| GET | `/:id/recording-url` | Auth + Enrolled |

> [!IMPORTANT]
> `zoomLiveEnc`, `zoomRecordingEnc`, `zoomPasscodeEnc` are **never included** in any session GET response. Only the `/zoom-link` and `/recording-url` endpoints decrypt them, after verifying enrollment, and return a short-lived (5-min TTL) signed redirect token.

### Courses — `/api/courses`
CRUD — ASSISTANT+ for write, Auth for read.

### Assignments — `/api/assignments`
| Method | Route | Access |
|--------|-------|--------|
| GET | `/` | Auth (student: own; admin: all) |
| POST | `/` | ASSISTANT+ |
| POST | `/:id/submit` | STUDENT |
| PATCH | `/:id/grade` | ASSISTANT+ |

### Quizzes — `/api/quizzes`
| Method | Route | Access | Notes |
|--------|-------|--------|-------|
| GET | `/` | Auth | Student: published only; Admin: all |
| POST | `/` | ASSISTANT+ | Create quiz shell |
| PATCH | `/:id` | ASSISTANT+ | Edit title/description/published |
| DELETE | `/:id` | SUPERADMIN only | |
| POST | `/:id/questions` | ASSISTANT+ | Add question (text, mediaUrl, type, order, points) |
| PATCH | `/:id/questions/:qId` | ASSISTANT+ | Edit question |
| DELETE | `/:id/questions/:qId` | ASSISTANT+ | |
| POST | `/:id/questions/:qId/choices` | ASSISTANT+ | Add MC choice |
| POST | `/:id/attempt` | STUDENT | Start attempt |
| POST | `/:id/attempt/answer` | STUDENT | Submit single answer |
| POST | `/:id/attempt/submit` | STUDENT | Finalize — triggers MC auto-grade |
| GET | `/:id/attempts` | ASSISTANT+ | All student attempts |
| PATCH | `/:id/attempts/:aId/grade` | ASSISTANT+ | Manually grade text/media answers |

**Auto-grading logic:**
- `MULTIPLE_CHOICE`: On submission, backend compares `choiceId` to `Choice.isCorrect` → sets `isCorrect` + `pointsEarned` instantly.
- `TEXT_ANSWER`: Stored as-is, flagged for manual review by admin. If `Question.correctText` is set, attempt a case-insensitive fuzzy match (optional).
- `MEDIA_UPLOAD`: Stored in Supabase Storage, flagged for manual review.
- `MIXED`: Both choice + text expected — MC portion auto-graded, text portion manual.

### Payments — `/api/payments`
| Method | Route | Access |
|--------|-------|--------|
| POST | `/initiate` | STUDENT |
| POST | `/webhook` | PayTabs IPs only |
| GET | `/` | STUDENT (own) or SUPERADMIN (all) |
| GET | `/:id/receipt` | Auth (own or SUPERADMIN) |

> [!WARNING]
> Payment and financial endpoints are **SUPERADMIN only** on the admin side. ASSISTANT role gets a 403 on any payment list or revenue endpoint.

### Notifications — `/api/notifications`
Standard — GET list (last 20), PATCH read, PATCH read-all. Auth required.

### Help Requests — `/api/help`
POST (student), GET (own or all for admin), PATCH reply (ASSISTANT+).

### Reports — `/api/reports`
| Method | Route | Access |
|--------|-------|--------|
| POST | `/generate` | ASSISTANT+ |
| GET | `/` | ASSISTANT+ or PARENT (linked students only) |
| GET | `/:id/pdf` | ASSISTANT+ or PARENT |

---

## Security Design

| Threat | Mitigation |
|--------|-----------|
| Zoom URL exposure | AES-256 encrypted in DB; decrypted only in signed-token endpoint after enrollment check; 5-min TTL |
| JWT theft | 15-min access tokens; httpOnly/Secure/SameSite=Strict refresh cookie |
| Brute force | 5 login attempts per 15 min per IP |
| File abuse | MIME + extension validation; 10MB max; sanitized filenames |
| PayTabs webhook spoofing | HMAC signature verification + PayTabs IP whitelist |
| Privilege escalation | `requireRole` middleware on every admin route; RBAC matrix enforced server-side |
| SQL injection | Prisma parameterized queries only |
| Watermark bypass | Student name + studentCode from JWT claims (server-verified), never from URL params |

---

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma
│   ├── seed.js
│   └── migrations/
├── src/
│   ├── index.js
│   ├── config/
│   │   ├── env.js            ← Zod-validated env
│   │   └── prisma.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── requireRole.js    ← accepts ...roles array
│   │   ├── requireEnrollment.js
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── users.routes.js
│   │   ├── sessions.routes.js
│   │   ├── courses.routes.js
│   │   ├── assignments.routes.js
│   │   ├── quizzes.routes.js
│   │   ├── payments.routes.js
│   │   ├── notifications.routes.js
│   │   ├── help.routes.js
│   │   └── reports.routes.js
│   ├── controllers/
│   └── services/
│       ├── paytabs.service.js
│       ├── storage.service.js
│       ├── zoom.service.js
│       ├── email.service.js      ← Resend, password-reset only
│       ├── notification.service.js
│       ├── quiz.service.js       ← Auto-grading logic
│       └── pdf.service.js
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
└── .env.example
```

---

## Deployment Setup

```yaml
# docker-compose.yml (VPS)
services:
  backend:
    build: ./backend
    ports: ["4000:4000"]
    env_file: ./backend/.env
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/letsencrypt
    depends_on: [backend]
    restart: unless-stopped
```

**SSL:** Certbot (`certbot --nginx`) once Cloudflare domain is pointed to the VPS.
**PayTabs webhook:** Register `https://api.yourdomain.com/api/payments/webhook` in PayTabs dashboard once domain is live.

---

## Environment Variables

```env
PORT=4000
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com

DATABASE_URL=postgresql://...         # Supabase connection string

JWT_ACCESS_SECRET=<32-byte random>
JWT_REFRESH_SECRET=<32-byte random>
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

ENCRYPTION_KEY=<32-byte hex>          # AES-256 for Zoom links

SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=...
SUPABASE_BUCKET_ASSIGNMENTS=assignments
SUPABASE_BUCKET_MATERIALS=materials
SUPABASE_BUCKET_QUIZ_MEDIA=quiz-media

PAYTABS_PROFILE_ID=...
PAYTABS_SERVER_KEY=...
PAYTABS_REGION=ARE
PAYTABS_RETURN_URL=https://yourdomain.com/payments/callback
PAYTABS_WEBHOOK_URL=https://api.yourdomain.com/api/payments/webhook

RESEND_API_KEY=...
EMAIL_FROM=noreply@yourdomain.com
```

---

## Execution Phases

### Phase 1 — Foundation (Week 1)
- [ ] Init `/backend`, install all dependencies
- [ ] Set up Supabase project (Postgres + 3 storage buckets)
- [ ] Write Prisma schema, run first migration
- [ ] `GET /health` endpoint (DB ping)
- [ ] Auth routes: login, logout, refresh, forgot/reset password (Resend)
- [ ] `requireRole` middleware
- [ ] Seed: 1 SUPERADMIN, 1 ASSISTANT, 2 STUDENTs, 1 PARENT, 3 sessions

### Phase 2 — Core Resources (Week 2)
- [ ] Users CRUD + RBAC rules
- [ ] Sessions CRUD + lifecycle advance
- [ ] Courses CRUD
- [ ] Enrollments (manual grant by admin)
- [ ] Zoom AES encryption + signed-token delivery

### Phase 3 — Quiz Engine (Week 2–3)
- [ ] Quiz CRUD (create, publish)
- [ ] Question CRUD (all 4 types, media upload to Supabase)
- [ ] Choice CRUD
- [ ] Attempt start + answer submit + finalize
- [ ] Auto-grading service (MC)
- [ ] Manual grading endpoint (text/media)

### Phase 4 — Payments & Assignments (Week 3)
- [ ] PayTabs initiate + webhook handler
- [ ] Payment history + receipt
- [ ] Assignment CRUD + PDF upload
- [ ] Submission upload + grade

### Phase 5 — Supporting Features (Week 4)
- [ ] Help requests + admin reply
- [ ] Notifications (fire from grading, session status change, quiz graded)
- [ ] Reports generate + PDF export
- [ ] Docker + Nginx setup on VPS
- [ ] SSL once domain is ready

### Phase 6 — Frontend Integration (Week 4–5)
- [ ] Replace all `MOCK_*` data with real API calls
- [ ] Next.js `middleware.js` auth guard + role redirect
- [ ] PayTabs redirect flow end-to-end
- [ ] Quiz builder UI in admin (teacher creates questions)
- [ ] Student quiz-taking UI
- [ ] Full 3-portal smoke test with seeded data

---

## Frontend Changes Needed (Post-Backend)

| Area | Change |
|------|--------|
| Auth | Login calls `/api/auth/login`; access token stored in memory; refresh cookie auto-sent |
| Route guard | Next.js `middleware.js` checks token → redirects to `/login` if invalid |
| Role redirect | After login, `{ role }` in response → `/`, `/admin`, or `/parent` |
| Sessions | Replace `MOCK_SESSIONS` with server `fetch('/api/sessions')` |
| Zoom link | Session detail calls `/api/sessions/:id/zoom-link` — never in page HTML |
| Payments | Buy button → `POST /api/payments/initiate` → `window.location.href = paymentUrl` |
| File uploads | Assignment submit → `FormData` → `POST /api/assignments/:id/submit` |
| Quizzes | New quiz-builder admin page + student quiz-taking page |
| Notifications | Topbar polls `/api/notifications` every 30s |
| RBAC in UI | Hide payment nav item from ASSISTANT role; hide destructive buttons |
