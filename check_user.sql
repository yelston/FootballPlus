-- Diagnostic query to check if your user record exists
-- Run this in Supabase SQL Editor to verify the user was created

-- Check if user exists in public.users table
SELECT id, name, email, role, "createdAt"
FROM public.users
WHERE id = '8ba09cce-bd1c-4ff5-b2ae-860dbae362f4';

-- If the above returns no rows, the user doesn't exist. Try inserting again:
-- Make sure to run this with "Run as postgres" to bypass RLS
INSERT INTO public.users (id, name, email, role)
VALUES (
    '8ba09cce-bd1c-4ff5-b2ae-860dbae362f4',
    'Elston',
    'yelston@gmail.com',
    'admin'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role;

-- Verify it was created
SELECT id, name, email, role, "createdAt"
FROM public.users
WHERE id = '8ba09cce-bd1c-4ff5-b2ae-860dbae362f4';
