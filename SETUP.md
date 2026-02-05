# Football Plus - Setup Guide

## Initial Setup Steps

### 1. Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Go to Settings > API and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon/Public Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service Role Key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### 2. Database Setup

1. Go to SQL Editor in Supabase
2. Run the migration file: `supabase/migrations/001_initial_schema.sql`
3. Verify tables are created: `users`, `players`, `teams`, `attendance`

### 3. Storage Setup

1. Go to Storage in Supabase
2. Create two public buckets:
   - `profile-photos` (public)
   - `player-photos` (public)
3. Set policies:
   - Allow authenticated users to upload
   - Allow public to read

### 4. Environment Variables

Create `.env.local` file:
```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 5. Create First Admin User

Since sign-ups are disabled, you need to create the first admin user manually:

1. Go to Authentication > Users in Supabase
2. Click "Add User" → "Create new user"
3. Enter email and temporary password
4. Go to SQL Editor and run:
```sql
INSERT INTO public.users (id, name, email, role)
VALUES (
  'user-uuid-from-auth',
  'Admin Name',
  'admin@example.com',
  'admin'
);
```
Replace `user-uuid-from-auth` with the actual user ID from auth.users table.

5. User can now login and reset their password

### 6. Install Dependencies

```bash
npm install
```

### 7. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Deployment to Vercel

1. Push code to GitHub/GitLab
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## Troubleshooting

### RLS Policies
If you get permission errors, check Row Level Security policies are enabled and correct.

### Image Uploads
Ensure storage buckets exist and have correct policies.

### User Creation
The API route `/api/users/create` requires the service role key to create auth users.
