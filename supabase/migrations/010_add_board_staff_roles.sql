-- Add 'board' and 'staff' to the allowed roles for users
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'board', 'coach', 'staff', 'volunteer'));
