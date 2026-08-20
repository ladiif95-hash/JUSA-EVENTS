# Software Requirements Specification (SRS)

**System name:** JUSA Seminar & Event Registration System  
**Organization:** Jamhuriya University Students Association (JUSA), Jamhuriya University of Science & Technology (JUST), Mogadishu, Somalia  
**Document version:** 1.0  
**Date:** 20 August 2026  
**Status:** Based on the running website (`http://localhost:5174`) and the current source code in this repository  

---

## 1. Introduction

### 1.1 Purpose

This document specifies the software requirements of **JUSA Events**, a web system that lets JUST students discover seminars, create accounts, reserve seats, receive a QR ticket, and check in at the venue. Administrators manage seminars and attendance through a separate admin area.

The document covers:

- functional and non-functional requirements (SRS)
- frontend architecture and pages
- backend API architecture
- styling approach (Tailwind CSS + custom CSS)
- MongoDB data model

### 1.2 Scope

**In scope**

- Public marketing and discovery website (Home, Seminars, About JUSA)
- Student authentication (email/password, Google OAuth, password reset)
- Student profile (faculty, department, class, gender, phone)
- Seminar registration, waitlist, cancellation
- QR event ticket after a successful reservation
- Admin dashboard, seminar create/update, QR check-in, participant export, reports

**Out of scope (not fully implemented as live product features)**

- Live camera QR scanning (removed from the admin check-in UI; check-in uses a pasted QR token)
- Payment / ticketing fees
- Mobile native apps
- Multi-campus scheduling calendar
- Full organizer role UI (route exists as a placeholder)

### 1.3 Definitions

| Term | Meaning |
| --- | --- |
| Student | Authenticated user with role `STUDENT` |
| Admin / Staff | Users who may call `/api/admin/*` |
| Seminar | A published learning event with capacity and dates |
| Registration | Link between a student and a seminar (`REGISTERED`, `WAITLISTED`, or `CANCELLED`) |
| QR ticket | Digital pass generated after a successful seat reservation |
| Check-in | Marking attendance from the QR token at the door |

### 1.4 References

- Project README: `README.md`
- Frontend: `frontend/`
- Backend: `backend/`
- MongoDB Compose: `docker-compose.yml`
- Live UI observed: Home and seminar detail routes on port **5174**

### 1.5 Overview of the live website (observed)

On **Home** (`/`):

- Sticky header: JUSA EVENTS logo, Home, Seminars, About JUSA, My Events, Sign In, Create account
- Hero: “Discover. Learn. Connect.” with Explore seminars / My events
- Stats: 50+ events hosted, 3,000+ students connected
- Featured cards (for example Cybersecurity Awareness, Career Readiness, Entrepreneurship)
- Three-step journey: Find a seminar → Reserve your seat → Show your QR pass
- Footer: branding, Explore links, Contact (JUST, Mogadishu)

On **Seminar details** (`/seminars/:slug`):

- Page loads seminar data from the API (`Loading seminar…`) then shows hero, about text, facts, speaker, and a registration card with remaining seats.

---

## 2. Overall description

### 2.1 Product perspective

The product is a **two-application monorepo**:

```
Browser (Vite + React)  --JSON/JWT-->  Express API  --Mongoose-->  MongoDB 7
                                              |
                                              +--> SMTP (optional emails)
                                              +--> QRCode PNG (data URL)
                                              +--> XLSX export
```

| Layer | Technology | Default local URL |
| --- | --- | --- |
| Frontend | React 18, TypeScript, Vite, React Router | `http://localhost:5173` or `5174` |
| Backend | Express, TypeScript (`tsx watch`) | `http://localhost:5000` (`/api`) |
| Database | MongoDB 7 (Docker) or MongoDB Atlas | `127.0.0.1:27017` |
| Styling | Tailwind CSS v4 theme/utilities + custom CSS files | — |

### 2.2 User classes

| Actor | Needs |
| --- | --- |
| Guest | Browse seminars, open About, start Sign in / Create account |
| Student | Complete profile, reserve/cancel seats, view QR ticket, manage My Events |
| Admin | Create seminars, list seminars, check in by QR token, view dashboard metrics, export participants |
| Staff | Same admin API as Admin (`requireRole('ADMIN', 'STAFF')`) |

Frontend route protection currently treats **ADMIN** as allowed on `/admin`. Organizer dashboard is a placeholder at `/organizer/dashboard`. Backend user roles are `STUDENT`, `ADMIN`, `STAFF`.

### 2.3 Operating environment

- Desktop and mobile browsers (layout collapses under 760px)
- Node.js for API and Vite
- Docker Desktop for local MongoDB (`npm run db:up`)
- Optional SMTP for welcome, reset-password, and registration emails
- Optional Google OAuth (`GOOGLE_CLIENT_ID`, callback `/api/auth/google/callback`)

### 2.4 Constraints

- JWT in `localStorage` (`jusa_token`); API sends `Authorization: Bearer`
- Rate limit: 300 requests / 15 minutes
- Passwords hashed with bcrypt (cost 12), minimum 8 characters
- QR secret is stored hashed (`qrTokenHash`); the raw token is used to draw the QR image
- Registration requires a complete profile (name, phone, faculty, department, semester, gender)
- One registration document per student per seminar (unique index)

### 2.5 Assumptions

- Students have a valid email
- Venue check-in staff have an admin/staff account
- Cover images may be remote URLs
- If `MONGODB_URI` is missing, the API starts **without** a database (features that need MongoDB will fail)

---

## 3. System features and functional requirements

### 3.1 Public discovery

| ID | Requirement |
| --- | --- |
| FR-01 | The system shall display a branded home page with featured seminars and a clear path to browse and register. |
| FR-02 | The system shall list upcoming seminars with category, date, time, venue, and remaining seats. |
| FR-03 | Guests shall filter/search seminars by title and category. |
| FR-04 | A seminar detail page shall show description, speaker, date, time, venue, capacity, and a reservation card. |
| FR-05 | An About JUSA page shall describe the association. |

### 3.2 Authentication and profile

| ID | Requirement |
| --- | --- |
| FR-10 | A guest shall register with full name, email, phone, and password. |
| FR-11 | A user shall log in with email and password and receive a JWT. |
| FR-12 | Google sign-in shall be available when OAuth environment variables are set. |
| FR-13 | A user shall request a password-reset email and set a new password with a time-limited token (1 hour). |
| FR-14 | `/api/auth/me` shall return the current user when the JWT is valid. |
| FR-15 | A student shall complete/update faculty, department, semester, gender, and phone before registering for a seminar. |

### 3.3 Registration and ticket

| ID | Requirement |
| --- | --- |
| FR-20 | An authenticated student with a complete profile shall reserve a seat while capacity remains. |
| FR-21 | If the seminar is full and waitlist is enabled, the student shall be waitlisted. |
| FR-22 | The system shall prevent duplicate active registrations for the same seminar. |
| FR-23 | Registration shall respect open/close windows (`registrationOpenAt`, `registrationCloseAt`). |
| FR-24 | After a successful reservation, the student shall see a **digital ticket** (title, DATE, TIME, VENUE, ATTENDEE, QR code, “Going” status). |
| FR-25 | The QR image shall encode the registration token so door staff can verify it. |
| FR-26 | A student shall cancel while the cancellation window is open; a waitlisted student may be promoted. |
| FR-27 | My Events shall list the student’s registrations (upcoming / past / cancelled — UI tabs exist). |

### 3.4 Administration

| ID | Requirement |
| --- | --- |
| FR-30 | Admin shall open a dashboard with seminar, registration, attendance, and waitlist counts. |
| FR-31 | Admin shall **create** a seminar (title, descriptions, category, speaker, venue, capacity, start/end, cover URL, draft/published). |
| FR-32 | Admin shall list all seminars and update a seminar (`PATCH /admin/seminars/:id`). |
| FR-33 | Admin shall check in by QR token and see student identity (name, email, phone, faculty, department, class, gender) and seminar. |
| FR-34 | Repeat scan of an already checked-in ticket shall report “already checked in” without hiding student data. |
| FR-35 | Invalid QR shall show a professional failure banner (not a bare red line). |
| FR-36 | Admin shall list participants and export them to Excel. |
| FR-37 | Admin shall view attendance reports (registered, attended, absent, rate). |

### 3.5 Notifications

| ID | Requirement |
| --- | --- |
| FR-40 | Welcome, password-reset, registration, and waitlist emails shall be attempted via SMTP. |
| FR-41 | Each attempt shall be stored in the `notifications` collection (`PENDING` / `SENT` / `FAILED`). |

---

## 4. Non-functional requirements

| ID | Category | Requirement |
| --- | --- | --- |
| NFR-01 | Usability | Public pages shall use JUSA green (`#087346` / `#0a8f55`), serif headings (Playfair Display), and sans body (DM Sans). |
| NFR-02 | Responsiveness | Layouts shall collapse to a single column below 760px, including the seminar detail grid and auth split screen. |
| NFR-03 | Security | Passwords never stored in plain text; QR tokens hashed; admin routes require JWT + role. |
| NFR-04 | Performance | Seminar list and details shall load asynchronously; the UI shall show a loading state. |
| NFR-05 | Availability | Local MongoDB data shall persist in a Docker volume `jusa_mongodb_data`. |
| NFR-06 | Maintainability | Frontend and backend are separate workspaces (`@jusa/frontend`, `@jusa/backend`). |
| NFR-07 | Privacy | Do not commit `.env` / `.env.local`. |
| NFR-08 | Integrity | Seat counts shall be computed from `REGISTERED` documents, not a free-hand counter. |

---

## 5. Frontend specification

### 5.1 Stack

- **React** + **TypeScript**
- **Vite** dev server
- **React Router** for pages
- **lucide-react** icons
- **AuthContext** + `localStorage` token
- API helper: `frontend/src/services/api.ts` → `VITE_API_URL` or `http://localhost:5000/api`

### 5.2 Tailwind CSS

Tailwind **v4** is installed and imported in `frontend/src/styles/index.css`:

```css
@import "tailwindcss/theme.css";
@import "tailwindcss/utilities.css";
```

Most screens are styled with **named CSS classes** (not long utility strings) in:

| File | Role |
| --- | --- |
| `styles/index.css` | Global layout, navbar, hero, cards, seminar detail, footer, auth split |
| `styles/pages.css` | Forms, modals, QR page helpers |
| `styles/admin.css` | Admin shell, tables, check-in result bars |
| `styles/login.css` | Extra login tweaks |
| `styles/ticket.css` | Digital ticket (header, DATE/TIME/VENUE/ATTENDEE grid, perforation, QR frame) |

Brand tokens used across CSS:

- Primary green: `#0a8f55`, hover `#087346`
- Navy/footer: `#102821`
- Accent blue: `#1266a8`
- Page background: `#f7f9fa`
- Danger: `#d92d20`

### 5.3 Public routes

| Path | Page | Notes |
| --- | --- | --- |
| `/` | Home | Featured seminars from local `data/seminars.ts` |
| `/seminars` | Seminars catalogue | Search + category chips; local catalogue data |
| `/seminars/:slug` | Seminar details | Loads API first, falls back to local catalogue |
| `/about` | About JUSA | Static content |
| `/login` `/register` | Auth | Email/password; Google button |
| `/forgot-password` `/reset-password` | Recovery | Token in query string |
| `/oauth/callback` | OAuth | Stores JWT from query |
| `/complete-profile` | Profile completion | Required fields for registration |
| `/my-events` | My Events | Student registrations |
| `/qr-pass/:registrationId` | Ticket | Full-page EventTicket |
| `/profile` | Profile edit | |
| `/signup` | Redirect | Goes to `/register` |

### 5.4 Admin routes (JWT, admin role)

| Path | Page |
| --- | --- |
| `/admin` | Redirect to dashboard |
| `/admin/dashboard` | Metrics cards |
| `/admin/seminars` | Table + Create seminar |
| `/admin/seminars/new` | Create seminar form (CRUD Create) |
| `/admin/check-in` | Paste QR token; show student card + status bars |

Layouts: `PublicLayout` (navbar + footer), `AdminLayout` (dark sidebar: Dashboard, Seminars, Scan attendance).

### 5.5 Key UI components

- `Navbar`, `Footer`, `SeminarCard`, `Modal`, `ProtectedRoute`
- `EventTicket` — ticket matching the “Going” pass (JUSA branding, perforated divider, corner-framed QR)
- After **Confirm reservation**, a modal overlay shows the ticket; **View ticket** reopens it

### 5.6 Frontend data note

Home and the seminars grid currently read **`frontend/src/data/seminars.ts`** so the marketing site works even if MongoDB is empty. Seminar details, registration, tickets, and admin create/list talk to the **API**. Aligning the catalogue fully to MongoDB is a recommended enhancement.

---

## 6. Backend specification

### 6.1 Stack

- **Express** app in `backend/src/app.ts`
- **TypeScript** run with `tsx watch`
- **Mongoose** ODM
- **JWT** (`jsonwebtoken`)
- **bcryptjs**, **nodemailer**, **qrcode**, **xlsx**, **zod** (available), **cors**, **cookie-parser**, **express-rate-limit**
- Port: `process.env.PORT` or **5000**
- Mount: all routes under **`/api`**

### 6.2 Middleware

- CORS enabled
- JSON body parser
- Cookie parser (OAuth state cookie `jusa_oauth_state`)
- Rate limiter
- `requireAuth` — Bearer JWT
- `requireRole('ADMIN', 'STAFF')` on admin router
- Central `errorHandler`

### 6.3 REST API map

**Health**

- `GET /api/health` → `{ status: "ok" }`

**Auth** (`/api/auth`)

- `POST /register` — create student
- `POST /login`
- `GET /google` — redirect to Google
- `GET /google/callback` — redirect to frontend with token
- `POST /forgot-password`
- `POST /reset-password`
- `GET /me` — current user (auth)

**Profile** (`/api/profile`)

- `GET /` — get profile (auth)
- `PATCH /` — update profile (auth)

**Seminars** (`/api/seminars`)

- `GET /` — list (query: `status`, `category`, `search`, `featured`, `sort`)
- `GET /:slug` — details + `myRegistration` if logged in
- `POST /:id/register` — reserve / waitlist (auth)
- `POST /:id/cancel` — cancel (auth)
- `POST /:id/waitlist` — same handler as register

**Student tickets**

- `GET /api/my-events` (auth)
- `GET /api/registrations/:id/qr` (auth, owner only) — PNG data URL + registration populate

**Admin** (`/api/admin`, auth + ADMIN/STAFF)

- `GET /dashboard`
- `GET /seminars` — all seminars with seat counts
- `POST /seminars` — create (defaults close dates to start if omitted; status PUBLISHED unless DRAFT)
- `PATCH /seminars/:id`
- `GET /seminars/:id/participants`
- `GET /seminars/:id/export` — `.xlsx`
- `POST /check-in/qr` and `POST /check-in/manual`
- `GET /reports/:seminarId`
- `GET /users`

Check-in looks up `qrTokenHash` (optional `seminarId`). It does **not** require a camera.

### 6.4 Registration business rules

Implemented in `backend/src/services/registration.service.ts`:

1. Seminar must be `PUBLISHED`
2. Now must be within registration window
3. Existing non-cancelled registration → error
4. If seats remain → `REGISTERED` + QR token + Attendance `NOT_CHECKED_IN`
5. If full and waitlist on → `WAITLISTED` (no QR)
6. Reference code: `JUSA-` + last 8 characters of the Mongo id
7. Cancel: clear QR; promote oldest waitlisted student if a seat frees
8. Transactions used when MongoDB supports them; otherwise same work without a session

### 6.5 Environment variables

From `backend/.env.example`:

- `PORT`, `APP_URL`, `NODE_ENV`
- `MONGODB_URI`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- `MAIL_FROM_*`, `SMTP_*`
- Seed account emails (local only; do not use in production)

Frontend: `VITE_API_URL`, `VITE_USE_MOCK_AUTH`

---

## 7. MongoDB specification

### 7.1 Deployment

`docker-compose.yml`:

- Image: `mongo:7`
- Container: `jusa-mongodb`
- Bind: `127.0.0.1:27017`
- Volume: `jusa_mongodb_data`

Connection: `mongoose.connect(process.env.MONGODB_URI)` in `backend/src/config/database.ts`.

### 7.2 Collections (Mongoose models)

#### users

| Field | Type | Notes |
| --- | --- | --- |
| fullName, email | string | email unique, lowercase |
| phone | string | |
| passwordHash | string | optional for Google users |
| googleId | string | unique sparse |
| authProvider | `LOCAL` \| `GOOGLE` | |
| resetTokenHash, resetTokenExpiresAt | | password reset |
| faculty, department, semester | string | |
| gender | `MALE` \| `FEMALE` \| `OTHER` | |
| profilePhoto | string | |
| role | `STUDENT` \| `ADMIN` \| `STAFF` | default STUDENT |
| status | `ACTIVE` \| `SUSPENDED` | |
| timestamps | createdAt, updatedAt | |

#### seminars

| Field | Type | Notes |
| --- | --- | --- |
| title, slug | string | slug unique |
| shortDescription, description | string | required |
| coverImage | string | URL |
| category | string | required |
| speaker, speakerPosition, organizer | string | organizer default `JUSA` |
| venue | string | required |
| startDateTime, endDateTime | Date | required |
| capacity | number | min 1 |
| registrationOpenAt, registrationCloseAt, cancellationCloseAt | Date | |
| waitlistEnabled, reminderEnabled, featured | boolean | |
| status | `DRAFT` \| `PUBLISHED` \| `COMPLETED` \| `CANCELLED` \| `ARCHIVED` | |
| createdBy | ObjectId → User | |
| index | `{ status, startDateTime }` | |

Seat counts are **not** stored on the seminar; they are aggregated from registrations (`registered`, `waitlisted`, `cancelled`, `remainingSeats`).

#### registrations

| Field | Type | Notes |
| --- | --- | --- |
| seminarId, userId | ObjectId | unique together |
| status | `REGISTERED` \| `WAITLISTED` \| `CANCELLED` | |
| reference | string | unique sparse, e.g. `JUSA-XXXXXXXX` |
| qrToken, qrTokenHash | string | hash used at check-in |
| registeredAt, cancelledAt, promotedFromWaitlistAt | Date | |

#### attendances

| Field | Type | Notes |
| --- | --- | --- |
| seminarId, userId, registrationId | ObjectId | registrationId unique |
| status | `NOT_CHECKED_IN` \| `CHECKED_IN` | |
| checkedInAt | Date | |
| checkInMethod | `QR` \| `MANUAL` | |
| checkedInBy | ObjectId → User | staff who scanned |

#### notifications

Email log: userId, seminarId, type, channel (`EMAIL`), recipient, subject, status (`PENDING`/`SENT`/`FAILED`), sentAt, failedAt, errorMessage.

#### auditlogs

Admin actions: adminId, action (`CREATE`, `UPDATE`, `CHECK_IN`, …), entityType, entityId, metadata, timestamp.

#### faculties

Optional lookup: faculty `name` + `departments[].name`.

### 7.3 Entity relationship (logical)

```
User 1 ──── * Registration * ──── 1 Seminar
                │
                1
                │
            Attendance
```

---

## 8. Main user flows

### 8.1 Student reserves a seat

1. Open Home → Explore seminars / seminar card  
2. Sign in or create account  
3. Complete profile if incomplete  
4. Confirm registration modal (name, email, faculty, department, class, gender)  
5. API `POST /seminars/:id/register`  
6. Ticket modal appears (DATE, TIME, VENUE, ATTENDEE, QR)  
7. Ticket also available at `/qr-pass/:registrationId`

### 8.2 Door check-in

1. Admin opens `/admin/check-in`  
2. Pastes QR token from the ticket  
3. API hashes token and finds `REGISTERED` registration  
4. Success bar + student card, or professional fail bar  

### 8.3 Admin creates a seminar

1. `/admin/seminars` → Create seminar  
2. `POST /api/admin/seminars`  
3. Published seminars appear to students when status is `PUBLISHED` and start is in the future (list filter)

---

## 9. How to run (from README)

```bash
npm install
npm run db:up          # Docker MongoDB
npm run dev:backend    # API :5000
npm run dev:frontend   # UI :5173 / :5174
```

Copy `backend/.env.local.example` → `backend/.env.local` (or Atlas URI in `.env`). Never commit secrets.

---

## 10. Known gaps (honest, from code + live site)

1. Home / Seminars catalogue still uses **static** `seminars.ts` while details/register use **MongoDB**.  
2. My Events page is partly static in the current UI and should be wired fully to `GET /my-events`.  
3. Organizer dashboard is a placeholder.  
4. Tailwind is loaded, but most visuals are **custom CSS**, not utility-class pages.  
5. Camera scanning is **not** part of the product (by request); check-in is token-based.  
6. Seminar details shows “Loading seminar…” until the API responds.  
7. Emails fail silently to `FAILED` in MongoDB if SMTP is not configured.

---

## 11. Traceability (UI → API → MongoDB)

| Screen | API | Collection |
| --- | --- | --- |
| Home / Seminars cards | (local data today) | seminars (intended) |
| Seminar details | `GET /seminars/:slug` | seminars, registrations |
| Reserve seat | `POST /seminars/:id/register` | registrations, attendances, notifications |
| Ticket | `GET /registrations/:id/qr` | registrations (qrToken) |
| Sign in | `POST /auth/login` | users |
| Create account | `POST /auth/register` | users, notifications |
| Admin create | `POST /admin/seminars` | seminars, auditlogs |
| Check-in | `POST /admin/check-in/qr` | attendances, auditlogs |

---

## 12. Document approval

| Role | Name | Date |
| --- | --- | --- |
| Author | Generated from repository + live site review | 20 August 2026 |
| Product owner (JUSA) | | |
| Supervisor | | |

This SRS describes the **implemented** JUSA Events system as of the date above, not a future wishlist except where section 10 lists gaps.
