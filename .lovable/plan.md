## Plan: Make JEE OS real

### Note on Gemini
Lovable Cloud ships **Lovable AI Gateway** which already gives free, unlimited Gemini access (no separate API key needed, no setup). I'll use `google/gemini-3-flash-preview` for the AI Mentor — same Gemini you asked for, just zero-config.

### Step 1 — Enable Lovable Cloud
- Provisions Postgres + Auth + AI Gateway.
- No external accounts.

### Step 2 — Schema (one migration)
Tables (all with RLS scoped to `auth.uid()`):
- `profiles` — display name, target AIR, exam date
- `subjects` — seeded: Physics, Chemistry, Maths
- `chapters` — per subject, mastery 0–100
- `daily_tasks` — non-negotiables (date, title, target, done count)
- `practice_sessions` — subject, chapter, attempted, correct, time, difficulty
- `mistakes` — question, subject, chapter, type (silly/concept/calc), notes, mark cost
- `revisions` — topic, last_revised_at, stage (D1/D3/D7/D14/D30), confidence
- `focus_sessions` — start, duration, distractions, subject
- `mocks` — name, date, marks, max, rank_projection, leakage_breakdown (jsonb)
- `mentor_messages` — role, content (chat history)

### Step 3 — Auth
- `/auth` page: email+password and Google.
- Root guard redirects unauthenticated users to `/auth`.
- Sidebar shows user + logout.

### Step 4 — Wire every page (remove mock arrays)
For each route, replace constants with live queries (TanStack Query + Supabase browser client) and make every button work:

- **Mission Control** — daily tasks CRUD, computed readiness from real chapter mastery, subject grid from aggregates.
- **Practice Engine** — "Log session" dialog (subject, chapter, attempted/correct/time/difficulty); stats and difficulty mix computed from `practice_sessions`.
- **Error Intelligence** — add/edit/delete mistakes; type counts and "top cost" computed live.
- **Revision Vault** — add topic, "Mark revised" advances stage and resets timer; due-today list from `next_review_at`.
- **Deep Work** — real working timer with start/pause/stop, +distraction button; saves session on stop; heatmap from real sessions.
- **Mock War Room** — "Add mock" form; rank trajectory chart from real entries; leakage from jsonb.
- **AI Mentor** — streaming chat via edge function `/api/mentor` calling Lovable AI Gateway with Gemini, given the user's last 30 days of aggregated stats as system context.

### Step 5 — Shared
- Toaster for feedback on every action.
- Empty states with CTAs (no fake placeholder data anywhere).
- Loading skeletons.

### Technical notes
- Browser Supabase client for reads/writes (RLS enforces ownership).
- AI Mentor via TanStack server route `/api/mentor` (POST, streaming) so `LOVABLE_API_KEY` stays server-side.
- Subjects seeded via migration; chapters added by user (with a one-click "Seed JEE syllabus" button on first run).

### Out of scope (this round)
- Mobile-specific layouts beyond what already responds.
- Admin/analytics dashboards beyond per-user views.

Proceeding to implementation on approval.