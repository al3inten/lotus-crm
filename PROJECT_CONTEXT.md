# PROJECT_CONTEXT.md — LotusCRM

> Single source of truth for this project. Keep this file current as modules complete.
> Sections marked **⚠️ CONFIRM** are inferred and need the owner to verify/fill in.

---

## 1. Overview
**LotusCRM** — a CRM for **Hyundai dealership teams** ("Lotus CRM · Hyundai Dealership Suite").
Manages the full enquiry lifecycle: lead capture → smart round-robin routing to Customer
Reps (CRs) → calls/messages/social inbox → conversion reporting.

Monorepo layout:
```
LotusCRM/
  frontend/   # React 19 + Vite SPA (this is the primary UI app)
  backend/    # Node/Express API  (⚠️ CONFIRM details)
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

### Backend (`backend/`) — ⚠️ CONFIRM
Inferred from dependencies: **Express**, **bcryptjs** (password hashing), **jsonwebtoken**
(JWT auth), **multer** (file uploads), **archiver/unzipper/jszip** (zip handling), **axios**.
_Owner to confirm: DB (MongoDB/SQL?), ORM, folder structure, route list._

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

## 4. Routing & Auth
- `routes/router.tsx` uses `createBrowserRouter`.
  - Public: `/` → `LandingPage`, `/login` → `LoginPage`.
  - Protected: wrapped in `ProtectedRoute` → `AppShell` (Sidebar + Topbar + BottomNav +
    `<Outlet>`), with **role-gated** nested routes (`/dashboard`, `/leads`, `/reports`,
    `/integrations`, ...).
- **Auth flow:** `context/AuthContext.tsx` exposes `useAuth() → { user, login, logout }`.
  `login(email, password)` authenticates (⚠️ CONFIRM: JWT stored where — localStorage/cookie?).
  `LoginPage` redirects authenticated users to `/dashboard` via `<Navigate replace />`.
- Login validation: `schemas/auth.schema.ts` — `loginFormSchema` (email + required password).

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
**Done / present:** Landing page, **Login page (bold glass redesign)**, Dashboard (stat tiles,
charts, quick actions), Leads, Reports, Integrations, layout shell (Sidebar/Topbar/BottomNav),
auth context + protected/role-gated routing, shared component library + design tokens.

**Recent work:** Redesigned `LoginPage.tsx` — animated gradient backdrop, glass feature chips,
stats strip, gradient-ring form card, refined inputs (auth logic/validation unchanged).

**Pending / roadmap:** ⚠️ _Owner to fill in._

**Known issues:** frontend build warns that the JS chunk is >500 kB (consider code-splitting).

---

## 8. Maintenance
Update this file when a module completes, an API/schema changes, or a convention is decided.
Resolve every **⚠️ CONFIRM** marker with real project facts.
