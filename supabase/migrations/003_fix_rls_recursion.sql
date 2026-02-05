-- Fix infinite recursion in RLS policies for users table
-- The issue: The "Admins can manage all users" policy queries users table,
-- which triggers the same policy check, causing infinite recursion

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
DROP POLICY IF EXISTS "Users can read own record" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own record" ON public.users;

-- Create a SECURITY DEFINER function to check if current user is admin
-- SECURITY DEFINER bypasses RLS, preventing recursion
CREATE OR REPLACE FUNCTION public.user_is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Directly query auth.users metadata or use a bypass method
  -- Since we can't easily get role from auth.users, we'll query public.users
  -- but SECURITY DEFINER means this query bypasses RLS
  SELECT role INTO user_role
  FROM public.users
  WHERE id = auth.uid();
  
  RETURN user_role = 'admin';
END;
$$;

-- Policy: Users can always read their own record (no recursion - only checks auth.uid())
CREATE POLICY "Users can read own record"
  ON public.users
  FOR SELECT
  USING (id = auth.uid());

-- Policy: Admins can read all users (uses function to avoid recursion)
CREATE POLICY "Admins can read all users"
  ON public.users
  FOR SELECT
  USING (public.user_is_admin());

-- Policy: Users can insert their own record
CREATE POLICY "Users can insert own record"
  ON public.users
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- Policy: Users can update their own record (but not role)
CREATE POLICY "Users can update own record"
  ON public.users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    -- Prevent role changes - get role from existing record, not query
    role = (SELECT role FROM public.users WHERE id = auth.uid())
  );

-- Policy: Admins can update any user
CREATE POLICY "Admins can update all users"
  ON public.users
  FOR UPDATE
  USING (public.user_is_admin())
  WITH CHECK (public.user_is_admin());

-- Policy: Admins can delete users
CREATE POLICY "Admins can delete users"
  ON public.users
  FOR DELETE
  USING (public.user_is_admin());

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.user_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_is_admin() TO anon;
