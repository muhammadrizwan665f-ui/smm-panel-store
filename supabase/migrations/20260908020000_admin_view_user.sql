-- "View as User" for admins: a read-only snapshot of a user's profile,
-- recent orders, recent wallet transactions and referral info, callable
-- with the regular (anon-key) client since it's SECURITY DEFINER and
-- checks admin status internally.
--
-- This does NOT create a real login session (that genuinely requires the
-- Supabase service-role key — there's no SQL-only way around that, since
-- signing an Auth session token requires a secret that lives outside
-- Postgres entirely). This covers the common "let me check this user's
-- balance/orders/history" need without it.

CREATE OR REPLACE FUNCTION public.admin_view_user(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
  v_is_admin boolean;
  v_result jsonb;
BEGIN
  SELECT public.has_role(v_admin_id, 'admin') INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT jsonb_build_object(
    'profile', (
      SELECT jsonb_build_object(
        'id', p.id,
        'mobile_number', p.mobile_number,
        'email', p.email,
        'wallet_balance', p.wallet_balance,
        'status', p.status,
        'created_at', p.created_at,
        'referral_code', p.referral_code
      )
      FROM public.profiles p WHERE p.id = p_user_id
    ),
    'referred_by', (
      SELECT jsonb_build_object('id', r.id, 'mobile_number', r.mobile_number)
      FROM public.profiles me
      JOIN public.profiles r ON r.id = me.referred_by
      WHERE me.id = p_user_id
    ),
    'referred_users', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', ref.id, 'mobile_number', ref.mobile_number, 'joined_at', ref.created_at
      ) ORDER BY ref.created_at DESC), '[]'::jsonb)
      FROM public.profiles ref WHERE ref.referred_by = p_user_id
    ),
    'commission_earned', (
      SELECT COALESCE(SUM(amount), 0) FROM public.referral_commissions WHERE referrer_id = p_user_id
    ),
    'recent_orders', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', o.id, 'service_name', o.service_name, 'platform', o.platform,
        'quantity', o.quantity, 'price', o.price, 'status', o.status, 'created_at', o.created_at
      ) ORDER BY o.created_at DESC), '[]'::jsonb)
      FROM (SELECT * FROM public.orders WHERE user_id = p_user_id ORDER BY created_at DESC LIMIT 15) o
    ),
    'recent_transactions', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', t.id, 'amount', t.amount, 'type', t.type, 'status', t.status,
        'description', t.description, 'created_at', t.created_at
      ) ORDER BY t.created_at DESC), '[]'::jsonb)
      FROM (SELECT * FROM public.wallet_transactions WHERE user_id = p_user_id ORDER BY created_at DESC LIMIT 20) t
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_view_user(uuid) TO authenticated;
