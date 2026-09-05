-- ============================================================
-- SMM Panel: Order placement without the service-role key.
-- These SECURITY DEFINER functions let placeProviderOrder run
-- safely using the calling user's own token, while still
-- protecting wallet balances and provider API keys from direct
-- client manipulation.
-- Run this ONCE in Supabase SQL Editor. Safe to re-run.
-- ============================================================

CREATE OR REPLACE FUNCTION public.rpc_get_order_context(_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  order_row public.orders;
BEGIN
  SELECT * INTO order_row FROM public.orders WHERE id = _order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF order_row.user_id <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT jsonb_build_object(
    'order', to_jsonb(o.*),
    'service', to_jsonb(s.*),
    'provider', jsonb_build_object(
      'id', p.id,
      'api_url', p.api_url,
      'api_key', p.api_key,
      'api_version', p.api_version,
      'currency', p.currency
    ),
    'wallet_balance', pr.wallet_balance
  )
  INTO result
  FROM public.orders o
  LEFT JOIN public.services s ON s.id = o.service_id
  LEFT JOIN public.providers p ON p.id = COALESCE(s.provider_id, o.provider_id)
  LEFT JOIN public.profiles pr ON pr.id = o.user_id
  WHERE o.id = _order_id;

  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.rpc_get_order_context(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_get_order_context(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_debit_wallet_for_order(_order_id uuid, _amount numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user uuid;
  current_balance numeric;
  new_balance numeric;
BEGIN
  SELECT user_id INTO target_user FROM public.orders WHERE id = _order_id;
  IF target_user IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  IF target_user <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT wallet_balance INTO current_balance FROM public.profiles WHERE id = target_user FOR UPDATE;
  IF current_balance IS NULL OR current_balance < _amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  new_balance := current_balance - _amount;
  UPDATE public.profiles SET wallet_balance = new_balance WHERE id = target_user;

  INSERT INTO public.wallet_transactions (user_id, amount, type, status, description)
  VALUES (target_user, -_amount, 'order', 'completed', 'Order #' || left(_order_id::text, 8));

  RETURN new_balance;
END;
$$;
REVOKE ALL ON FUNCTION public.rpc_debit_wallet_for_order(uuid, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_debit_wallet_for_order(uuid, numeric) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_refund_wallet_for_order(_order_id uuid, _amount numeric, _description text)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user uuid;
  current_balance numeric;
  new_balance numeric;
BEGIN
  SELECT user_id INTO target_user FROM public.orders WHERE id = _order_id;
  IF target_user IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  IF target_user <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT wallet_balance INTO current_balance FROM public.profiles WHERE id = target_user FOR UPDATE;
  new_balance := COALESCE(current_balance, 0) + _amount;
  UPDATE public.profiles SET wallet_balance = new_balance WHERE id = target_user;

  INSERT INTO public.wallet_transactions (user_id, amount, type, status, description)
  VALUES (target_user, _amount, 'refund', 'completed', COALESCE(_description, 'Refund for order #' || left(_order_id::text, 8)));

  RETURN new_balance;
END;
$$;
REVOKE ALL ON FUNCTION public.rpc_refund_wallet_for_order(uuid, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_refund_wallet_for_order(uuid, numeric, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_finalize_order(
  _order_id uuid,
  _status text,
  _provider_order_id text,
  _provider_cost numeric,
  _profit numeric,
  _provider_response jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user uuid;
BEGIN
  SELECT user_id INTO target_user FROM public.orders WHERE id = _order_id;
  IF target_user IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  IF target_user <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  UPDATE public.orders
  SET
    status = _status,
    provider_order_id = COALESCE(_provider_order_id, provider_order_id),
    provider_cost = COALESCE(_provider_cost, provider_cost),
    estimated_profit = COALESCE(_profit, estimated_profit),
    provider_response = COALESCE(_provider_response, provider_response)
  WHERE id = _order_id;
END;
$$;
REVOKE ALL ON FUNCTION public.rpc_finalize_order(uuid, text, text, numeric, numeric, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_finalize_order(uuid, text, text, numeric, numeric, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_log_provider_api(
  _provider_id uuid,
  _operation text,
  _request jsonb,
  _response jsonb,
  _status_code int,
  _is_success boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.provider_api_logs (provider_id, operation, request_payload, response_payload, status_code, is_success)
  VALUES (_provider_id, _operation, _request, _response, _status_code, _is_success);
END;
$$;
REVOKE ALL ON FUNCTION public.rpc_log_provider_api(uuid, text, jsonb, jsonb, int, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_log_provider_api(uuid, text, jsonb, jsonb, int, boolean) TO authenticated;
