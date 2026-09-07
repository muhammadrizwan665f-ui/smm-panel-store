-- ============================================================
-- Referral system fix
--
-- Root cause of "referrals not working": public.profiles only had a
-- SELECT policy for regular users (see 20260904150000_admin_rls_setup.sql).
-- There was NO UPDATE policy, so attachReferral()'s
-- `.from("profiles").update({ referred_by: ... })` was silently blocked
-- by RLS for every non-admin user, and the code never checked the error.
--
-- Rather than opening a broad self-UPDATE policy on profiles (which would
-- let a user directly rewrite their own wallet_balance via the client),
-- we add narrow SECURITY DEFINER RPCs that do exactly the one safe thing
-- each caller needs, matching the pattern already used for
-- generate_referral_code()/has_role() elsewhere in this project.
-- ============================================================

CREATE OR REPLACE FUNCTION public.attach_referral_code(p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_already uuid;
  v_referrer_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT referred_by INTO v_already FROM public.profiles WHERE id = v_user_id;
  IF v_already IS NOT NULL THEN
    RETURN false; -- already has a referrer, never overwrite
  END IF;

  SELECT id INTO v_referrer_id FROM public.profiles WHERE referral_code = upper(trim(p_code));
  IF v_referrer_id IS NULL OR v_referrer_id = v_user_id THEN
    RETURN false; -- unknown code, or self-referral attempt
  END IF;

  UPDATE public.profiles SET referred_by = v_referrer_id WHERE id = v_user_id;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.attach_referral_code(text) TO authenticated;

-- Same fix for the (rare, legacy-profile) fallback in getMyReferral() that
-- generates+saves a referral_code if one is somehow still missing.
CREATE OR REPLACE FUNCTION public.ensure_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_code text;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT referral_code INTO v_code FROM public.profiles WHERE id = v_user_id;
  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;

  v_code := public.generate_referral_code();
  UPDATE public.profiles SET referral_code = v_code WHERE id = v_user_id;
  RETURN v_code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_referral_code() TO authenticated;

-- Admin-configurable referral program settings (read by the deposit-approval
-- flow to decide whether/how much automatic commission to pay).
INSERT INTO public.site_settings (key, value, description)
VALUES ('referral_enabled', 'true', 'Whether referral commissions are paid automatically on deposits')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.site_settings (key, value, description)
VALUES ('referral_commission_percent', '10', 'Percent of each deposit paid as commission to the referrer''s wallet')
ON CONFLICT (key) DO NOTHING;

-- Track which deposits already paid out a commission, so re-processing the
-- same deposit (or a race) can never double-pay.
ALTER TABLE public.referral_commissions
  ADD COLUMN IF NOT EXISTS deposit_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS referral_commissions_deposit_id_key
  ON public.referral_commissions (deposit_id)
  WHERE deposit_id IS NOT NULL;
