-- Adds an "Account Title" (the name the bank/mobile wallet account is
-- registered under) so customers know exactly whose name to expect when
-- they send payment. Safe to re-run.

ALTER TABLE public.payment_gateways
  ADD COLUMN IF NOT EXISTS account_title text;
