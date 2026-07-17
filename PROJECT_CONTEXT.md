# PROJECT_CONTEXT.md — LotusCRM

> Single source of truth for this project. Keep this file current as modules complete.

---

## 1. Overview
**LotusCRM** — a CRM for **Hyundai dealership teams** ("Lotus D-CRM · Hyundai Dealership Suite").
Manages the full enquiry lifecycle: lead capture (walk-in, Meta Ads, WhatsApp, Instagram,
Google Sheets, Voice AI) → smart round-robin routing to Customer Reps (CRs) → follow-ups,
test drives, quotation/exchange/finance/delivery pipeline → conversion reporting. Includes
an AI voice/chat agent layer and a social inbox.

Monorepo layout:
```
LotusCRM/
  frontend/   # React 19 + Vite SPA (the UI dealership staff use)
  backend/    # Node/Express + Prisma + PostgreSQL API (+ a separate voice worker)
```

---

## 2. Tech Stack

### Frontend (`frontend/`)
- **React 19**, **TypeScript ~6.0** (strict, `.tsx`/`.ts` only — no JS), ESM.
- **Vite 8** (`@vitejs/plugin-react`), dev server port **5173**, path alias **`@` → `./src`**.
- **Tailwind CSS v4** via `@tailwindcss/vite` — **no `tailwind.config.js`**, theme lives in
  `src/index.css` under `@theme {}`. Dark mode is class-based (`@custom-variant dark`).
- **framer-motion** (animations), **lucide-react** (icons), **react-hook-form** + **zod** +
  `@hookform/resolvers` (forms/validation), **@tanstack/react-query** (server state),
  **react-router-dom v7** (routing), **axios** (HTTP).
- Class helpers: `clsx`, `tailwind-merge` + `cn()` (`src/lib/utils.ts`), `class-variance-authority`.
- Lint: **oxlint** (`npm run lint`). Build: `tsc -b && vite build`.

### Backend (`backend/`)
- **Node + Express 4** (CommonJS, TypeScript), run with **tsx** in dev, `tsc` build → `dist/`.
- **PostgreSQL** via **Prisma 6** (`@prisma/client`, schema at `backend/prisma/schema.prisma`).
- **Auth:** **jsonwebtoken** (JWT, default `8h` expiry) + **bcryptjs** password hashing.
- **Validation:** **zod** on every route (per-module `*.schema.ts` + `middleware/validate.ts`).
- **File uploads:** **multer**; media stored on **Cloudinary**.
- **Integrations/AI:** `@google/genai` (Gemini — runtime agents), `openai` (prompt drafting),
  `livekit-server-sdk` + `@livekit/rtc-node` (voice), `googleapis` (Sheets), `axios` (Meta/
  WhatsApp/Callmatic HTTP), `exceljs` / `csv-parse` (imports/exports).
- **Env:** validated at boot via zod in `src/config/env.ts` (fails fast on missing/invalid).
  Key vars: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT` (default **4000**),
  `CORS_ORIGIN` (comma-separated allowlist), `MASTER_ENCRYPTION_KEY` (32-byte, for credential
  encryption), plus optional `GEMINI_API_KEY` / `OPENAI_API_KEY` / `FACEBOOK_APP_*` /
  `META_WEBHOOK_VERIFY_TOKEN` / `BACKEND_PUBLIC_URL`.
- **Scripts:** `npm run dev` (API), `npm run voice-worker` (voice dialer), `prisma:migrate`,
  `prisma:deploy`, `seed`.

---

## 3. Frontend Folder Structure
```
frontend/src/
  main.tsx, App.tsx, index.css        # entry + global styles/tokens
  api/                                 # axiosClient + <domain>.api.ts per feature
  components/
    common/    # Button, Card, Modal, Input, Toggle, Avatar, StatusBadge,
               # CountUp, Sparkline, DateTimePicker
    layout/    # AppShell, Sidebar, Topbar, BottomNav, navConfig.tsx
    reports/   # StatTile, TrendChart, FunnelChart, HBarList, vizTheme.ts
    integrations/ # IntegrationCard + per-provider forms
    ui/        # shadcn-style primitives (skeleton.tsx)
    departments/, enquiry/, leads/, social-inbox/
  pages/       # one component per route (LandingPage, LoginPage, DashboardPage, ...)
  routes/      # router.tsx, ProtectedRoute.tsx
  context/     # AuthContext.tsx (useAuth)
  hooks/, schemas/ (zod), lib/ (utils.ts, motion.ts), types/
```

---

## 3b. Backend Folder Structure
```
backend/
  prisma/
    schema.prisma       # single source of truth for the DB (see §9 Domain Model)
    migrations/, seed.ts, seed-demo.ts
  src/
    server.ts           # boot: validate env, listen on PORT
    app.ts              # express app: CORS, JSON (raw body kept for webhook HMAC),
                        #   /health, mounts every module under /api/*
    config/             # env.ts (zod-validated), constants.ts
    lib/                # prisma.ts, crypto.ts (AES-256-GCM), errors.ts, logger.ts,
                        #   asyncHandler.ts, systemUser.ts
    middleware/         # auth.ts (JWT), rbac.ts (role gate), branchScope.ts
                        #   (per-branch data isolation), validate.ts (zod), errorHandler.ts
    modules/<name>/     # one folder per feature, consistent 4-file pattern:
                        #   <name>.routes.ts → .controller.ts → .service.ts → .schema.ts
    voice-worker/       # separate long-running process (index.ts, dialer.ts, session.ts)
                        #   for the Voice AI outbound-call pipeline — NOT part of the HTTP app
    types/express.d.ts  # req augmentation (req.user, req.rawBody)
```

**Modules** (mounted in `app.ts`): `auth`, `users`, `branches`, `roles`, `leads`,
`enquiries` (+ pipeline sub-services: `routing`, `quotation`, `exchange`, `finance`,
`testDrive`, `delivery`, `comments`), `reports` (+ `analytics.service`), `integrations`
(+ Meta OAuth, Google Sheets, Callmatic), `webhooks` (Meta Lead Ads, WhatsApp, Instagram,
Callmatic — signature-verified), `social-inbox`, `media`, `templates`, `agent-configs`,
`campaigns`, `voice`, `vehicles`, `notifications`, `quotes` (public), `settings`.

**Request pipeline:** `routes` → `validate(zodSchema)` → `auth` (JWT) → `rbac(roles)` →
`branchScope` → `controller` (thin, uses `asyncHandler`) → `service` (all business logic +
Prisma) → `errorHandler` (maps typed errors in `lib/errors.ts` to HTTP responses).

---

## 4. Routing & Auth
- `routes/router.tsx` uses `createBrowserRouter`.
  - Public: `/` → `LandingPage`, `/login` → `LoginPage`.
  - Protected: wrapped in `ProtectedRoute` → `AppShell` (Sidebar + Topbar + BottomNav +
    `<Outlet>`), with **role-gated** nested routes (`/dashboard`, `/leads`, `/reports`,
    `/integrations`, ...).
- **Auth flow:** `context/AuthContext.tsx` exposes `useAuth() → { user, isLoading, login, logout }`.
  `login(email, password)` calls `POST /api/auth/login`, stores the returned **JWT in
  `localStorage`** (`TOKEN_STORAGE_KEY` from `api/axiosClient`), and the axios client attaches
  it as a `Bearer` token on every request. On mount, a saved token is validated via
  `fetchCurrentUser()` (`/api/auth/me`); a rejection clears it. `LoginPage` redirects
  authenticated users to `/dashboard` via `<Navigate replace />`.
- Login validation: `schemas/auth.schema.ts` — `loginFormSchema` (email + required password).
- **Backend auth/RBAC:** `middleware/auth.ts` verifies the JWT (8h expiry) and loads `req.user`;
  `middleware/rbac.ts` gates routes by `Role`; `middleware/branchScope.ts` restricts non-admin
  users to their own branch's data. Custom per-branch roles (`RoleDefinition`) layer sidebar/
  module permissions on top of a base `Role`.

---

## 5. UI Design System
- **Font:** Plus Jakarta Sans (`--font-sans`), antialiased.
- **Palette:** **blue-600 accent** on **slate** neutrals. Body bg light `#f8fafc` / dark `#0b0f19`.
  Tokens + `--shadow-premium*` defined in `src/index.css @theme`.
- **Surfaces:** frosted glass via the `.glass-panel` class **or** `bg-white/80 backdrop-blur-xl`.
  Cards `rounded-2xl`/`rounded-3xl`; inputs/buttons `rounded-lg`/`rounded-xl`.
- **Depth/motion:** layered premium shadows, `hover:-translate-y-1` lift, blurred radial blue
  "glow" accents; shared framer-motion variants in `lib/motion.ts` (`fadeUp`,
  `staggerContainer`, `pageFade`, `EASE`). Login backdrop uses `animate-blob-a/b` keyframes.
- **Icons:** lucide-react, usually in tinted `rounded-xl` gradient badges
  (`bg-gradient-to-br from-blue-500/20 to-blue-500/5`).
- **Dark mode:** every component ships `dark:` variants — always maintain parity.
- **Forms:** react-hook-form + zod, `focus:ring` blue, red error states with
  `aria-invalid` / `aria-describedby` / `role="alert"`.

### Reusable components (prefer reuse/extension over new)
- `Button` — variants `primary|secondary|danger|ghost`, sizes `sm|md|lg`, `isLoading`, `icon`.
- `Input`/`Select`/`Textarea` + `FieldWrapper` — `forwardRef`, `label`+`error`.
- `Card`/`CardHeader`, `Modal` (portal + fadeIn/slideUp), `Toggle`, `Avatar`, `StatusBadge`,
  `StatTile`, `CountUp`, `Sparkline`, `Skeleton`.

---

## 6. Coding Standards
- TypeScript, type-safe, no `any` unless justified. Function components + hooks.
- Follow existing folder placement and naming; reuse `common/` components and `lib/` helpers.
- Merge classes with `clsx`/`cn`. Keep light + dark styling in lockstep.
- Production-ready: loading, empty, and error states; responsive; accessible (aria, focus rings).
- Prefer extension over duplication; avoid breaking existing routes/APIs/schema.

---

## 7. Current Progress
**Frontend:** Landing page, Login page (bold glass redesign), Dashboard (stat tiles, charts,
quick actions), Leads (+ Add Lead wizard, lead detail), Reports (funnel, CR performance),
Integrations, layout shell (Sidebar/Topbar/BottomNav), auth context + protected/role-gated
routing, shared component library + design tokens.

**Backend:** Full Prisma/Postgres schema (see §9) with migrations + demo seed. ~20 API modules
live: auth/RBAC/branch-scoping, users/branches/roles, leads (dedup + import), enquiries with the
full pipeline (routing, quotation, exchange, finance, test-drive, delivery, comments), reports/
analytics, integrations (Meta OAuth, Google Sheets, Callmatic), webhooks (Meta/WhatsApp/
Instagram/Callmatic), social inbox, media (Cloudinary), templates, campaigns, agent-configs,
voice + a standalone voice worker, vehicles, notifications, settings.

**Performance:** routes are code-split via `React.lazy` (per-page chunks) with vendor
`manualChunks` in `vite.config.ts`, so the initial bundle is small (the old >500 kB chunk
warning is resolved). React Query defaults: `staleTime` 60s, `gcTime` 5m,
`refetchOnWindowFocus` off. Backend responses are gzipped (`compression` middleware in
`app.ts`). DB has perf indexes on `Enquiry(leadId, createdAt)`, `Enquiry.source`,
`Enquiry.enquiryCategory`, plus `pg_trgm` GIN indexes on `Lead.name` / `Lead.phoneNormalized`
for substring search (migration `20260717000000_add_perf_indexes`).

---

## 8. Coding Conventions (backend)
- Business logic lives in `*.service.ts` (controllers stay thin). Services take a Prisma
  `tx` where they participate in transactions (see `routing.service.ts`).
- Validate all input with zod schemas via `middleware/validate`; never trust `req.body`.
- Throw typed errors from `lib/errors.ts`; let `errorHandler` translate them — don't
  `res.status().json()` errors ad hoc in services.
- Third-party credentials are AES-256-GCM encrypted at rest (`lib/crypto.ts`) and only
  decrypted server-side when calling the provider — never returned in API responses.
- Prisma `Enquiry.carModel`/`variant` are plain-string snapshots, deliberately NOT FK'd to the
  `VehicleModel` catalog, so editing/deleting catalog entries can't mutate historical enquiries.

---

## 9. Domain Model (key entities)
Full definition in `backend/prisma/schema.prisma`. Core relationships:
- **Lead** (dedup by unique `phoneNormalized`) → many **Enquiry**; every inbound contact is a
  **LeadTouch** row (walk-in / Meta / WhatsApp / sheet import) so re-enquiries stay visible.
- **Enquiry** = one sales opportunity. Moves through `EnquiryStatus`
  (`NEW → UNDER_FOLLOW_UP → APPOINTMENT_FIXED → TEST_DRIVE → BOOKED → RETAIL_DONE → CLOSED`);
  every change logged in **EnquiryStatusHistory**. Auto-assigned to a CR by count-based
  round-robin (`routing.service.ts`: fewest enquiries assigned today among active,
  routing-available `CR_TEAM` in the branch). Loss captured via `LossReason`.
- **Pipeline sub-tables** (mostly 1:1 with Enquiry): `Quotation`, `ExchangeEvaluation`,
  `FinanceApplication`, `DeliveryDetails`; 1:many: `FollowUp`, `TestDriveFeedback`,
  `Comment`, `ReassignmentLog`. `LeadDraft` holds in-progress offline intake (kept out of
  the real pipeline until complete).
- **Org:** `Branch` → `User` (roles `SUPER_ADMIN / ADMIN / BRANCH_MANAGER / CR_TEAM /
  CONSULTANT`); `RoleDefinition` = custom branch-scoped roles with module permissions.
- **Integrations/AI:** `IntegrationConfig` (encrypted creds, single on/off chokepoint),
  `MetaAdsPage`, `Conversation` + `ChatMessage` (social inbox), `AgentConfig` (bot toggles +
  system prompts), `MediaAsset`, `MessageTemplate`, `CallLog`, `OutboundCallCampaign` /
  `OutboundCallTask` (Voice AI auto-dial), `MessageCampaign`, `Notification`, `SystemSettings`.

---

## 10. Maintenance
Update this file when a module completes, an API/schema changes, or a convention is decided.
Keep §7 progress and §9 domain model in sync with `schema.prisma` and `app.ts`.
