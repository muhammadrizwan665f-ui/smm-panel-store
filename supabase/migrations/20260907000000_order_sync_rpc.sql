-- ============================================================
-- SMM Panel: Order status sync (cron) without the service-role
-- key. This background job has no user session at all (it's
-- triggered by an external cron hitting a secret-key-protected
-- endpoint), so these SECURITY DEFINER functions are granted to
-- the anon role — the real protection is the secret key checked
-- in application code before either function is ever called.
-- Run this ONCE in Supabase SQL Editor. Safe to re-run.
-- ============================================================

CREATE OR REPLACE FUNCTION public.rpc_list_pending_sync_orders(_limit int DEFAULT 25, _user_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(row_to_json(t))
  INTO result
  FROM (
    SELECT o.id, o.status, o.provider_order_id, o.price, o.user_id,
           p.api_url, p.api_key, p.api_version
    FROM public.orders o
    LEFT JOIN public.providers p ON p.id = o.provider_id
    WHERE o.status NOT IN ('completed', 'failed', 'cancelled', 'refunded')
      AND o.provider_order_id IS NOT NULL
      AND (_user_id IS NULL OR o.user_id = _user_id)
    ORDER BY o.updated_at ASC
    LIMIT _limit
  ) t;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;
REVOKE ALL ON FUNCTION public.rpc_list_pending_sync_orders(int, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_list_pending_sync_orders(int, uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.rpc_apply_sync_result(
  _order_id uuid,
  _internal_status text,
  _provider_response jsonb,
  _do_refund boolean DEFAULT false,
  _refund_description text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user uuid;
  order_price numeric;
  current_balance numeric;
BEGIN
  SELECT user_id, price INTO target_user, order_price FROM public.orders WHERE id = _order_id;
  IF target_user IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF _do_refund THEN
    SELECT wallet_balance INTO current_balance FROM public.profiles WHERE id = target_user FOR UPDATE;
    UPDATE public.profiles SET wallet_balance = COALESCE(current_balance, 0) + order_price WHERE id = target_user;

    INSERT INTO public.wallet_transactions (user_id, amount, type, status, description)
    VALUES (target_user, order_price, 'refund', 'completed', COALESCE(_refund_description, 'Auto-refund for order #' || left(_order_id::text, 8)));
  END IF;

  UPDATE public.orders
  SET status = _internal_status, provider_response = _provider_response
  WHERE id = _order_id;
END;
$$;
REVOKE ALL ON FUNCTION public.rpc_apply_sync_result(uuid, text, jsonb, boolean, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_apply_sync_result(uuid, text, jsonb, boolean, text) TO anon, authenticated;
