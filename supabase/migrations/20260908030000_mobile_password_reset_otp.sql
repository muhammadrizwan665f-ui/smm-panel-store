-- ============================================================
-- Free mobile-number password reset (WhatsApp-relayed OTP)
--
-- Mobile-only accounts have no real email, so Supabase's email-based
-- reset can't reach them, and a real SMS gateway costs money. This is a
-- fully free alternative: generate a short-lived OTP, let the ADMIN see
-- it on a dashboard page to relay by hand via WhatsApp (which this
-- business already uses for support), and let the user set their own
-- new password once they enter it correctly.
--
-- IMPORTANT — how this actually sets the password without the
-- service-role key: it writes a bcrypt hash straight into Supabase's
-- own auth.users.encrypted_password column using pgcrypto, run inside a
-- SECURITY DEFINER function (owned by the migration-running role, which
-- has full database access, unlike the app's regular client). This
-- matches the hashing Supabase's own Auth service uses, and is a
-- reasonably well-established technique — but it IS reaching directly
-- into Supabase's internal schema rather than going through their
-- official Admin API, so it's not officially guaranteed to keep working
-- across every future Supabase platform update, the way admin_view_user
-- or attach_referral_code (which only touch our own tables) are.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.password_reset_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mobile_number text NOT NULL,
  otp text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.password_reset_otps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view reset requests" ON public.password_reset_otps
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Step 1: user requests a code for their mobile number.
CREATE OR REPLACE FUNCTION public.request_password_reset_otp(p_mobile text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid;
  v_recent_count int;
  v_otp text;
BEGIN
  SELECT id INTO v_user_id FROM public.profiles WHERE mobile_number = p_mobile;
  IF v_user_id IS NULL THEN
    RETURN; -- silently no-op for unknown numbers (don't reveal which numbers are registered)
  END IF;

  -- Basic rate limit: max one active request per 60 seconds per user.
  SELECT count(*) INTO v_recent_count FROM public.password_reset_otps
    WHERE user_id = v_user_id AND created_at > now() - interval '60 seconds';
  IF v_recent_count > 0 THEN
    RETURN;
  END IF;

  v_otp := lpad((floor(random() * 1000000))::text, 6, '0');

  INSERT INTO public.password_reset_otps (user_id, mobile_number, otp, expires_at)
  VALUES (v_user_id, p_mobile, v_otp, now() + interval '15 minutes');
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_password_reset_otp(text) TO authenticated, anon;

-- Step 2: user enters the code (relayed to them via WhatsApp by an admin)
-- plus a new password.
CREATE OR REPLACE FUNCTION public.reset_password_with_otp(p_mobile text, p_otp text, p_new_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_row public.password_reset_otps%ROWTYPE;
BEGIN
  IF length(p_new_password) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters';
  END IF;

  SELECT * INTO v_row FROM public.password_reset_otps
    WHERE mobile_number = p_mobile AND otp = p_otp AND used = false AND expires_at > now()
    ORDER BY created_at DESC LIMIT 1;

  IF v_row.id IS NULL THEN
    RETURN false; -- wrong/expired code
  END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = v_row.user_id;

  UPDATE public.password_reset_otps SET used = true WHERE id = v_row.id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_password_with_otp(text, text, text) TO authenticated, anon;
