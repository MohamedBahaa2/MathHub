# MathHub Backend

Standalone Node.js/TypeScript backend for MathHub. It provides PostgreSQL persistence, JWT authentication, role and enrollment authorization, REST APIs, Socket.IO realtime events, Zoom Server-to-Server OAuth, Meeting SDK signatures, verified Zoom webhooks, and authorized recording proxy streaming.

Nothing in `../frontend` is required to install or run this service.

## Requirements

- Node.js 20 or newer
- PostgreSQL 14 or newer (PostgreSQL 17 is supplied by `docker-compose.yml`)
- A Zoom account with a Server-to-Server OAuth app, Meeting SDK app, and webhook event subscription

## Install and run

```bash
cd backend
npm install
cp .env.example .env
docker compose up -d postgres
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

The default API URL is `http://localhost:4000`. Liveness is at `/health/live`; readiness (including a database query) is at `/health/ready`.

Production:

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm start
```

Use a managed PostgreSQL database, HTTPS reverse proxy, strong random JWT secrets, and `NODE_ENV=production`. Set `TRUST_PROXY=true` only behind a trusted single-hop reverse proxy.

## Environment variables

Copy `.env.example` to `.env`. `.env` is git-ignored.

Core:

- `DATABASE_URL`: PostgreSQL connection URL.
- `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`: distinct random values of at least 32 characters.
- `ACCESS_TOKEN_TTL`: access JWT lifetime, default `15m`.
- `REFRESH_TOKEN_TTL_DAYS`: rotating refresh-token lifetime.
- `CORS_ORIGINS`: comma-separated exact frontend origins.
- `COOKIE_DOMAIN`: optional production cookie domain.
- `TRUST_PROXY`: `true` only when deployed behind a trusted proxy.

Zoom:

- `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`: Server-to-Server OAuth credentials.
- `ZOOM_MEETING_SDK_KEY` and `ZOOM_MEETING_SDK_SECRET`: Meeting SDK credentials. The aliases `ZOOM_SDK_KEY` and `ZOOM_SDK_SECRET` are also accepted.
- `ZOOM_WEBHOOK_SECRET_TOKEN`: validates current Zoom webhook signatures and URL validation challenges.
- `ZOOM_WEBHOOK_VERIFICATION_TOKEN`: optional legacy webhook-token fallback.
- `ZOOM_DEFAULT_HOST_EMAIL`: licensed Zoom host used when no host email is supplied.

The API fails closed when a required Zoom feature is requested without its corresponding credentials.

## Database

The Prisma schema is in `prisma/schema.prisma` and includes:

- users and rotating refresh tokens
- courses, lessons, and enrollments
- live sessions and attendance
- recordings with private provider URLs
- notifications and per-user read receipts
- payment placeholders
- audit logs

Useful commands:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:deploy
npm run prisma:studio
```

The seed command creates one admin. Override `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`; never use the development default in a shared environment.

## Authentication contract

Access tokens are returned in JSON and sent as `Authorization: Bearer <token>`. Refresh tokens are rotated on every refresh and are returned both in JSON and as an HTTP-only, SameSite=Strict cookie so native/mobile and browser clients are supported.

Public auth routes:

- `POST /api/auth/register` — student registration (`firstName`, `lastName`, `email`, `password`)
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Admin and instructor accounts are intentionally not self-registerable. Create them through an operational/admin process or seed script.

## API summary

Courses and enrollment:

- `GET /api/courses`
- `GET /api/courses/:id`
- `POST /api/courses`
- `PATCH /api/courses/:id`
- `DELETE /api/courses/:id`
- `POST /api/courses/:id/enroll`
- `GET /api/my/courses`
- `GET /api/courses/:id/students`

Live sessions:

- `POST /api/courses/:courseId/live-sessions`
- `GET /api/courses/:courseId/live-sessions`
- `GET /api/live-sessions/:id`
- `PATCH /api/live-sessions/:id`
- `POST /api/live-sessions/:id/start`
- `POST /api/live-sessions/:id/end`

Zoom:

- `POST /api/zoom/sdk-signature`
- `POST /api/zoom/create-meeting`
- `GET /api/zoom/recordings/:meetingId`
- `POST /api/webhooks/zoom`

Recordings:

- `GET /api/courses/:courseId/recordings`
- `GET /api/recordings/:recordingId`
- `GET /api/recordings/:recordingId/play`
- `PATCH /api/recordings/:recordingId/visibility`

Notifications and administration:

- `GET /api/notifications`
- `POST /api/notifications`
- `PATCH /api/notifications/:id/read`
- `GET /api/admin/users`
- `GET /api/admin/audit-logs`
- `GET /api/admin/live-sessions`
- `GET /api/admin/recordings`

Admin list routes accept `page` and `limit`.

## Zoom setup

1. In the Zoom Marketplace, create a Server-to-Server OAuth app.
2. Add the scopes needed to create/manage meetings and read cloud recordings. Typical scopes include meeting write/read and recording read scopes; Zoom’s exact scope names depend on whether the app uses classic or granular scopes.
3. Activate the app and copy Account ID, Client ID, and Client Secret to the matching environment variables.
4. Create a Meeting SDK app and copy its SDK key and secret.
5. Configure the frontend’s embedded Meeting SDK client to call `POST /api/zoom/sdk-signature`; never put the SDK secret in frontend code.
6. Add a webhook endpoint: `https://your-api.example.com/api/webhooks/zoom`.
7. Subscribe to `meeting.started`, `meeting.ended`, `recording.completed`, `meeting.participant_joined`, and `meeting.participant_left`.
8. Copy the webhook secret token into `ZOOM_WEBHOOK_SECRET_TOKEN`.
9. Make sure the configured host is licensed and cloud recording is enabled.

Zoom meeting start URLs are stored only for server-side/operational use and are never returned by this API. Student join data is issued only after access checks. Student signatures always use role `0`; role `1` requires course-manager authorization.

## Recording proxy and limitation

`GET /api/recordings/:recordingId/play`:

- verifies the access JWT
- verifies enrollment, ownership, and recording visibility
- obtains a backend Zoom OAuth token
- proxies the provider stream, including HTTP `Range` requests
- follows only a small number of redirects and only to Zoom-owned hosts
- sets private/no-store headers
- writes an audit event before streaming

The original Zoom playback/download URL is never returned in list, detail, admin, webhook, or playback responses.

This is access control and link-hiding, not browser DRM. A user authorized to render video can still capture pixels or network-delivered media with advanced tooling. The intended protection is to prevent casual link sharing, keep provider credentials and raw URLs server-side, support the frontend watermark overlay, and retain an audit trail. For stronger DRM, change `playbackUrlStorageMode` and proxy a DRM-capable video provider.

## Socket.IO contract

Connect to the backend origin with an access token:

```js
io(API_URL, { auth: { token: accessToken } });
```

Every authenticated connection automatically joins `user:{userId}`. Admins also join `admin`.

To join a course room:

```js
socket.emit("course:join", courseId, (result) => console.log(result));
```

Students must have an active, unexpired enrollment. Instructors must own the course. Server-emitted events include:

- `session:created`
- `session:status`
- `session:started`
- `session:ended`
- `recording:available`
- `notification:new`
- `announcement:new`

## Frontend integration notes

- Keep the access token in memory when practical; use the refresh endpoint to restore a session.
- Browser requests that rely on the refresh cookie must use credentials (`fetch(..., { credentials: "include" })`).
- Render live meetings inside the site using Zoom’s Meeting SDK and the short-lived response from `/api/zoom/sdk-signature`.
- Use `secureBackendPlaybackEndpoint` as the video source and include the JWT. Since native `<video>` cannot set an Authorization header by itself, use an authenticated media loader/service worker or request a same-site playback session in a future frontend integration phase. This backend intentionally does not place access tokens in query strings.
- Continue using the frontend’s visual watermark overlay. The backend does not claim browser-level DRM.
- Listen for Socket.IO events and refetch the relevant REST resource after an event.

## Security controls

- Helmet, exact-origin CORS, compression, body-size limits, and disabled technology header
- strict Zod validation and centralized error responses
- bcrypt password hashing with cost 12
- short-lived access JWTs and rotating, hashed, revocable refresh tokens
- role, ownership, enrollment, expiry, and recording-visibility checks
- rate limits on auth and Meeting SDK signature routes
- HMAC-verified Zoom webhooks
- redacted structured logging
- audit logs for authentication, management, signatures, webhooks, and playback
- provider URLs, OAuth tokens, SDK secrets, host start URLs, and password hashes excluded from public responses
