ALTER TABLE public.payment_gateways
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS account_number text,
  ADD COLUMN IF NOT EXISTS iban text,
  ADD COLUMN IF NOT EXISTS mobile_number text;