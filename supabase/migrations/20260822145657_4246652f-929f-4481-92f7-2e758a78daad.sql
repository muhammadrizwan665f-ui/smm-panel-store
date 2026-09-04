-- Gateway configuration additions
ALTER TABLE public.payment_gateways
  ADD COLUMN IF NOT EXISTS qr_api_url text,
  ADD COLUMN IF NOT EXISTS qr_request_template jsonb,
  ADD COLUMN IF NOT EXISTS qr_response_path text,
  ADD COLUMN IF NOT EXISTS callback_url text,
  ADD COLUMN IF NOT EXISTS fee_percent numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bonus_percent numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bonus_start_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expiry_minutes integer NOT NULL DEFAULT 30;

-- Deposit request additions for QR / callback lifecycle
ALTER TABLE public.deposit_requests
  ADD COLUMN IF NOT EXISTS reference_id text,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS gateway_transaction_id text,
  ADD COLUMN IF NOT EXISTS bank_ref_id text,
  ADD COLUMN IF NOT EXISTS payment_mode text,
  ADD COLUMN IF NOT EXISTS vpa text,
  ADD COLUMN IF NOT EXISTS virtual_accounts_id text,
  ADD COLUMN IF NOT EXISTS qr_payload text,
  ADD COLUMN IF NOT EXISTS qr_image_url text,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS callback_received_at timestamptz,
  ADD COLUMN IF NOT EXISTS credited_amount numeric;

ALTER TABLE public.deposit_requests ALTER COLUMN utr DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS deposit_requests_reference_id_key
  ON public.deposit_requests (reference_id) WHERE reference_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS deposit_requests_gateway_txn_key
  ON public.deposit_requests (gateway_transaction_id) WHERE gateway_transaction_id IS NOT NULL;

-- Atomic, idempotent callback processing
CREATE OR REPLACE FUNCTION public.process_bharatpay_callback(
  p_gateway_id uuid,
  p_reference text,
  p_txn_id text,
  p_amount numeric,
  p_status text,
  p_bank_ref text,
  p_payment_mode text,
  p_vpa text,
  p_va_id text,
  p_payload jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  dep public.deposit_requests%ROWTYPE;
  st text := upper(coalesce(p_status, ''));
  bal numeric;
BEGIN
  -- Duplicate protection: a gateway transaction may only ever settle one deposit
  IF p_txn_id IS NOT NULL THEN
    SELECT * INTO dep FROM public.deposit_requests
      WHERE gateway_transaction_id = p_txn_id FOR UPDATE;
  END IF;

  IF dep.id IS NULL AND p_reference IS NOT NULL THEN
    SELECT * INTO dep FROM public.deposit_requests
      WHERE reference_id = p_reference FOR UPDATE;
  END IF;

  IF dep.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'unknown_transaction');
  END IF;

  IF p_gateway_id IS NOT NULL AND dep.gateway_id IS DISTINCT FROM p_gateway_id THEN
    RETURN jsonb_build_object('ok', false, 'code', 'gateway_mismatch');
  END IF;

  IF dep.status = 'approved' THEN
    RETURN jsonb_build_object('ok', true, 'code', 'already_processed', 'deposit_id', dep.id);
  END IF;

  UPDATE public.deposit_requests SET
    verification_response = p_payload,
    callback_received_at = now(),
    gateway_transaction_id = coalesce(p_txn_id, gateway_transaction_id),
    bank_ref_id = coalesce(p_bank_ref, bank_ref_id),
    payment_mode = coalesce(p_payment_mode, payment_mode),
    vpa = coalesce(p_vpa, vpa),
    virtual_accounts_id = coalesce(p_va_id, virtual_accounts_id),
    utr = coalesce(utr, p_bank_ref, p_txn_id)
  WHERE id = dep.id;

  IF st = 'FAILED' THEN
    UPDATE public.deposit_requests
      SET status = 'rejected', admin_note = 'Gateway reported FAILED', processed_at = now()
      WHERE id = dep.id;
    RETURN jsonb_build_object('ok', true, 'code', 'failed', 'deposit_id', dep.id);
  END IF;

  IF st <> 'SUCCESS' THEN
    RETURN jsonb_build_object('ok', true, 'code', 'pending', 'deposit_id', dep.id);
  END IF;

  IF p_amount IS NULL OR round(p_amount, 2) <> round(dep.amount, 2) THEN
    UPDATE public.deposit_requests
      SET admin_note = 'Amount mismatch: gateway ' || coalesce(p_amount::text, 'null') || ' vs expected ' || dep.amount::text
      WHERE id = dep.id;
    RETURN jsonb_build_object('ok', false, 'code', 'amount_mismatch', 'deposit_id', dep.id);
  END IF;

  IF dep.expires_at IS NOT NULL AND dep.expires_at < now() THEN
    UPDATE public.deposit_requests
      SET status = 'expired', admin_note = 'Successful payment received after expiry - needs manual review'
      WHERE id = dep.id AND status = 'pending';
    RETURN jsonb_build_object('ok', false, 'code', 'expired', 'deposit_id', dep.id);
  END IF;

  SELECT wallet_balance INTO bal FROM public.profiles WHERE id = dep.user_id FOR UPDATE;
  IF bal IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'profile_not_found');
  END IF;

  UPDATE public.profiles SET wallet_balance = bal + dep.amount WHERE id = dep.user_id;

  INSERT INTO public.wallet_transactions (user_id, amount, type, status, description)
  VALUES (dep.user_id, dep.amount, 'credit', 'completed',
          'Deposit auto-verified (' || coalesce(dep.reference_id, dep.id::text) || ')');

  INSERT INTO public.payments (user_id, amount, method, status, gateway, gateway_transaction_id, reference)
  VALUES (dep.user_id, dep.amount, 'qr', 'completed', 'bharatpay',
          coalesce(p_txn_id, p_bank_ref), dep.reference_id);

  UPDATE public.deposit_requests SET
    status = 'approved',
    credited_amount = dep.amount,
    processed_at = now(),
    admin_note = 'Auto-credited via gateway callback'
  WHERE id = dep.id;

  RETURN jsonb_build_object('ok', true, 'code', 'credited', 'deposit_id', dep.id, 'amount', dep.amount);
END;
$$;

REVOKE ALL ON FUNCTION public.process_bharatpay_callback(uuid, text, text, numeric, text, text, text, text, text, jsonb) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_bharatpay_callback(uuid, text, text, numeric, text, text, text, text, text, jsonb) TO service_role;