-- Check for any CHECK constraints or triggers that might be causing the RLS error 
-- even when RLS is disabled (yes, PostgreSQL sometimes gives misleading errors).

-- 1. Check constraints
SELECT conname, pg_get_constraintdef(c.oid) 
FROM pg_constraint c 
JOIN pg_namespace n ON n.oid = c.connamespace 
WHERE n.nspname = 'public' AND conrelid = 'public.providers'::regclass;

-- 2. Triggers
SELECT tgname 
FROM pg_trigger 
WHERE tgrelid = 'public.providers'::regclass;

-- 3. If there are any complex constraints, we might see them here.

-- Also, let's try to just RECREATE the table if it's corrupted in the schema cache.
-- BUT first, let's just try to INSERT with ONLY name to see if it works.
