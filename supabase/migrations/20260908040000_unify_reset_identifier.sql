-- Extends the mobile-only OTP reset (20260908030000) to also accept an
-- email as the identifier. This means EVERY account — mobile or
-- email-registered — can now be reset entirely through our own system,
-- with zero dependency on Supabase's built-in email templates or its
-- Site URL / Redirect URLs allowlist (which isn't editable via SQL, and
-- isn't reachable without direct Supabase dashboard access).

ALTER TABLE public.password_reset_otps
  ADD COLUMN IF NOT EXISTS identifier text;

UPDATE public.password_reset_otps SET identifier = mobile_number WHERE identifier IS NULL;

CREATE OR REPLACE FUNCTION public.request_password_reset_otp(p_identifier text)
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
  SELECT id INTO v_user_id FROM public.profiles
    WHERE mobile_number = p_identifier OR lower(email) = lower(p_identifier);
  IF v_user_id IS NULL THEN
    RETURN; -- silently no-op for unknown identifiers
  END IF;

  SELECT count(*) INTO v_recent_count FROM public.password_reset_otps
    WHERE user_id = v_user_id AND created_at > now() - interval '60 seconds';
  IF v_recent_count > 0 THEN
    RETURN;
  END IF;

  v_otp := lpad((floor(random() * 1000000))::text, 6, '0');

  INSERT INTO public.password_reset_otps (user_id, mobile_number, identifier, otp, expires_at)
  VALUES (v_user_id, p_identifier, p_identifier, v_otp, now() + interval '15 minutes');
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_password_reset_otp(text) TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.reset_password_with_otp(p_identifier text, p_otp text, p_new_password text)
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
    WHERE identifier = p_identifier AND otp = p_otp AND used = false AND expires_at > now()
    ORDER BY created_at DESC LIMIT 1;

  IF v_row.id IS NULL THEN
    RETURN false;
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
