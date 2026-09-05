-- ============================================================
-- SMM Panel: Manual/subscription order placement without the
-- service-role key. This does the whole flow (fetch service,
-- validate, debit wallet, insert order, log transaction)
-- atomically inside one SECURITY DEFINER function.
-- Run this ONCE in Supabase SQL Editor. Safe to re-run.
-- ============================================================

CREATE OR REPLACE FUNCTION public.rpc_create_manual_order(
  _service_id uuid,
  _whatsapp text,
  _quantity int,
  _note text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller uuid := auth.uid();
  svc record;
  qty int;
  unit numeric;
  total numeric;
  current_balance numeric;
  new_order_id uuid;
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id, name, fixed_price, allow_quantity, status, service_type
  INTO svc
  FROM public.services
  WHERE id = _service_id;

  IF NOT FOUND OR svc.service_type <> 'manual' OR svc.status <> 'active' THEN
    RAISE EXCEPTION 'This product is not available.';
  END IF;

  qty := CASE WHEN svc.allow_quantity THEN GREATEST(1, COALESCE(_quantity, 1)) ELSE 1 END;
  unit := COALESCE(svc.fixed_price, 0);
  IF unit <= 0 THEN
    RAISE EXCEPTION 'This product has no price configured.';
  END IF;
  total := unit * qty;

  SELECT wallet_balance INTO current_balance FROM public.profiles WHERE id = caller FOR UPDATE;
  IF current_balance IS NULL OR current_balance < total THEN
    RAISE EXCEPTION 'Insufficient balance. Please add funds first.';
  END IF;

  UPDATE public.profiles SET wallet_balance = current_balance - total WHERE id = caller;

  INSERT INTO public.orders (
    user_id, service_id, service_name, link, contact_whatsapp,
    note, quantity, price, status, order_type
  ) VALUES (
    caller, svc.id, svc.name, trim(_whatsapp), trim(_whatsapp),
    NULLIF(trim(COALESCE(_note, '')), ''), qty, total, 'processing', 'manual'
  )
  RETURNING id INTO new_order_id;

  INSERT INTO public.wallet_transactions (user_id, amount, type, status, description)
  VALUES (caller, -total, 'order', 'completed', 'Manual order: ' || svc.name);

  RETURN jsonb_build_object('orderId', new_order_id, 'total', total);
END;
$$;
REVOKE ALL ON FUNCTION public.rpc_create_manual_order(uuid, text, int, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_create_manual_order(uuid, text, int, text) TO authenticated;
