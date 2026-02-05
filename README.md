# Football Plus

A role-based web platform for youth soccer academy management.

## Features

- **User Management**: Admin-only user creation and management
- **Player Profiles**: Comprehensive player management with photos, positions, and team assignments
- **Team Management**: Create and manage teams with coaches and volunteers
- **Attendance & Points**: Track attendance and assign points with calendar and list views
- **Analytics**: View player and team statistics with filtering options
- **Mobile-Optimized**: Fully responsive design for on-field usage

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth, PostgreSQL, Storage, RLS)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd FootballPlus
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

4. Set up the database:
   - Run the migration file `supabase/migrations/001_initial_schema.sql` in your Supabase SQL editor
   - Create storage buckets:
     - `profile-photos` (public)
     - `player-photos` (public)

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## User Roles

- **Admin**: Full access to all features
- **Coach**: Can manage players, teams, and attendance
- **Volunteer**: Read-only access to view information

## Database Schema

See `supabase/migrations/001_initial_schema.sql` for the complete schema.

### Key Tables

- `users`: Academy staff and volunteers
- `players`: Player profiles
- `teams`: Team information
- `attendance`: Attendance and points records

## Deployment

### Vercel

1. Push your code to a Git repository
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

The app will automatically deploy on every push to the main branch.

## License

Private - All rights reserved
