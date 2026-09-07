-- adminListUsers previously needed auth.admin.listUsers() (service-role
-- only) just to show each user's email. Since the email is already
-- available on the user's own validated JWT claims at signup time
-- (no privileged API needed), we store it directly on profiles instead —
-- removing that dependency entirely going forward.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text;

-- Lets a freshly-registered user finish setting up their OWN profile row
-- without needing the service-role key at all: SECURITY DEFINER means this
-- runs with elevated DB privileges internally, but the regular (anon-key)
-- client can call it safely since it only ever touches auth.uid()'s own row.
CREATE OR REPLACE FUNCTION public.complete_my_profile(p_mobile_number text, p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.profiles (id, mobile_number, email, wallet_balance)
  VALUES (v_user_id, p_mobile_number, p_email, 0)
  ON CONFLICT (id) DO UPDATE SET
    mobile_number = COALESCE(public.profiles.mobile_number, EXCLUDED.mobile_number),
    email = COALESCE(EXCLUDED.email, public.profiles.email);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_my_profile(text, text) TO authenticated;
