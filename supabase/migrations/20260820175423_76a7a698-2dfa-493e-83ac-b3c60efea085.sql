
-- Final currency stabilization: Set INR as default and apply the 105 rate to all remaining areas.
UPDATE site_settings SET value = 'INR' WHERE key = 'customer_currency';
UPDATE site_settings SET value = '105' WHERE key IN ('usdt_rate', 'usdt_to_inr');
DELETE FROM site_settings WHERE key = 'usdt_to_pkr';

-- Convert any leftover PKR-labeled services to INR using the internal base currency normalization logic
UPDATE services 
SET price_per_1000 = normalized_usdt_cost * 105 
WHERE normalized_usdt_cost IS NOT NULL;

-- Ensure admin has full access to provider_services
GRANT ALL ON public.provider_services TO authenticated;
GRANT ALL ON public.provider_services TO service_role;
