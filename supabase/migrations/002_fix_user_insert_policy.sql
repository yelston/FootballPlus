-- Fix RLS policy to allow users to insert their own record
-- This solves the bootstrap problem for the first admin user

-- Drop existing policies if they exist (for re-running)
DROP POLICY IF EXISTS "Users can insert own record" ON public.users;

-- Allow authenticated users to insert their own record
-- This is needed for the first user creation and for users creating their profile
CREATE POLICY "Users can insert own record"
  ON public.users
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- Also create a helper function for creating the first admin user
-- This can be used via SQL Editor with "Run as postgres" to bypass RLS entirely
CREATE OR REPLACE FUNCTION public.create_first_user(
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  user_role TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role)
  VALUES (user_id, user_name, user_email, user_role)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_first_user(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_first_user(UUID, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.create_first_user(UUID, TEXT, TEXT, TEXT) TO service_role;
