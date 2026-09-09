-- ============================================================
-- 1) Custom Comments support: persist the provider's service
--    "type" (Default / Custom Comments / Mentions / etc.) so the
--    order form knows when to show a comments box, and store the
--    comments text the customer typed on the order itself.
-- ============================================================
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS provider_type text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS comments text;

-- ============================================================
-- 2) Refund clarity: distinguish "cancelled, no refund given" from
--    "refunded" as separate, unambiguous order statuses, so admin
--    (and this dashboard) can always tell at a glance whether money
--    already went back to the customer.
--    'refunded' was already an allowed status value used elsewhere
--    in this project; this just makes sure existing rows that were
--    cancelled-with-refund get correctly reclassified.
-- ============================================================
UPDATE public.orders o
SET status = 'refunded'
WHERE o.status = 'cancelled'
  AND EXISTS (
    SELECT 1 FROM public.wallet_transactions wt
    WHERE wt.user_id = o.user_id
      AND wt.type = 'refund'
      AND wt.description ILIKE '%' || left(o.id::text, 8) || '%'
  );
