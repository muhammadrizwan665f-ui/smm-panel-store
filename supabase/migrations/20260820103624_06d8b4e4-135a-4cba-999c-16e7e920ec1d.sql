-- Ensure USDT is the base for existing providers if not specified
UPDATE public.providers SET currency = 'USDT' WHERE currency IS NULL;

-- Add pricing audit columns to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS provider_currency text,
ADD COLUMN IF NOT EXISTS provider_rate numeric,
ADD COLUMN IF NOT EXISTS usdt_rate_at_calculation numeric,
ADD COLUMN IF NOT EXISTS normalized_usdt_cost numeric,
ADD COLUMN IF NOT EXISTS customer_currency text,
ADD COLUMN IF NOT EXISTS converted_cost numeric,
ADD COLUMN IF NOT EXISTS profit_type text,
ADD COLUMN IF NOT EXISTS profit_value numeric,
ADD COLUMN IF NOT EXISTS customer_price numeric;

-- Ensure settings exist
INSERT INTO public.site_settings (key, value, description)
VALUES 
('customer_currency', 'PKR', 'The active currency for customer pricing'),
('usdt_rate', '290', 'Manual USDT exchange rate against the customer currency'),
('price_rounding', '2_decimals', 'Rounding method for final prices')
ON CONFLICT (key) DO NOTHING;

-- Revoke and Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.services TO service_role;
GRANT ALL ON public.site_settings TO service_role;
