-- Add email column to profiles so admin can see student emails
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Backfill email from auth.users for existing profiles
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- Allow users to insert/update their own email
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- Teachers can read email (already covered by existing SELECT policy)
-- Students can read their own profile (already covered)
