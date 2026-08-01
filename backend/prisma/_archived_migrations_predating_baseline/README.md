These 26 migration folders are kept for history only — Prisma no longer applies them.

They stopped matching `schema.prisma` at some point (several enum renames/additions —
`FOLLOW_UP`→`UNDER_FOLLOW_UP`, `ENQUIRY_CLOSED`→`CLOSED`, added `RTO_DONE`/`DELIVERED` — were
applied to the dev database via `prisma db push` and never captured as migration files here).
Running `prisma migrate deploy` against this history fails on a fresh database (confirmed
2026-08-01: `20260730130100_backfill_closed_to_lost` errors with "invalid input value for enum
EnquiryStatus: CLOSED", because no migration in this set ever renames `ENQUIRY_CLOSED` to
`CLOSED`).

Since no real production data existed yet, the active `prisma/migrations/` folder was reset to
a single `baseline` migration generated fresh from the current `schema.prisma` (2026-08-01).
`backend/container-start.js` now runs `prisma migrate deploy` on boot instead of `prisma db
push` — going forward, every schema change needs a real migration file (`prisma migrate dev
--name <change>`) committed alongside it, not just an edit to schema.prisma.
