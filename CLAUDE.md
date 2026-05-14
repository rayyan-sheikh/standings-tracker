# Tournament Tracker

Personal league tournament tracker. Single admin user, public read-only pages shared via QR code.

## Stack

- **React + Vite + TypeScript** — frontend
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin (no `tailwind.config.js`)
- **shadcn/ui components** hand-written in `src/components/ui/` (do not use the shadcn CLI — it requires a newer Node version and fails)
- **Supabase** — PostgreSQL database + auth + Row Level Security (no custom backend)
- **React Router v6** — client-side routing
- **react-qr-code** — QR code generation

## Dev commands

```bash
npm run dev      # start dev server
npm run build    # production build
npx tsc --noEmit # type check
```

## Project structure

```
src/
  components/
    admin/    # Admin-only components (TeamManager, MatchCard, QRCodeModal, LegManager)
    public/   # Public-facing components (ScheduleView, StandingsTable)
    ui/       # Primitive UI components (button, card, input, etc.)
  hooks/      # useAuth
  lib/        # supabase client, roundRobin algorithm
  pages/      # Login, AdminDashboard, TournamentAdmin, PublicTournament
  types/      # Shared TypeScript interfaces
  utils/      # standings computation
supabase-schema.sql   # Run this once in Supabase SQL editor to create tables + RLS
```

## Routes

| Path | Access | Description |
|---|---|---|
| `/login` | Public | Admin login |
| `/admin` | Auth only | Tournament list |
| `/admin/tournament/:id` | Auth only | Manage tournament |
| `/t/:id` | Public | Public tournament page (schedule + standings) |

## Environment variables

Create `.env.local` (gitignored):

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase setup

1. Create a project at supabase.com
2. Run `supabase-schema.sql` in the SQL editor
3. Go to Authentication > Users and create your admin account
4. Copy Project URL and anon key into `.env.local`

## Key logic

- **Round-robin** (`src/lib/roundRobin.ts`): circle/Berger table method. Leg 2+ flips home/away.
- **Standings** (`src/utils/standings.ts`): computed client-side. Sort: Pts → GD → GF → name.
- **RLS**: anonymous role can SELECT all tables; authenticated role has full write access.

## Commit style

- No "Co-Authored-By: Claude" lines in commits.
